-- # Mobile App Supabase Auth Extension

-- ## Table Structure

CREATE TABLE IF NOT EXISTS auth_ext.mobile (
 id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_name TEXT NOT NULL UNIQUE,
  passcode_hash TEXT NOT NULL,
  passcode_salt TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the auth_reset_tokens table
CREATE TABLE IF NOT EXISTS auth_ext.auth_reset_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- ## Security Best Practices

-- Even though these are just 4-digit passcodes for a work tool, implementing basic security measures is still important:

-- - Salted Hashing: Store a hashed version of the passcode, not plaintext
-- - Rate Limiting: Implement account lockout on multiple failed attempts
-- - Server-Side Validation: Never trust client-side validation alone

-- ## Backend Functions

-- ### User Creation/Passcode Setup

/**
 * Understanding the Passcode Security Implementation
 * This function creates a user with a mobile app passcode using cryptographic security:
 * Salt: A random value (gen_random_uuid()::TEXT) added to passwords before hashing to prevent rainbow table attacks. Each user gets a unique salt.
 * Crypt: A PostgreSQL function that performs password hashing. gen_salt('bf') generates a Blowfish algorithm salt, and crypt() combines the passcode with this salt to create a secure hash.
 * '***': This is a placeholder and should be replaced with proper password management. In a real implementation, you'd either:
 * Use Supabase's built-in auth functions
 * Generate a proper password hash
 * Passcode visibility: No, you cannot see the actual passcode - that's the point of hashing. Even as a database admin, you only see the hash, not the original passcode. This is a security feature.
 * User knowledge: Users need to set or be given their passcode during account creation. The system doesn't store it in plaintext, so there's no way to "recover" it - only reset it.
 * The function should be modified to use proper password management rather than the placeholder.
*/
CREATE OR REPLACE FUNCTION create_user_with_passcode(
  p_email TEXT,
  p_user_name TEXT,
  p_passcode TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_salt TEXT;
  v_passcode_hash TEXT;
BEGIN
  -- Generate salt
  v_salt := gen_random_uuid()::TEXT;

  -- Hash the passcode with salt
  v_passcode_hash := crypt(p_passcode, gen_salt('bf'));

  -- Create auth.users entry first
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
  VALUES (p_email, '******', NOW())  -- Use proper password management
  RETURNING id INTO v_user_id;

  -- Create auth_ext entry
  INSERT INTO auth_ext (id, user_name, passcode_hash, passcode_salt)
  VALUES (v_user_id, p_user_name, v_passcode_hash, v_salt);

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ### Create Mobile App Passcode for Existing Users

CREATE OR REPLACE FUNCTION create_mobile_app_passcode(
  p_user_name TEXT,
  p_passcode TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_salt TEXT;
  v_passcode_hash TEXT;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
  END IF;

  -- Check if username already exists in auth_ext.mobile
  IF EXISTS(SELECT 1 FROM auth_ext.mobile WHERE user_name = p_user_name) THEN
    RAISE EXCEPTION 'Username % already exists', p_user_name;
  END IF;

  -- Generate salt
  v_salt := gen_random_uuid()::TEXT;

  -- Hash the passcode with salt
  v_passcode_hash := crypt(p_passcode, gen_salt('bf'));

  -- Create mobile entry
  INSERT INTO auth_ext.mobile (id, user_name, passcode_hash, passcode_salt, created_at, updated_at)
  VALUES (p_user_id, p_user_name, v_passcode_hash, v_salt, NOW(), NOW());

  RETURN p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- #### Validate Passcode

CREATE OR REPLACE FUNCTION validate_passcode(
  p_user_name TEXT,
  p_passcode TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_max_attempts INTEGER := 5;
  v_lockout_duration INTERVAL := INTERVAL '5 minutes';
BEGIN
  -- Get user record
  SELECT ae.*, au.id as auth_user_id
  INTO v_user_record
  FROM auth_ext ae
  JOIN auth.users au ON ae.id = au.id
  WHERE ae.user_name = p_user_name;

  -- User not found
  IF v_user_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid username or passcode');
  END IF;

  -- Check if account is locked
  IF v_user_record.locked_until IS NOT NULL AND v_user_record.locked_until > v_now THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Account is locked',
      'locked_until', v_user_record.locked_until
    );
  END IF;

  -- Verify passcode
  IF crypt(p_passcode, v_user_record.passcode_hash) = v_user_record.passcode_hash THEN
    -- Successful login
    UPDATE auth_ext.mobile
    SET failed_attempts = 0,
        locked_until = NULL,
        last_login = v_now
    WHERE id = v_user_record.id;

    -- Generate new JWT token (fixed syntax)
    RETURN json_build_object(
      'success', true,
      'user_id', v_user_record.id,
      'token', auth.sign_jwt(json_build_object('user_id', v_user_record.auth_user_id, 'role', 'authenticated'))
    );
  ELSE
    -- Failed login
    UPDATE auth_ext.mobile
    SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
        locked_until = CASE
          WHEN COALESCE(failed_attempts, 0) + 1 >= v_max_attempts
          THEN v_now + v_lockout_duration
          ELSE NULL
        END
    WHERE id = v_user_record.id
    RETURNING failed_attempts INTO v_user_record.failed_attempts;

    -- Return appropriate error
    IF v_user_record.failed_attempts >= v_max_attempts THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Too many failed attempts. Account locked.',
        'locked_until', v_now + v_lockout_duration
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', 'Invalid username or passcode',
        'attempts_remaining', v_max_attempts - v_user_record.failed_attempts
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ### 3. Reset Functionality

Create a function that generates a reset token and notifies your existing auth system:

CREATE OR REPLACE FUNCTION request_passcode_reset(
  p_user_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_reset_token TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth_ext.mobile WHERE user_name = p_user_name;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Generate reset token and store it securely
  v_reset_token := encode(gen_random_bytes(32), 'hex');

  -- Store token in separate reset table with expiration
  INSERT INTO auth_ext.auth_reset_tokens (user_id, token, expires_at)
  VALUES (v_user_id, v_reset_token, NOW() + INTERVAL '1 hour');

  -- Here, you would integrate with your notification system
  -- For example, connecting to your existing auth server actions
  -- PERFORM pg_notify('auth_notifications', json_build_object('type', 'reset_request', 'user_id', v_user_id, 'token', v_reset_token)::text);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset passcode using a reset token
CREATE OR REPLACE FUNCTION reset_passcode_with_token(
  p_token TEXT,
  p_new_passcode TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_salt TEXT;
  v_passcode_hash TEXT;
  v_token_record RECORD;
BEGIN
  -- Find the token and check if it's valid
  SELECT * INTO v_token_record 
  FROM auth_ext.auth_reset_tokens 
  WHERE token = p_token 
    AND expires_at > NOW() 
    AND used_at IS NULL;
  
  IF v_token_record.user_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_user_id := v_token_record.user_id;
  
  -- Generate new salt and hash
  v_salt := gen_random_uuid()::TEXT;
  v_passcode_hash := crypt(p_new_passcode, gen_salt('bf'));
  
  -- Update the passcode
  UPDATE auth_ext.mobile
  SET passcode_hash = v_passcode_hash,
      passcode_salt = v_salt,
      updated_at = NOW(),
      failed_attempts = 0,
      locked_until = NULL
  WHERE id = v_user_id;
  
  -- Mark token as used
  UPDATE auth_ext.auth_reset_tokens
  SET used_at = NOW()
  WHERE token_id = v_token_record.token_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

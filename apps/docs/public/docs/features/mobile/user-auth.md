# Passcode Authentication System Implementation Guide

## Database Schema Design

For implementing the 4-digit passcode system in your Supabase setup, I recommend the following approach:

### 1. Table Structure

Create or modify your `auth_ext` table with these columns:

```sql
CREATE TABLE auth_ext (
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
```

### 2. Security Best Practices

Even though these are just 4-digit passcodes for a work tool, implementing basic security measures is still important:

- **Salted Hashing**: Store a hashed version of the passcode, not plaintext
- **Rate Limiting**: Implement account lockout on multiple failed attempts
- **Server-Side Validation**: Never trust client-side validation alone

## Implementation Approach

### 1. Authentication Flow

```txt
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  Client App  │──────▶  Supabase   │──────▶  RLS Policy  │
└─────────────┘      └─────────────┘      └──────────────┘
       │                    │                     │
       │                    │                     │
       │                    ▼                     │
       │             ┌──────────────┐             │
       │             │  Auth Check   │             │
       │             └──────────────┘             │
       │                    │                     │
       │                    ▼                     │
       │             ┌──────────────┐             │
       └─────────────│   JWT Token   │◀────────────┘
                     └──────────────┘
```

### 2. Backend Functions

#### User Creation/Passcode Setup

```sql
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
```

#### Validate Passcode

```sql
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
    UPDATE auth_ext
    SET failed_attempts = 0,
        locked_until = NULL,
        last_login = v_now
    WHERE id = v_user_record.id;

    -- Generate new JWT token
    RETURN json_build_object(
      'success', true,
      'user_id', v_user_record.id,
      'token', auth.sign_jwt({"user_id": v_user_record.auth_user_id, "role": "authenticated"})
    );
  ELSE
    -- Failed login
    UPDATE auth_ext
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
```

### 3. Reset Functionality

Create a function that generates a reset token and notifies your existing auth system:

```sql
CREATE OR REPLACE FUNCTION request_passcode_reset(
  p_user_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_reset_token TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth_ext WHERE user_name = p_user_name;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Generate reset token and store it securely
  v_reset_token := encode(gen_random_bytes(32), 'hex');

  -- Store token in separate reset table with expiration
  INSERT INTO auth_reset_tokens (user_id, token, expires_at)
  VALUES (v_user_id, v_reset_token, NOW() + INTERVAL '1 hour');

  -- Here, you would integrate with your notification system
  -- For example, connecting to your existing auth server actions
  -- PERFORM pg_notify('auth_notifications', json_build_object('type', 'reset_request', 'user_id', v_user_id, 'token', v_reset_token)::text);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Client Implementation Notes

### 1. API Endpoints

Create Supabase Edge Functions or REST endpoints for:

- `/auth/login` - Submit username and passcode
- `/auth/reset-request` - Request passcode reset
- `/auth/reset` - Submit new passcode with valid token

### 2. Client-Side Security

For the client React app:

```javascript
// Example login function
const loginWithPasscode = async (username, passcode) => {
  try {
    const { data, error } = await supabase.rpc("validate_passcode", {
      p_user_name: username,
      p_passcode: passcode,
    });

    if (error) throw error;

    if (!data.success) {
      // Handle failed login
      if (data.locked_until) {
        const lockTimeRemaining = new Date(data.locked_until) - new Date();
        return {
          success: false,
          locked: true,
          lockTimeRemaining: Math.ceil(lockTimeRemaining / 1000),
        };
      }

      return {
        success: false,
        message: data.message,
        attemptsRemaining: data.attempts_remaining,
      };
    }

    // Login successful - store token
    localStorage.setItem("authToken", data.token);

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An error occurred during login" };
  }
};
```

## Security Considerations

1. **Session Management**:

   - Since the devices are shared, implement shorter session timeouts (e.g., 4 hours)
   - Provide a clear "Sign Out" option
   - Consider auto-logout after periods of inactivity

2. **User Management**:

   - Create an admin interface for supervisors to reset passcodes
   - Implement periodic passcode rotation (e.g., every 90 days)
   - Log all login attempts for auditing

3. **API Security**:
   - Implement HTTPS for all communications
   - Use Supabase RLS policies to restrict data access
   - Never expose the auth_ext table directly to clients

## Integration with Existing Systems

To integrate with your existing auth system:

1. Create a webhook or event listener in your auth server
2. When passcode reset is requested, generate a secure reset link
3. Deliver the link via your existing email/SMS notification system
4. When the link is followed, present a simple passcode reset form

This approach maintains security while leveraging your existing authentication infrastructure.

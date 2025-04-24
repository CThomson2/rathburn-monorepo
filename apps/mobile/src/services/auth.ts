import { createClient } from "@/lib/supabase/client";

/**
 * Response interface for login attempts
 */
interface LogInResponse {
    success: boolean,
    message?: string,
    locked_until?: number,
    attempts_remaining?: number,
    auth_user_id?: string,
    email?: string,
    user_id?: string,
    redirectTo?: string,
}

/**
 * Interface that represents the actual data structure returned by the validate_passcode SQL function
 */
interface ValidatePasscodeResponse {
    success: boolean,
    message?: string,
    locked_until?: string,
    attempts_remaining?: number,
    user_id?: string,
    email?: string,
    auth_user_id?: string,
}

/**
 * Login to the app using a passcode. If the login fails, the response will contain
 * a message and the number of attempts remaining. If the user is locked out, the
 * response will contain the remaining lock time in seconds.
 *
 * @param {string} username The username to log in with
 * @param {string} passcode The passcode to use for authentication
 * @returns {Promise<{success: boolean, message?: string, attemptsRemaining?: number, locked?: boolean, lockTimeRemaining?: number}>}
 */
export async function loginWithPasscode(
  username: string,
  passcode: string
): Promise<LogInResponse> {
  console.log(`[AUTH] Attempting login for username: ${username}`);
  
  try {
    // Clear out any existing auth data first
    console.log("[AUTH] Clearing any existing auth data");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userDisplayName");
    
    // Input validation
    if (!username || !passcode) {
      console.log("[AUTH] Login failed: Username or passcode missing");
      return { success: false, message: "Username and passcode are required" };
    }

    if (passcode.length !== 4) {
      console.log("[AUTH] Login failed: Invalid passcode format");
      return { success: false, message: "Passcode must be 4 digits" };
    }

    // Check for too many login attempts
    const failedAttemptsKey = `failed_login_${username}`;
    const lockoutKey = `lockout_${username}`;
    const failedAttempts = parseInt(localStorage.getItem(failedAttemptsKey) || "0");
    const lockoutTime = localStorage.getItem(lockoutKey);

    if (lockoutTime) {
      const lockoutUntil = new Date(lockoutTime);
      if (new Date() < lockoutUntil) {
        const minutesLeft = Math.ceil(
          (lockoutUntil.getTime() - new Date().getTime()) / (1000 * 60)
        );
        console.log(`[AUTH] Login blocked: Account is locked for ${minutesLeft} more minutes`);
        return {
          success: false,
          message: `Too many failed attempts. Try again in ${minutesLeft} minute${
            minutesLeft > 1 ? "s" : ""
          }.`,
        };
      } else {
        // Lockout period is over, reset counters
        console.log("[AUTH] Lockout period ended, resetting counters");
        localStorage.removeItem(lockoutKey);
        localStorage.removeItem(failedAttemptsKey);
      }
    }

    console.log("[AUTH] Calling validate_passcode RPC");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("validate_passcode", {
      p_user_name: username,
      p_passcode: passcode,
    });

    if (error) {
      console.error("[AUTH] RPC error:", error);
      
      // Increment failed attempts counter
      const newFailedAttempts = failedAttempts + 1;
      localStorage.setItem(failedAttemptsKey, newFailedAttempts.toString());

      // If this is the 5th failed attempt, lock the account
      if (newFailedAttempts >= 5) {
        const lockoutMinutes = 15;
        const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        localStorage.setItem(lockoutKey, lockoutUntil.toString());
        console.log(`[AUTH] Account locked for ${lockoutMinutes} minutes due to too many failed attempts`);
        return {
          success: false,
          message: `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`,
        };
      }

      return { 
        success: false, 
        message: `Invalid username or passcode. ${5 - newFailedAttempts} attempts remaining.` 
      };
    }

    // Login successful
    console.log("[AUTH] Login successful, RPC returned:", data);
    
    // Cast data to the expected response type
    const responseData = data as ValidatePasscodeResponse;
    
    if (!responseData?.user_id) {
      console.error("[AUTH] Missing user_id in response data");
      return { success: false, message: "Authentication error. Please try again." };
    }

    // Reset failed attempts counter on successful login
    localStorage.removeItem(failedAttemptsKey);
    localStorage.removeItem(lockoutKey);

    // Store user data in localStorage
    console.log("[AUTH] Storing user data in localStorage:", {
      userId: responseData.user_id,
      userName: username,
      userRole: "user",
      userDisplayName: username
    });
    
    localStorage.setItem("userId", responseData.user_id);
    localStorage.setItem("userName", username);
    localStorage.setItem("userRole", "user");
    localStorage.setItem("userDisplayName", username);
    
    console.log("[AUTH] Login complete, user is now authenticated");
    return { 
      success: true, 
      message: "Login successful. Redirecting...",
      redirectTo: "/", 
      user_id: responseData.user_id,
      email: responseData.email,
      auth_user_id: responseData.auth_user_id
    };
  } catch (err) {
    console.error("[AUTH] Unexpected error during login:", err);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

/**
 * Log out the user by clearing both Supabase auth and custom localStorage auth
 * 
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const logout = async () => {
  try {
    const supabase = createClient();
    
    // Clear Supabase auth session
    await supabase.auth.signOut();
    
    // Clear localStorage auth data
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      message: "An error occurred during logout" 
    };
  }
};

/**
 * Request a passcode reset for a user. This will generate a reset token
 * and return success or failure.
 * 
 * @param {string} username The username to request a reset for
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const requestPasscodeReset = async (username: string) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("request_passcode_reset", {
      p_user_name: username
    });

    if (error) throw error;

    if (data === true) {
      return { 
        success: true, 
        message: "Reset request submitted successfully. You will receive instructions shortly." 
      };
    } else {
      return { 
        success: false, 
        message: "Username not found. Please check your username and try again." 
      };
    }
  } catch (error) {
    console.error("Reset request error:", error);
    return { 
      success: false, 
      message: "An error occurred while requesting a reset. Please try again later." 
    };
  }
};

/**
 * Reset a passcode using a reset token.
 * 
 * @param {string} token The reset token received via email or SMS
 * @param {string} newPasscode The new passcode to set (must be 4 digits)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const resetPasscodeWithToken = async (token: string, newPasscode: string) => {
  // Validate the passcode format
  if (!/^\d{4}$/.test(newPasscode)) {
    return {
      success: false,
      message: "Passcode must be exactly 4 digits"
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("reset_passcode_with_token", {
      p_token: token,
      p_new_passcode: newPasscode
    });

    if (error) throw error;

    if (data === true) {
      return {
        success: true,
        message: "Your passcode has been successfully reset. You can now log in with your new passcode."
      };
    } else {
      return {
        success: false,
        message: "Invalid or expired reset token. Please request a new passcode reset."
      };
    }
  } catch (error) {
    console.error("Passcode reset error:", error);
    return {
      success: false,
      message: "An error occurred while resetting your passcode. Please try again later."
    };
  }
};

/**
 * Create a mobile app passcode for an existing authenticated user.
 * Requires the user to be authenticated via Supabase Auth (email/password or SSO).
 * 
 * @param {string} username The username to create
 * @param {string} passcode The 4-digit passcode to set
 * @param {string} userId The UUID of the user from Supabase Auth
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const createMobilePasscode = async (username: string, passcode: string, userId: string) => {
  // Validate the passcode format
  if (!/^\d{4}$/.test(passcode)) {
    return {
      success: false,
      message: "Passcode must be exactly 4 digits"
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_mobile_app_passcode", {
      p_user_name: username,
      p_passcode: passcode,
      p_user_id: userId
    });

    if (error) {
      if (error.message.includes("already exists")) {
        return {
          success: false,
          message: "This username is already taken. Please choose another."
        };
      }
      throw error;
    }

    return {
      success: true,
      message: "Mobile passcode created successfully. You can now sign in with your username and passcode."
    };
  } catch (error) {
    console.error("Create passcode error:", error);
    return {
      success: false,
      message: "An error occurred while creating your passcode. Please try again later."
    };
  }
};

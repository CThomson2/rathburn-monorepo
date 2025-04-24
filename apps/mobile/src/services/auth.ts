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
export const loginWithPasscode = async (
  username: string,
  passcode: string
) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("validate_passcode", {
      p_user_name: username,
      p_passcode: passcode,
    });
    
    if (error) throw error;

    if (!data.success) {
      // Handle failed login
      if (data.locked_until) {
        // Convert timestamp to milliseconds and calculate difference
        const lockTimeRemaining = (data.locked_until * 1000) - Date.now();
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

    // Login successful - store user data
    if (data.user_id) {
      localStorage.setItem("userId", data.user_id);
      localStorage.setItem("userName", username);
    }
    
    // Set the user as authenticated in your app state
    // This is a simpler approach - for production, you might want to
    // create a proper session with Supabase Auth
    
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An error occurred during login" };
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

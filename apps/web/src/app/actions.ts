"use server";

import { encodedRedirect } from "@/utils/middleware";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server actions for authentication flows
 *
 * This file contains all server actions related to authentication:
 * - Sign up
 * - Sign in
 * - Password reset
 * - Sign out
 *
 * These actions are called from form submissions and handle the communication
 * with Supabase Auth.
 *
 * Note: The email verification callback is handled in /app/auth/callback/route.ts
 * When you click the verification link, it:
 * 1. Exchanges the code for a session
 * 2. Sets the session cookie
 * 3. Redirects to the protected page
 */

/**
 * Handles user registration
 * @param formData Form data containing email and password
 * @returns Redirect with success or error message
 */
export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

/**
 * Handles user authentication
 * @param formData Form data containing email and password
 * @returns Redirect to protected area or error message
 */
export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Redirect to the dashboard after successful sign-in
  return redirect("/");
};

/**
 * Handles the sign in with MS Azure AD
 * @returns Redirect to the Microsoft sign-in page
 */
export const signInWithMicrosoftAction = async () => {
  // if (process.env.NODE_ENV !== "production") {
  //   return encodedRedirect(
  //     "error",
  //     "/sign-in",
  //     "Not available in development mode"
  //   );
  // }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      scopes: "offline_access email",
      redirectTo: `https://rathburn.co.uk/auth/callback`, // Web app redirect URL
      queryParams: {
        // Mark this as coming from the web app
        app_source: "web",
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect(data.url);
};

/**
 * Initiates password reset flow
 * @param formData Form data containing email
 * @returns Redirect with success or error message
 */
export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

/**
 * Completes password reset process
 * @param formData Form data containing new password and confirmation
 * @returns Redirect with success or error message
 */
export const resetPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password update failed"
    );
  }

  return encodedRedirect("success", "/reset-password", "Password updated");
};

/**
 * Signs out the current user
 * @returns Redirect to sign-in page
 */
export const signOutAction = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

/**
 * Updates the user's phone number
 * @param formData Form data containing phone number
 * @returns Redirect with success or error message
 */
export const updatePhoneAction = async (formData: FormData) => {
  const supabase = createClient();

  // Get phone input and remove all spaces
  let phone = formData.get("phone")?.toString().replace(/\s+/g, "");

  if (!phone) {
    return encodedRedirect("error", "/protected", "Phone number is required");
  }

  // Validate UK phone number format (07xxx, 7xxx, +44xxx, or 44xxx)
  const ukPhoneRegex = /^(07\d{9}|7\d{9}|\+?44\d{10})$/;
  if (!ukPhoneRegex.test(phone)) {
    return encodedRedirect(
      "error",
      "/protected",
      "Please enter a valid UK mobile number"
    );
  }

  // Convert to E.164 format (+44...)
  if (phone.startsWith("07")) {
    // Convert 07xxx to +447xxx
    phone = "+44" + phone.substring(1);
  } else if (phone.startsWith("7")) {
    // Convert 7xxx to +447xxx
    phone = "+44" + phone;
  } else if (phone.startsWith("44") && !phone.startsWith("+44")) {
    // Convert 44xxx to +44xxx
    phone = "+" + phone;
  }

  // Final E.164 format validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(phone)) {
    return encodedRedirect(
      "error",
      "/protected",
      "Phone number conversion to E.164 format failed"
    );
  }

  const { error } = await supabase.auth.updateUser({
    phone,
  });

  if (error) {
    return encodedRedirect("error", "/protected", error.message);
  }

  return encodedRedirect("success", "/protected", "Phone number updated");
};

/**
 * Adds email/password login method to an existing user (e.g., Microsoft Azure user)
 * @param formData Form data containing the email and new password
 * @returns Redirect with success or error message
 */
export const addEmailLoginToUserAction = async (formData: FormData) => {
  const supabase = createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/account/add-email-login",
      "All fields are required"
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/account/add-email-login",
      "Passwords do not match"
    );
  }

  // First verify the user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return encodedRedirect(
      "error",
      "/account/add-email-login",
      "You must be logged in to add an email login method"
    );
  }

  // Check if email matches current user's email
  if (session.user.email !== email) {
    return encodedRedirect(
      "error",
      "/account/add-email-login",
      "Email must match your account email"
    );
  }

  // Add password to the user account
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("Error adding email login:", error);
    return encodedRedirect(
      "error",
      "/account/add-email-login",
      error.message || "Failed to add email login"
    );
  }

  return encodedRedirect(
    "success",
    "/account",
    "Email login method added successfully. You can now log in with your email and password."
  );
};

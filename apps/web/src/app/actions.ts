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
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

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
  const supabase = await createClient();

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
 * Initiates password reset flow
 * @param formData Form data containing email
 * @returns Redirect with success or error message
 */
export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
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
  const supabase = await createClient();

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
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

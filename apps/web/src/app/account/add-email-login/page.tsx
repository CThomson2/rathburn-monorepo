"use client";

import { addEmailLoginToUserAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { FormMessage } from "@/components/layout/auth/form-message";
import { SubmitButton } from "@/components/layout/auth/submit-button";
import { useAuth } from "@/lib/supabase/client-auth";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Component for adding an email login method to a user's account.
 *
 * This page allows users to add an email/password login method
 * to their account, enabling them to sign in using email and password
 * in addition to Microsoft authentication.
 *
 * The user's current email is displayed and must match the email
 * associated with their account. Users must enter and confirm a new
 * password that is at least 8 characters long.
 *
 * If the user is not authenticated, a "Not Authorized" message is shown
 * with a link to the sign-in page. If authentication is loading, a loading
 * message is displayed.
 *
 * @returns A form to add email login method or an authorization message.
 */

export default function AddEmailLoginPage() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [userEmail, setUserEmail] = useState("");

  // Get message and type from URL
  const message = searchParams?.get("message") || "";
  const type = searchParams?.get("type") || "";

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Not Authorized</h1>
          <p className="text-gray-600 mb-4">
            You must be logged in to access this page.
          </p>
          <Link href="/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Add Email Login Method</h1>
        <p className="text-gray-600 mb-4">
          This will allow you to sign in using your email and password in
          addition to Microsoft authentication.
        </p>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={userEmail}
              readOnly
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500">
              Email address must match your current account email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              minLength={8}
              required
            />
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              minLength={8}
              required
            />
          </div>

          <SubmitButton
            pendingText="Adding email login..."
            formAction={addEmailLoginToUserAction}
          >
            Add Email Login
          </SubmitButton>

          <FormMessage
            message={{
              message: message || "",
              type: type as "error" | "success" | "",
            }}
          />

          <div className="pt-2">
            <Link href="/account">
              <Button variant="outline" className="w-full">
                Back to Account
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

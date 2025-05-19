"use client";

import { resetPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/layout/auth/submit-button";
import { FormMessage } from "@/components/layout/auth/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

/**
 * Reset Password page to finalize password reset after clicking email link
 */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Get message and type from URL
  const message = searchParams?.get("message") || "";
  const type = searchParams?.get("type") || "";

  // Check if user has valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Import dynamically to avoid server/client mismatch
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch (error) {
        console.error("Error checking session:", error);
        setHasSession(false);
      }
    };

    checkSession();
  }, []);

  // Display loading state while checking session
  if (hasSession === null) {
    return (
      <div className="flex-1 flex flex-col min-w-64">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  // Display error if no session is found
  if (hasSession === false) {
    return (
      <div className="flex-1 flex flex-col min-w-64">
        <h1 className="text-2xl font-medium">Reset Password</h1>
        <Separator className="my-4" />

        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
          <h2 className="text-red-800 font-medium">Session Expired</h2>
          <p className="text-red-700 mt-2">
            Your password reset session has expired or is invalid. Please
            request a new password reset link from the sign-in page.
          </p>
          <a
            href="/forgot-password"
            className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Request New Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Reset Password</h1>
      <p className="text-sm text-foreground mt-1">
        Enter a new password for your account.
      </p>

      <form>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="password">New Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Enter new password"
            required
            minLength={8}
          />

          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm new password"
            required
            minLength={8}
          />

          <SubmitButton
            pendingText="Updating Password..."
            formAction={resetPasswordAction}
          >
            Reset Password
          </SubmitButton>

          <FormMessage
            message={
              {
                message: message || "",
                type: type as "error" | "success" | "",
              } as any
            }
          />
        </div>
      </form>
    </div>
  );
}

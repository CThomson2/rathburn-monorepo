"use client";

import { forgotPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/layout/auth/submit-button";
import { FormMessage } from "@/components/layout/auth/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Page for requesting a password reset
 */
export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();

  // Get message and type from URL
  const message = searchParams?.get("message") || "";
  const type = searchParams?.get("type") || "";

  return (
    <div className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Forgot Password</h1>
      <p className="text-sm text-foreground mt-1">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      <form>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
          />

          {/* Hidden input to redirect back to this page for displaying messages */}
          <input type="hidden" name="callbackUrl" value="/forgot-password" />

          <SubmitButton
            pendingText="Sending..."
            formAction={forgotPasswordAction}
          >
            Send Reset Link
          </SubmitButton>

          <FormMessage
            message={
              {
                message: message || "",
                type: type as "error" | "success" | "",
              } as any
            }
          />

          <div className="text-center mt-4">
            <Link
              href="/sign-in"
              className="text-sm text-foreground hover:underline"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

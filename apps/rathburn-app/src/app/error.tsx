"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("type");
  const errorMessage = searchParams.get("message");

  // Common error messages based on type
  const errorMessages = {
    auth: {
      title: "Authentication Error",
      description: "There was a problem with your authentication.",
      action: "Please try signing in again.",
      actionLink: "/sign-in",
      actionText: "Sign In",
    },
    email: {
      title: "Email Verification Failed",
      description: "Your email verification link has expired or is invalid.",
      action: "Please request a new verification email.",
      actionLink: "/sign-up",
      actionText: "Request New Link",
    },
    default: {
      title: "Something Went Wrong",
      description: "An unexpected error occurred.",
      action: "Please try again or contact support if the problem persists.",
      actionLink: "/",
      actionText: "Go Home",
    },
  };

  const currentError = errorType
    ? errorMessages[errorType as keyof typeof errorMessages]
    : errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {currentError.title}
            </h1>
            <p className="text-muted-foreground">
              {errorMessage || currentError.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Link
              href={currentError.actionLink}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {currentError.actionText}
            </Link>

            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
              <span>•</span>
              <Link
                href="/"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

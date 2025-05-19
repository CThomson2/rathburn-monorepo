import MicrosoftSvg from "@/assets/svg/microsoft.svg";
import { signInAction, signInWithMicrosoftAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/layout/auth/form-message";
import { SubmitButton } from "@/components/layout/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

// Debug component to show layout detection
function LayoutDebug() {
  return (
    <div className="fixed top-0 left-0 m-1 p-2 text-xs bg-black/80 text-white rounded z-50">
      Auth Page - Should NOT show sidebar
    </div>
  );
}

/**
 * Page for signing in to the app.
 *
 * @param {Object} props
 * @prop {Promise<Message>} searchParams - Promise that resolves to a message
 * to display to the user.
 *
 * @returns {JSX.Element}
 */
export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col min-w-64">
      {/* <LayoutDebug /> */}
      <form>
        <h1 className="text-2xl font-medium">Sign in</h1>
        <p className="text-sm text-foreground">
          Don&apos;t have an account?{" "}
          <Link
            className="text-foreground font-medium underline"
            href="/sign-up"
          >
            Sign up
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-xs text-foreground underline"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
          />
          <SubmitButton pendingText="Signing In..." formAction={signInAction}>
            Sign in
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
      <div className="mt-4 flex justify-center">
        <Link className="text-xs text-foreground underline" href="/magic-link">
          Sign in with a magic link instead
        </Link>
      </div>
      <form className="flex flex-col gap-2">
        <SubmitButton
          pendingText="Connecting..."
          formAction={signInWithMicrosoftAction}
          className="bg-white text-black border border-gray-600 hover:border-black hover:bg-gray-300"
        >
          <Image src={MicrosoftSvg} alt="Microsoft" />
          Sign in with Microsoft
        </SubmitButton>
      </form>
    </div>
  );
}

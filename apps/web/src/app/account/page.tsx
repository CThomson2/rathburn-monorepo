import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error fetching user or no user found:", userError);
    redirect("/login");
  }

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username") // Only select username as avatar isn't used here
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    // Ignore row not found
    console.error("Error fetching profile:", profileError);
    // Optionally handle profile fetch error differently
  }

  const userName = profile?.username ?? user.email?.split("@")[0] ?? "User"; // Use profile username, fallback to derived from email, then 'User'
  const userEmail = user.email ?? "No email provided";

  // Password update server action
  const updatePassword = async (formData: FormData) => {
    "use server";
    const password = formData.get("password") as string;
    const supabase = await createClient();

    if (!password || password.length < 6) {
      console.error("Password must be at least 6 characters long.");
      // Removed explicit return to satisfy form action type
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      console.error("Error updating password:", error.message);
      // Removed explicit return to satisfy form action type
      return;
    }

    console.log("Password updated successfully");
    // Removed explicit return to satisfy form action type
    // Consider redirecting or using client-side state for feedback
    // For example: redirect('/account?message=Password+updated');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            View your account information and manage your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Username</Label>
            <Input id="name" value={userName} readOnly disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              readOnly
              disabled
            />
          </div>

          <Separator />

          <form action={updatePassword} className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg">Update Password</CardTitle>
              <CardDescription>
                Enter a new password for your account. This is only applicable
                if you signed up using email/password or if your OAuth provider
                does not manage your password.
              </CardDescription>
            </CardHeader>
            <div className="space-y-1">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
              />
            </div>
            {/* Optional: Confirm Password Field */}
            {/* <div className="space-y-1">
               <Label htmlFor="confirmPassword">Confirm New Password</Label>
               <Input id="confirmPassword" name="confirmPassword" type="password" required />
             </div> */}
            <Button type="submit" className="w-full">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

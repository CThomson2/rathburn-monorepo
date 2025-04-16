import { createClient } from "@/lib/supabase/server";
import {
  InfoIcon,
  Mail,
  Phone,
  Calendar,
  UserCircle,
  KeyIcon,
  AlertCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { updatePhoneAction } from "../actions";
import { Input } from "@/components/core/ui/input";
import { SubmitButton } from "@/components/desktop/layout/auth/submit-button";
import { Label } from "@/components/core/ui/label";
import {
  FormMessage,
  Message,
} from "@/components/desktop/layout/auth/form-message";

export default async function ProtectedPage({
  searchParams,
}: {
  searchParams: Message;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Extract creation date from timestamp
  const createdAt = user.created_at ? new Date(user.created_at) : null;
  const formattedDate = createdAt
    ? format(createdAt, "MMMM d, yyyy")
    : "Unknown";

  // Get user role (this might need adjustment based on your actual data structure)
  const role = user.app_metadata?.role || "User";

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome to your account dashboard
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="font-bold text-2xl mb-6 text-gray-800">Your Profile</h2>

        <div className="space-y-6">
          <div className="flex items-start gap-3 pb-4 border-b">
            <Mail className="text-blue-500 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-gray-700">Email Address</h3>
              <p className="text-gray-600">
                {user.email || "No email provided"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b">
            <Phone className="text-blue-500 mt-0.5" size={20} />
            <div className="w-full">
              <h3 className="font-medium text-gray-700">Phone Number</h3>
              {user.phone ? (
                <p className="text-gray-600">{user.phone}</p>
              ) : (
                <form className="mt-1 flex flex-row gap-2">
                  <div className="flex items-center justify-between text-md  text-muted-foreground">
                    <Label htmlFor="phone">+44</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="7890 123456"
                      className="text-sm max-w-[20%] min-w-52"
                      name="phone"
                      id="phone"
                    />
                    <SubmitButton
                      pendingText="Saving..."
                      formAction={updatePhoneAction}
                      className="w-24"
                    >
                      Save
                    </SubmitButton>
                  </div>
                  <FormMessage message={searchParams} />
                </form>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b">
            <Calendar className="text-blue-500 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-gray-700">Account Created</h3>
              <p className="text-gray-600">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b">
            <UserCircle className="text-blue-500 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-gray-700">Role</h3>
              <p className="text-gray-600">{role}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <KeyIcon className="text-blue-500 mt-1" size={20} />
            <div>
              {/* <h3 className="font-medium text-gray-700">Reset Password</h3> */}
              <Link
                href="/protected/reset-password"
                className="text-blue-500 hover:text-blue-700 transition-colors inline-block mt-1"
              >
                Reset Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

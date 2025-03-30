import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Main dashboard page
 * This page automatically redirects users to their role-specific dashboard
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get the current session
  // Yes, that's correct. Use getUser() for server-side code (including middleware and Server Components) 
  //    as it's more secure by validating the token with Supabase Auth
  // Use getSession() primarily for client-side operations where you need session details.

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // If no session, redirect to sign in
    redirect('/sign-in');
  }
  
  // Get user profile with role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error || !profile) {
    // If error fetching profile, show a generic dashboard
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard</h1>
        <p>It looks like your user profile is not completely set up.</p>
        <p>Please contact an administrator to assign you a proper role.</p>
        <p>Email: <a href="mailto:conrad@rathburn.app">conrad@rathburn.app</a></p>
        <p>Phone: <a href="tel:+447375298220">07375 298220</a></p>
      </div>
    );
  }
  
  // Redirect based on role
  switch (profile.role) {
    case 'production':
      redirect('/dashboard/production');
      break;
    case "inventory":
      redirect("/dashboard/inventory");
      break;
    case "management":
      redirect("/dashboard/management");
      break;
    default:
      // Generic dashboard for users without a specific role
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard</h1>
          <p>Your role is not recognised. Please contact an administrator.</p>
        </div>
      );
  }
  
  // This return is not actually reached due to redirects above,
  // but TypeScript requires it
  return null;
} 
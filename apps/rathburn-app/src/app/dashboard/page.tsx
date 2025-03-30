import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/**
 * Main dashboard page
 * This page will eventually redirect users tor their role-specific dashboard
 * Currently showing simple links until profiles table is set up
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // If no session, redirect to sign in
    redirect('/sign-in');
  }
  
  // Temporarily disabled profile-based routing until profiles table is set up
  /*
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
  */
  
  // Temporary dashboard with links until profiles table is set up
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard</h1>
      <p className="mb-4">Please select your dashboard view:</p>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Link 
          href="/dashboard/production"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
        >
          Production Dashboard
        </Link>
        
        <Link 
          href="/dashboard/inventory"
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
        >
          Inventory Dashboard
        </Link>
        
        <Link 
          href="/dashboard/management"
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
        >
          Management Dashboard
        </Link>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        Note: Role-based redirection will be enabled once the profiles table is set up.
      </p>
    </div>
  );
}
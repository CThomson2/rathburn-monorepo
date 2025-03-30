import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

/**
 * Dashboard layout component
 * This provides shared UI elements for all dashboards and checks authentication
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirect to sign-in if not authenticated
    redirect('/sign-in');
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar navigation */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="font-bold text-xl">Rathburn App</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a href="/dashboard" className="block p-2 hover:bg-gray-100 rounded">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/inventory" className="block p-2 hover:bg-gray-100 rounded">
                Inventory
              </a>
            </li>
            <li>
              <a href="/messages" className="block p-2 hover:bg-gray-100 rounded">
                Messages
              </a>
            </li>
            <li>
              <a href="/settings" className="block p-2 hover:bg-gray-100 rounded">
                Settings
              </a>
            </li>
            {/* Add more navigation items as needed */}
          </ul>
        </nav>
      </div>
      
      {/* Main content area */}
      <div className="flex-1">
        {/* Top navigation bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between">
          <div>
            {/* Breadcrumb navigation could go here */}
          </div>
          <div className="flex items-center space-x-4">
            {/* User profile dropdown */}
            <div>
              <button className="flex items-center space-x-2">
                <span>{session.user.email}</span>
                {/* Avatar or icon could go here */}
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 
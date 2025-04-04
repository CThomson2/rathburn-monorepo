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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to sign-in if not authenticated
    redirect("/sign-in");
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
              <a
                href="/dashboard"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="/dashboard/admin"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Admin
              </a>
            </li>
            <li>
              <a
                href="/dashboard/management"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Management
              </a>
            </li>
            <li>
              <a
                href="/dashboard/workflow"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Workflow
              </a>
            </li>
          </ul>
          <br />
          <hr />
          <br />
          <ul>
            <li>
              <a
                href="/inventory/drums"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Drum Stock (temp)
              </a>
            </li>
            <li>
              <a
                href="/inventory/orders/new"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                New Order (temp)
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
          <div>{/* Breadcrumb navigation could go here */}</div>
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
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

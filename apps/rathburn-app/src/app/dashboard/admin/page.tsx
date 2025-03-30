import { createClient } from '@/lib/supabase/server';

/**
 * Admin Dashboard
 * This dashboard is specifically designed for administrative clerks
 */
export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Admin Tasks Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Admin Tasks</h2>
          <div className="space-y-2">
            <p>Pending Orders: <span className="font-medium">5</span></p>
            <p>Invoices to Process: <span className="font-medium">7</span></p>
            <p>Support Tickets: <span className="font-medium text-red-600">3 urgent</span></p>
          </div>
        </div>
        
        {/* Financial Overview Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Financial Overview</h2>
          <div className="space-y-2">
            <p>Monthly Revenue: <span className="font-medium">£24,560</span></p>
            <p>Outstanding Invoices: <span className="font-medium">£8,320</span></p>
            <p>Expense Claims: <span className="font-medium">£1,250</span> pending</p>
          </div>
        </div>
        
        {/* System Status Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">System Status</h2>
          <div className="space-y-2">
            <p>Inventory System: <span className="font-medium text-green-600">Online</span></p>
            <p>Accounting System: <span className="font-medium text-green-600">Online</span></p>
            <p>Production System: <span className="font-medium text-green-600">Online</span></p>
          </div>
        </div>
      </div>
      
      {/* Recent Invoices */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Recent Invoices</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Invoice #</th>
                <th className="text-left py-2 px-3">Client</th>
                <th className="text-left py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Due Date</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">INV-001</td>
                <td className="py-2 px-3">ABC Company</td>
                <td className="py-2 px-3">£2,500</td>
                <td className="py-2 px-3">15/04/2023</td>
                <td className="py-2 px-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span></td>
                <td className="py-2 px-3">
                  <button className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">INV-002</td>
                <td className="py-2 px-3">XYZ Ltd</td>
                <td className="py-2 px-3">£3,750</td>
                <td className="py-2 px-3">20/04/2023</td>
                <td className="py-2 px-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded">Paid</span></td>
                <td className="py-2 px-3">
                  <button className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">INV-003</td>
                <td className="py-2 px-3">123 Industries</td>
                <td className="py-2 px-3">£1,850</td>
                <td className="py-2 px-3">25/04/2023</td>
                <td className="py-2 px-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded">Overdue</span></td>
                <td className="py-2 px-3">
                  <button className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* User Management */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">User Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Role</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Last Login</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">John Smith</td>
                <td className="py-2 px-3">john@example.com</td>
                <td className="py-2 px-3">Production</td>
                <td className="py-2 px-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded">Active</span></td>
                <td className="py-2 px-3">Today</td>
                <td className="py-2 px-3">
                  <button className="text-blue-600 hover:underline mr-2">Edit</button>
                  <button className="text-red-600 hover:underline">Disable</button>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Sarah Johnson</td>
                <td className="py-2 px-3">sarah@example.com</td>
                <td className="py-2 px-3">Management</td>
                <td className="py-2 px-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded">Active</span></td>
                <td className="py-2 px-3">Yesterday</td>
                <td className="py-2 px-3">
                  <button className="text-blue-600 hover:underline mr-2">Edit</button>
                  <button className="text-red-600 hover:underline">Disable</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
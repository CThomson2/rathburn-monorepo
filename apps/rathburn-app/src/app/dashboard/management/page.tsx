import { createClient } from '@/lib/supabase/server';

/**
 * Management Dashboard
 * This dashboard is specifically designed for site managers
 */
export default async function ManagementDashboard() {
  const supabase = await createClient();
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Management Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Site Overview Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Site Overview</h2>
          <div className="space-y-2">
            <p>Staff Present: <span className="font-medium">12/15</span></p>
            <p>Production Status: <span className="font-medium text-green-600">On Track</span></p>
            <p>Maintenance Requests: <span className="font-medium">2</span></p>
          </div>
        </div>
        
        {/* Key Metrics Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Key Metrics</h2>
          <div className="space-y-2">
            <p>Weekly Production: <span className="font-medium">92%</span> of target</p>
            <p>Quality Control: <span className="font-medium text-green-600">97%</span> pass rate</p>
            <p>Inventory Level: <span className="font-medium text-yellow-600">Medium</span></p>
          </div>
        </div>
        
        {/* Staffing Status Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Staffing Status</h2>
          <div className="space-y-2">
            <p>Production: <span className="font-medium text-green-600">Fully Staffed</span></p>
            <p>Maintenance: <span className="font-medium text-yellow-600">1 Absence</span></p>
            <p>Quality Control: <span className="font-medium text-green-600">Fully Staffed</span></p>
          </div>
        </div>
      </div>
      
      {/* Schedule Overview */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">This Week's Schedule</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2 text-center font-medium">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            <div className="bg-blue-100 p-2 rounded">Product A</div>
            <div className="bg-blue-100 p-2 rounded">Product A</div>
            <div className="bg-green-100 p-2 rounded">Product B</div>
            <div className="bg-green-100 p-2 rounded">Product B</div>
            <div className="bg-yellow-100 p-2 rounded">Maintenance</div>
            <div className="bg-purple-100 p-2 rounded">Product C</div>
            <div className="bg-gray-100 p-2 rounded">Closed</div>
          </div>
        </div>
      </div>
      
      {/* Pending Approvals */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Pending Approvals</h2>
        <div className="space-y-3">
          <div className="border-b pb-2 flex justify-between items-center">
            <div>
              <p className="font-medium">Overtime Request</p>
              <p className="text-sm text-gray-500">Requested by John Doe</p>
            </div>
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                Approve
              </button>
              <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                Deny
              </button>
            </div>
          </div>
          <div className="border-b pb-2 flex justify-between items-center">
            <div>
              <p className="font-medium">Material Order</p>
              <p className="text-sm text-gray-500">Requested by Production Team</p>
            </div>
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                Approve
              </button>
              <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                Deny
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
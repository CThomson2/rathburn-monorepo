import { createClient } from '@/lib/supabase/server';

/**
 * Production Manager Dashboard
 * This dashboard is specifically designed for production managers
 */
export default async function ProductionDashboard() {
  const supabase = await createClient();
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get user dashboard settings
  // You would replace this with your actual query
  const { data: settings } = await supabase
    .from('dashboard_settings')
    .select('settings')
    .eq('user_id', session?.user.id)
    .single();
  
  // Get production-specific data (this is a placeholder)
  // You would replace this with actual production data queries
  const { data: productionStats } = await supabase
    .from('production_stats')
    .select('*')
    .order('date', { ascending: false })
    .limit(5);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Production Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Production Overview Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Production Overview</h2>
          <div className="space-y-2">
            <p>Daily Target: <span className="font-medium">150 units</span></p>
            <p>Current Output: <span className="font-medium">87 units</span></p>
            <p>Efficiency: <span className="font-medium">92%</span></p>
          </div>
        </div>
        
        {/* Upcoming Production Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Upcoming Production</h2>
          <ul className="space-y-2">
            <li>• Product A: 50 units (Due: Tomorrow)</li>
            <li>• Product B: 75 units (Due: Wednesday)</li>
            <li>• Product C: 25 units (Due: Friday)</li>
          </ul>
        </div>
        
        {/* Inventory Status Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Inventory Status</h2>
          <div className="space-y-2">
            <p>Raw Materials: <span className="font-medium text-green-600">Good</span></p>
            <p>Components: <span className="font-medium text-yellow-600">Low</span></p>
            <p>Packaging: <span className="font-medium text-green-600">Good</span></p>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="space-y-3">
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">Today, 10:45 AM</p>
            <p>Completed production run of Product A</p>
          </div>
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">Today, 9:30 AM</p>
            <p>Started production of Product B</p>
          </div>
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">Yesterday, 4:15 PM</p>
            <p>Maintenance completed on Machine #3</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Log Production
          </button>
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Report Issue
          </button>
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Request Materials
          </button>
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Schedule Maintenance
          </button>
        </div>
      </div>
    </div>
  );
} 
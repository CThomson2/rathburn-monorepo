# Live Stock Count Dashboard

```ts
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const StockCountDashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalLocations: 0,
    entriesByUser: [],
    entriesByLocation: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('stock_count_changes')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'stock_count_entries' },
          payload => {
        // Refresh data when changes occur
        fetchDashboardData();
      })
      .subscribe();

    // Cleanup subscription
    return () => supabase.removeChannel(subscription);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get total unique items counted
      const { data: uniqueItems, error: itemsError } = await supabase
        .from('stock_count_entries')
        .select('material_name')
        .limit(1000);

      if (itemsError) throw itemsError;

      // Get total locations counted
      const { data: uniqueLocations, error: locationsError } = await supabase
        .from('stock_count_entries')
        .select('location')
        .limit(1000);

      if (locationsError) throw locationsError;

      // Get entries by user
      const { data: userEntries, error: userError } = await supabase
        .from('stock_count_entries')
        .select('counted_by, count')
        .limit(1000);

      if (userError) throw userError;

      // Get entries by location
      const { data: locationEntries, error: locationError } = await supabase
        .from('stock_count_entries')
        .select('location, count')
        .group('location')
        .limit(1000);

      if (locationError) throw locationError;

      // Get recent activity
      const { data: recentActivity, error: activityError } = await supabase
        .from('stock_count_entries')
        .select('*')
        .order('count_date', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Process data for charts
      const uniqueItemsCount = new Set(uniqueItems.map(item => item.material_name)).size;
      const uniqueLocationsCount = new Set(uniqueLocations.map(loc => loc.location)).size;

      // Process entries by location for chart
      const locationData = locationEntries.map(entry => ({
        name: entry.location,
        count: entry.count
      }));

      setStats({
        totalItems: uniqueItemsCount,
        totalLocations: uniqueLocationsCount,
        entriesByLocation: locationData,
        recentActivity: recentActivity || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Stock Count Progress Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Total Items Count */}
            <Card>
              <CardHeader>

```

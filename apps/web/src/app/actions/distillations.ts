/**
 * Fetches distillation schedules for the next 14 days from ui.v_distillation_schedule
 * 
 * @returns {Promise<DistillationScheduleDay[]>} Array of distillation schedules grouped by day
 */
export async function fetchDistillationSchedule14Days(): Promise<DistillationScheduleDay[]> {
  try {
    return await withSupabaseClient(async (supabase: SupabaseClient) => {
      // Get today's date and the date 14 days from now
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);
      
      // Format dates for query
      const startDate = today.toISOString().split('T')[0];
      const endDate = twoWeeksLater.toISOString().split('T')[0];
      
      // Query distillation schedules in the date range
      const { data, error } = await supabase
        .from('ui.v_distillation_schedule')
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      
      // Group schedules by date
      return groupSchedulesByDay(data || []);
    });
  } catch (error) {
    console.error("Error fetching distillation schedules:", error);
    return [];
  }
}

// Helper function to group schedules by day
function groupSchedulesByDay(schedules: any[]): DistillationScheduleDay[] {
  const days: { [key: string]: DistillationScheduleDay } = {};
  
  schedules.forEach(schedule => {
    const date = schedule.scheduled_date.split('T')[0]; // Extract YYYY-MM-DD
    
    if (!days[date]) {
      const scheduleDate = new Date(date);
      days[date] = {
        date,
        formattedDate: scheduleDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        schedules: []
      };
    }
    
    days[date].schedules.push({
      id: schedule.id,
      scheduled_date: schedule.scheduled_date,
      material: {
        name: schedule.material_name,
        type: schedule.material_type
      },
      status: schedule.status,
      operator: schedule.operator_name ? {
        name: schedule.operator_name,
        id: schedule.operator_id
      } : undefined,
      still_id: schedule.still_id,
      notes: schedule.notes,
      created_at: schedule.created_at,
      updated_at: schedule.updated_at
    });
  });
  
  // Convert to array and sort by date
  return Object.values(days).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

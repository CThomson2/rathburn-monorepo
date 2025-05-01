# Feature - Realtime Operational Management Dashboard

> A comprehensive operational management dashboard that focuses on monitoring operational activity using supabase realtime and subscriptions to certain tables and events. A highly interactive page, with both SQL-driven analytics views, as well as functionality for creating and managing tasks - which are created in a DB table which the mobile app used by workers subscribes to. Audienece/users: for non-technical business stakeholders, primarily management and supervisors.

## Dashboard Overview

The dashboard is organized into four main tabs:

1. **Overview** - Provides a high-level snapshot of all operational activities
2. **Realtime** - Live activity log of barcode scans streaming in from `logs.drum_scan` table as workers perform operational scanning activities
3. **Tasks** - For detailed task management and assignment
4. **Devices** - Monitors the status of mobile scanning devices
5. **Workers** - Shows worker availability and performance

### Key Features

#### Real-time Monitoring

- **Live Activity Feed**: Shows scan events as they occur, with color-coded badges for different event types
- **Device Status**: Shows which devices are online/offline, battery levels, and current users
- **Summary Statistics**: KPI cards showing total scans, success rates, active devices, and pending tasks

#### Visual Data Representation

- **Activity Type Distribution**: Pie chart showing the breakdown of different scan types (intake, transport, etc.)
- **Hourly Activity**: Bar chart displaying scan frequency throughout the day
- **Color-coded Status Indicators**: For quick visual identification of priorities and statuses

#### Task Management

- **Task Assignment Modal**: A comprehensive form for creating new transport tasks
- **Priority Levels**: Clear visual distinction between urgent, high, medium, and low priority tasks
- **Worker Assignment**: Easily assign tasks to available workers

#### Notifications

- **System Alerts**: Important notifications are highlighted and categorized by type
- **Device Warnings**: Low battery alerts and other device-related notifications

### User Experience Considerations

1. **Progressive Disclosure**: The most important information is immediately visible, with details available on demand
2. **Consistent Visual Language**: Color-coding is consistent across the interface (e.g., green for success, red for errors)
3. **Simplified Workflows**: Complex actions like task assignment are broken down into logical steps in a modal dialog
4. **Real-time Updates**: Live data feeds provide immediate feedback on operational activities
5. **Mobile-Friendly Layout**: Responsive grid layouts that work well on various screen sizes

### Implementation Notes

1. **State Management**: Uses React useState hooks for local component state
2. **Data Visualization**: Utilizes Recharts for simple, clean charts
3. **UI Components**: Leverages Shadcn UI components for a consistent look and feel
4. **Modals vs. Routes**: Uses modal dialogs for focused tasks rather than separate routes
5. **Real-time Data**: Sets up event listeners for live updates from your SSE endpoint

## Next Steps and Considerations

1. **Server Actions Integration**: Connect the task creation form to your server actions
2. **Database Schema**: Set up tables for tasks, scan events, notifications, and device status
3. **Mobile App Integration**: Ensure the real-time updates are pushed to mobile devices
4. **User Testing**: Since this is for non-technical users, conduct usability testing early

This dashboard design prioritizes clarity and simplicity for non-technical users while providing comprehensive operational visibility. The modal approach keeps users in context rather than navigating between different pages, which is ideal for monitoring activities where maintaining awareness of the overall system state is important.

Would you like me to focus on any specific aspect of this dashboard in more detail?
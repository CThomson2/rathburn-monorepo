# Warehouse Mobile App UI/UX Design Documentation

## Overview

This document outlines the design specifications for the Rathburn Inventory mobile app, a PWA designed for industrial-grade barcode scanning devices running Android OS. The app serves as a crucial tool for warehouse workers to manage inventory through scanning workflows for goods reception, transport, and production processes.

## Design Principles

The design prioritizes:

1. **Simplicity**: Intuitive navigation and clear workflows for non-technical users
2. **Large Touch Targets**: Designed for workers who may be wearing gloves
3. **High Contrast**: Optimized for varying warehouse lighting conditions
4. **Visual Feedback**: Clear status indicators for scanning operations
5. **Consistency**: Predictable patterns across all screens

## Color System

The app uses a color system that provides clear visual cues for different workflows:

- **Primary Color (Blue #2563EB)**: Used for main UI elements and transport tasks
- **Secondary Colors**:
  - Green (#16A34A): For successful operations and "Goods In" tasks
  - Amber (#F59E0B): For urgent tasks
  - Red (#DC2626): For errors and warnings

## Typography

- **Base Font**: System sans-serif font with fallback to Inter
- **Hierarchy**:
  - Page titles: 20px (1.25rem), bold
  - Section headers: 18px (1.125rem), semibold
  - Card titles: 16px (1rem), semibold
  - Body text: 14px (0.875rem), regular
  - Secondary text: 12px (0.75rem), regular

## Layout Structure

The app follows a consistent layout structure across all screens:

### 1. App Header
- Fixed position at the top
- Contains app title and connection status
- Context-specific information based on current screen

### 2. Main Content Area
- Scrollable container for the primary content
- Adaptive padding for readability (16px on all sides)
- Bottom padding adjusts to accommodate the fixed navigation

### 3. Bottom Navigation
- Fixed position at the bottom
- Large tap targets (64px height)
- Clear icons with labels for each main section

## Core Navigation

The app uses a bottom tab navigation with four main sections:

1. **Dashboard/Tasks**: List of current and upcoming tasks
2. **Scan**: Direct access to scanning functionality
3. **History**: Record of completed tasks and activities
4. **Settings**: User preferences and app configuration

## Screen Designs

### Dashboard Screen

The dashboard serves as the app's home screen and displays:

1. **Today's Tasks**: A prioritized list of transport tasks that need immediate attention.
   - Each task card displays:
     - Task type (Transport, Goods In)
     - Material and quantity
     - Source/destination information
     - Priority indicator (Urgent, Scheduled)
     - Action button to start the task

2. **Upcoming Arrivals**: 
   - Shows scheduled "Goods In" tasks for future deliveries
   - Displays expected delivery date, supplier information, and purchase order details
   - Provides a quick view of incoming inventory

#### Visual Treatment:
- Transport tasks use left border with blue or amber color coding for priority
- Cards include clear, large tap targets for interaction
- Urgent tasks are visually distinguished with a prominent badge

### Scan Screen

The scan screen is optimized for quick access to the device's scanner functionality:

1. **Scanning Interface**:
   - Large scan target area with visual indicator
   - Current task information displayed clearly
   - Progress indicator showing scanned vs. required items
   - Option for manual barcode entry (fallback)

2. **During Active Scanning Session**:
   - Real-time feedback on successful/failed scans
   - List of already scanned items
   - Clear instructions for the current scanning stage

#### Visual Treatment:
- Minimal distractions to keep focus on the scanning task
- High contrast elements for visibility in varied lighting conditions
- Large touch targets for operation while wearing gloves

### History Screen

The history screen provides a chronological record of completed tasks:

1. **Recent Activity**:
   - Filterable list of completed tasks
   - Each entry shows:
     - Task type with distinctive icon
     - Summary information (material, quantity, location)
     - Timestamp
     - Status indicator

2. **Activity Details**:
   - Tapping an activity shows detailed information
   - Complete record of items processed
   - Associated metadata (batch numbers, operator, timestamps)

#### Visual Treatment:
- Timeline-style presentation with visual grouping by day
- Color-coded icons for different task types
- Compact but readable format for scanning through history

### Settings Screen

The settings screen provides user-specific preferences and application settings:

1. **User Profile**:
   - Current user information
   - Account settings
   - Quick switching between profiles

2. **Operational Settings**:
   - Scanner preferences (sound, vibration)
   - Display options (theme, text size)
   - Connectivity settings

3. **System Information**:
   - App version
   - Last sync time
   - Database connection status

#### Visual Treatment:
- Clear separation between setting categories
- Toggle switches for binary options
- Straightforward language for all settings

## Task Workflows

The app supports two primary task workflows: Transport Tasks and Goods In Tasks. Each workflow is designed as a guided, step-by-step process.

### Transport Task Workflow

The transport task workflow guides users through moving drums from stock to production:

1. **Task Selection**:
   - User selects a transport task from the dashboard
   - Task details show material, quantity, source, and destination

2. **From Stock Stage**:
   - Clear instructions to scan drums from stock location
   - Progress indicator showing drums scanned vs. required
   - Real-time validation of scanned drums against requirements
   - Successful scans update drum status to "in_transport"

3. **To Lab/Still Stage**:
   - Navigation guidance to the destination location
   - Instructions to scan drums upon arrival
   - Confirmation of successful delivery
   - Updates drum status to "in_production"

4. **Completion**:
   - Success confirmation screen
   - Summary of the completed transport
   - Option to return to dashboard

#### Visual Treatment:
- Progress bar showing the current stage in the workflow
- Color-coded success/failure feedback for each scan
- Clear step-by-step instructions
- Large action buttons for moving between stages

### Goods In Workflow

The goods in workflow guides users through receiving and labeling new inventory:

1. **Task Selection**:
   - User selects a "Goods In" task from the dashboard or upcoming arrivals
   - Task details show expected delivery information

2. **Labeling Stage**:
   - Form for entering batch information (batch number, expiry date)
   - Option to print labels for the drums
   - Clear count of labels needed

3. **Scanning Stage**:
   - Instructions to apply labels and scan each drum
   - Progress indicator showing drums scanned vs. expected
   - Real-time validation of scanned drums
   - Successful scans update drum status to "in_stock"

4. **Completion**:
   - Success confirmation screen
   - Summary of the received inventory
   - Option to return to dashboard

#### Visual Treatment:
- Progress bar showing the current stage in the workflow
- Color-coded (green) visual elements for "Goods In" tasks
- Dialog for batch information entry
- Clear feedback for each successful scan

## Component Library

The app utilizes ShadcnUI components, customized for optimal touch interaction:

### 1. Cards
- Primary containers for information
- Padding: 16px
- Border radius: 8px
- Optional colored left border for status indication

### 2. Buttons
- Minimum height: 48px for primary actions
- Clear visual states (default, hover, active, disabled)
- Variants:
  - Primary: Filled with primary color
  - Secondary: Subdued background
  - Outline: Border only
  - Ghost: Minimal styling for secondary actions
  - Destructive: Red for cancellation or removal actions

### 3. Badges
- Visual status indicators
- Compact design
- Color-coded variants:
  - Default: Subtle background
  - Secondary: Primary color
  - Outline: Border only
  - Destructive: Red for alerts

### 4. Progress Indicators
- Linear progress bars for multi-stage workflows
- Circular progress indicators for scanning operations
- Clear labeling of stages

### 5. Form Elements
- Large input fields (min height: 48px)
- Clear labels
- Validation feedback
- Dropdown menus with sufficient spacing between options

### 6. Dialogs and Alerts
- Focused modal dialogs for important actions
- Alert components for feedback and notifications
- Toast notifications for non-intrusive feedback

## Responsive Behavior

While designed primarily for industrial Android devices, the app maintains responsiveness:

1. **Portrait Optimization**:
   - Primary design targets portrait orientation
   - Key actions accessible with one hand

2. **Landscape Adaptation**:
   - Maintains functionality when device is rotated
   - Adjusts layout for widescreen display when needed

3. **Device Considerations**:
   - Optimized for industrial scanner screens (5-6 inches)
   - Touch targets sized for gloved operation
   - High contrast elements for outdoor/warehouse visibility

## Offline Capability

As a PWA, the app maintains critical functionality during connectivity disruptions:

1. **Offline Mode Indicators**:
   - Clear visual indication when working offline
   - Sync status displayed in header

2. **Data Persistence**:
   - Tasks and scanning data cached locally
   - Automatic sync when connection is restored
   - Conflict resolution for simultaneous edits

## Accessibility Considerations

The app is designed to be usable in challenging warehouse environments:

1. **Visual Accessibility**:
   - High contrast text and UI elements
   - Clear iconography with text labels
   - Sufficient text size for readability at arm's length

2. **Physical Accessibility**:
   - Large touch targets for gloved operation
   - Critical actions positioned within thumb reach
   - Minimal reliance on complex gestures

3. **Cognitive Accessibility**:
   - Clear, simple instructions at each stage
   - Consistent patterns across similar workflows
   - Error prevention through validation and confirmation

## Implementation Notes

### Technology Stack
- React for component architecture
- Vite for build tooling
- Tailwind CSS for styling
- ShadcnUI for component library
- Zustand for state management
- PWA features for offline capability

### Performance Considerations
- Minimal animations to preserve battery life
- Efficient rendering for industrial devices
- Optimized asset loading for potentially slow connections
- Careful memory management for long scanning sessions

## Future Enhancements

Potential areas for future expansion:

1. **Advanced Reporting**:
   - Enhanced history views with filtering and search
   - Export capabilities for task records

2. **User Role Management**:
   - Differentiated interfaces based on user role
   - Permission-based access to sensitive operations

3. **Integration Enhancements**:
   - Direct communication with label printers
   - Integration with other warehouse systems

4. **Dashboard Customization**:
   - User-specific dashboard layouts
   - Favorite or pinned tasks

5. **Communication Features**:
   - In-app messaging between workers
   - Task assignment notifications
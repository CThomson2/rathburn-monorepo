# Purchase Orders System Documentation

## Overview

The Purchase Orders system streamlines the entire workflow of ordering raw materials, from initial creation to receipt and inventory tracking. This document explains how the system works from a user perspective and outlines the features designed to make ordering as efficient as possible.

## Accessing the Order System

The order system is accessible to authenticated users from any page within the application through a consistent interface. This design ensures that placing orders is always just a click away, regardless of where you are in the system.

## Three-Stage Order Process

### Stage 1: Order History Reference

When you click to create a new order, the system first displays your recent orders for reference. This quick overview helps you:

- See what's already been ordered
- Check status of pending orders
- Reference previous supplier and material combinations

While this view provides essential information at a glance, more detailed historical data is available on a dedicated Orders page for in-depth analysis and reporting.

### Stage 2: Create New Order

The order creation form balances flexibility with data integrity:

- **Purchase Order Number**: Automatically suggests the next sequential PO number while allowing custom values
- **Supplier Selection**: Dropdown of existing suppliers with search functionality
- **Order Date**: Defaults to today with calendar selection for alternate dates
- **Expected Arrival**: Optional field to set the anticipated delivery date
- **Materials**: Add one or more materials to the order with quantity and optional weight

#### Smart Material Selection

The system intelligently suggests materials based on your supplier selection. This means:

- When you select a supplier, the material dropdown adjusts to show only relevant options
- Similarly, selecting a material first will filter the supplier options accordingly
- This reduces errors and speeds up the order creation process

#### Data Validation

The form uses controlled inputs to ensure data quality:

- Values must match existing reference data in the database
- Descriptive error messages guide you if invalid data is entered
- Required fields are clearly marked

#### Adding New Suppliers or Materials

If you need to order from a new supplier or add a new material type:

1. This can be done through a dedicated section in the application
2. Once added, these new entries become immediately available in the order form
3. No system administrator intervention is required

### Stage 3: Order Confirmation & Labels

After creating an order:

1. **Success Notification**: A toast notification appears confirming successful order creation
2. **Barcode Labels**: The system generates printable barcode labels for each drum in the order
3. **PDF Download**: Labels can be downloaded as a PDF for printing and application to drums upon arrival

## Mobile Integration for Receiving

Each new order automatically creates a task in the mobile application, which:

1. Notifies warehouse staff about incoming materials
2. Provides all relevant order details
3. Enables barcode scanning to process received items

### Task Management Options

Understanding that orders often have lead times, the system offers:

- **Immediate Task**: By default, tasks appear immediately in the mobile app
- **Postponed Task**: Option to add the task to a backlog for future activation
- This helps maintain task efficiency by only showing workers what's relevant for their current timeframe

## Database Integration

Behind the scenes, the system:

- Records all order details in a structured database
- Tracks each unique material-supplier combination
- Automatically creates new inventory item records when needed
- Updates inventory levels when items are received

### Material-Supplier Intelligence

The system maintains a relationship between materials and their suppliers:

- Each distinct material-supplier combination is tracked separately
- This allows for detailed cost comparison across suppliers
- Future orders become increasingly streamlined as the system learns your ordering patterns

## Benefits

This integrated approach to purchase orders delivers:

1. **Efficiency**: Minimal clicks from order creation to completion
2. **Accuracy**: Data validation prevents common errors
3. **Traceability**: Complete history of all orders and receipts
4. **Accountability**: Clear task assignment for receiving materials
5. **Visibility**: Real-time status updates throughout the process

The system's functional, minimalist design focuses on guiding users through the order process with just the right information at each step, eliminating unnecessary complexity while ensuring all essential data is captured.

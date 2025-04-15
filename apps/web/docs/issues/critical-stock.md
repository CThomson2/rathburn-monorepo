# Critical Stock Tracking System

## Overview

This issue covers the implementation of a critical stock tracking system for raw materials. The system will analyze historical data to derive usage rates, establish critical threshold levels for each material, and display the most critical items on the dashboard.

## 1. Database Structure for Historical Stock Data

- [ ] Add timestamps to current stock tables to track historical data points
- [ ] Create a `stock_history` table to store daily/weekly snapshots of material stock levels
- [ ] Add fields for tracking delivery dates, stock levels, and material IDs
- [ ] Implement an automated process to record stock levels at regular intervals (daily/weekly)

## 2. Analysis of Historical Usage Patterns

- [ ] Write SQL queries to analyze the data and derive the following for each material:

  - [ ] Weekly stock levels over the entire dataset time period
  - [ ] Stock count of each material right before new deliveries arrive
  - [ ] Variance in stock quantity cycles (consistency of low points)
  - [ ] Time periods between successive reorder deliveries with corresponding start/end stock levels and dates
    - [ ] Tabulated data, with columns for material ID, start date, end date, start stock level, end stock level
    - [ ] Graphical representation (column chart) of stock levels, variance, regularity of deliveries etc. of different materials over time

  ```sql
  SELECT
    material_id,
    DATE_TRUNC('week', date) AS week_start,
    AVG(stock_level) AS average_stock_level
  FROM stock_history

  ```

## 3. Usage Rate Calculation

- [ ] Implement formula for average daily/weekly usage rate for each material:

  ```sql
  Average Daily Usage = Total Drums Arrived / Number of Days in Period
  ```

- [ ] Add adjustment factors to account for seasonal variations or outliers
- [ ] Create a table to store computed usage rates for each material
- [ ] Build automated process to recalculate usage rates periodically

## 4. Critical Threshold Determination

- [ ] Implement the standard reorder point formula:

  ```sql
  Reorder Point = (Average Daily Usage × Lead Time in Days) + Safety Stock
  ```

- [ ] Define parameters for determining lead time for each material
- [ ] Create logic for calculating safety stock based on historical demand variability
- [ ] For materials without lead time data, implement percentile-based approach using historical stock levels
- [ ] Determine appropriate warning level (e.g., 150% of critical level) for each material

## 5. Critical Score Implementation

- [ ] Create a formula for calculating critical score for each material:

  ```sql
  Critical Score = (Current Stock - Threshold) / Threshold
  ```

- [ ] Implement sorting mechanism to rank materials by criticality
- [ ] Create database table to store critical scores and thresholds for each material
- [ ] Build automated process to update critical scores daily/weekly

## 6. Dashboard Integration

- [ ] Create a widget to display the top 3 most critical materials
- [ ] Implement visual indicators (color-coding, progress bars) to show proximity to thresholds
- [ ] Add detailed view to display full list of materials ordered by criticality
- [ ] Include context information (current stock, threshold, usage rate) for each material

## 7. Data Visualization for Stakeholders (Optional)

- [ ] Create graphs showing stock level trends for 5-15 high-volume materials
- [ ] Implement visualization of stock cycles with highlighted critical points
- [ ] Add forecasting lines to predict when materials will reach critical levels
- [ ] Build exportable reports for stakeholder meetings

## 8. Future Enhancements

- [ ] Implement ABC classification for materials (high/medium/low value)
- [ ] Integrate with forecasted demand data
- [ ] Add notifications system for critical stock alerts
- [ ] Create automated reorder suggestions based on critical thresholds

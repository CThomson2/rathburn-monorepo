# Task: Implement an Interactive Time Series Graph for Inventory Data

## Objective

Implement a TradingView-inspired interactive time series visualization for inventory data in our NextJS application, connecting to our PostgreSQL database.

## Data Requirements

- **Source**: PostgreSQL database with stock_history table
- **Time Range**: 3 years of historical data
- **Key Metrics**: Stock quantity over time
- **Data Structure**: Generate database types to understand the schema (and use them in the code to maintain type safety)

## Visualization Requirements

1. **Interactive Time Axis**:

   - Allow users to zoom in/out on specific time periods
   - Support smooth drag functionality for time window adjustment
   - Provide preset time period options (1W, 1M, 3M, 1Y, 3Y)

2. **Dynamic Detail Level**:

   - Show smooth spline curves for larger time periods (1Y+)
   - Display individual data points when zoomed in (1W, 1M)
   - Implement appropriate data aggregation based on zoom level

3. **Filtering Capabilities**:
   - Filter by drum_type (raw material vs. reprocessed)
   - Filter by material_code (hexane, methanol, etc.)
   - Filter by supplier_id/supplier_name
   - Support multiple simultaneous filters

## Technical Considerations

1. **Data Fetching Strategy**:

   - Determine optimal approach between:
     - Server Components with direct database queries
     - API routes with parameterized queries
     - Supabase stored procedures vs. dynamic query building
   - Consider data volume and performance implications

2. **State Management**:

   - Handle filter state and time window selections
   - Manage loading states during data fetching

3. **Library Selection**:
   - Evaluate charting libraries compatible with NextJS
   - Consider bundle size, performance, and feature requirements

## Deliverables

1. Component architecture for the visualization page
2. Data fetching implementation
3. Interactive chart with all required filtering capabilities
4. Responsive design for various screen sizes

## Additional Context on Schema Design

`stock_history` table fields:

- `id` as unique key for each record
- `date` for time-axis
- `material_code` for each individual material identifier and to separate them to sum their quantitative data across the time period (similar to a financial stock symbol)
- `change` field (each record has a value for the number of stock units involved in the event: positive for new drums arriving in stock, negative for drums leaving inventory to be processed)
- `supplier_id` for each supplier of the material
  - join to `ref_supplier` to get `supplier_name`
- `drum_type` for each drum type of the material
  - overarching categorisation of the material between these two types
- `order_id` for each order of the material
- `order_detail_id` for each order detail of the material
- `distillation_detail_id` for each distillation detail of the material

## Related SQL views to review and consider implementing into the plan for developing this stock data graph page

1. `vw_stock_history_analysis` - (joins logically relatedtables together for fully comprehensive information flow for each inventory event)

2. `vw_order_history` - a full historical record log of raw material orders placed at our company

3. `vw_supplier_analysis` - tabulated information on suppliers to be used for comparisons, decision-making on supplier selection, reducing the numerical stats into a simple 5 star rating to rank suppliers, find outliers in terms of different operational factors, etc. This would not be graphed, but displayed as table data or similar.

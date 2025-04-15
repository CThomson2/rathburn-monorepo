I need you to enhance my inventory dashboard system by fixing several layout issues and connecting it to real database data. Please analyze the following files:

1. src/components/layout/dashboard-layout.tsx
2. src/app/(routes)/inventory-dashboard/page.tsx
3. src/utils/supabase/server.ts
4. src/types/models/database.types.ts (for database schema)

Then implement these specific improvements:

## 1. Fix the Sidebar Navigation Highlighting

- [ ] The sidebar navigation in dashboard-layout.tsx doesn't correctly highlight the active page. When clicking any link, only the Dashboard link stays highlighted. Modify the code to track and highlight the current route properly using NextJS router capabilities.

## 2. Fix Duplicate Layout Elements

- [ ] There appears to be two nested layouts creating duplicate headers with profile/bell icons. Identify where this duplication occurs and streamline the layout structure to have only one header with these elements.

## 3. Improve Page Content Spacing

- [ ] After fixing the layout issues, ensure the page content expands to fill the view appropriately with proper spacing/padding/margins. The content is currently constrained unnecessarily.

## 4. Replace Mock Data with Real Database Queries

- [ ] Update the inventory dashboard to use real data from Supabase instead of mock data:

a) For the category pie chart (Categories tab):

- [ ]- Use data from the `ref_materials` table (fields: value, code, chemical_group)
- [ ]- Join with `stock_drums` where status = "in_stock"
- [ ]- Count drums by chemical_group to create the pie chart segments

b) For the trends chart (Trends tab):

- [ ]- Replace the inventory value trend with a count of "in_stock" drums over time
- [ ]- Use `stock_drum.created_at` to calculate the number of drums in stock at each date point
- [ ]- Create a time series of the total count

c) Maintain the other elements (Order Form and Alerts) as they are for now

Please implement these changes while maintaining the overall visual style and component structure of the dashboard. Add appropriate error handling for database queries and loading states where needed.

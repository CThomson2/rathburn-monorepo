# Issue 31: Initial Stock Barcode System with CT47 Scanner Integration

> The stock history page needs to be connected to live Supabase data, replacing the current mock data implementation while maintaining the existing ShadcnUI design. This document outlines the implementation approach.

## Current State

- Page has a well-designed UI using ShadcnUI components
- Layout includes:
  - Material search functionality
  - Main stock history chart
  - Filter controls
  - Analytics section with tabs
- Currently using mock data throughout

## Implementation Steps

### 1. Data Layer Setup

Create a new hooks directory in the stock history feature folder:

`/src/app/(routes)/stock-history/hooks/`

Create the following hooks:

- `useStockHistory.ts` - [ ] Main data fetching hook
- `useMaterialSearch.ts` - [ ] Material search functionality
- `useStockAnalytics.ts` - [ ] Analytics data processing

Set up Supabase query types using the generated database types:

```ts
type StockHistoryView =
  Database["public"]["Views"]["vw_stock_history_analysis"]["Row"];
type MaterialRef = Database["public"]["Tables"]["ref_materials"]["Row"];
type SupplierRef = Database["public"]["Tables"]["ref_suppliers"]["Row"];
```

### 2. Data Fetching Implementation

**Stock History Data**

Implement `useStockHistory` hook:

- [ ] Query `vw_stock_history_analysis` view
- [ ] Add filtering by material code, date range, and supplier
- [ ] Implement data transformation for chart format
- [ ] Add error handling and loading states

**Material Search**

Implement `useMaterialSearch` hook:

- [ ] Query `ref_materials` table
- [ ] Add debounced search functionality
- [ ] Implement type-ahead suggestions
- [ ] Cache results for performance

**Analytics Data**

Implement `useStockAnalytics` hook:

- [ ] Query relevant views based on selected mode:
  - [ ] Summary: Aggregate stock history data
  - [ ] Materials: Group by material analysis
  - [ ] Suppliers: Use `vw_supplier_analysis` view

### 3. Component Updates

**Update MaterialSearch component**

- [ ] Connect to `useMaterialSearch` hook
- [ ] Implement auto-complete functionality
- [ ] Add loading states

**Update StockHistoryChart component**

- [ ] Connect to `useStockHistory` hook
- [ ] Add loading skeleton
- [ ] Implement error boundary
- [ ] Add empty state handling

**Update FilterControls component**

- [ ] Connect filters to data fetching
- [ ] Add supplier dropdown using Supabase data
- [ ] Implement filter persistence using URL params

**Update StockHistoryStats component**

- [ ] Connect to `useStockAnalytics` hook
- [ ] Implement mode-specific visualizations
- [ ] Add loading states for each tab

### 4. Performance Optimization

1. Implement data caching:

- [ ] Use TanStack Query's caching capabilities
- [ ] Set up appropriate cache invalidation
- [ ] Implement optimistic updates where applicable

2. Add pagination/infinite scroll:

- [ ] Implement for large datasets
- [ ] Add virtual scrolling for performance

3. Optimize query performance:
   - [ ] Review and optimize Supabase queries
   - [ ] Add appropriate indexes if needed
   - [ ] Implement query result limiting

### 5. Error Handling & Edge Cases

**Implement error boundaries**

- [ ] Add fallback UI for each component
- [ ] Handle network errors gracefully
- [ ] Add retry mechanisms

**Add empty states**

- [ ] Design and implement empty state UI
- [ ] Handle "no results" scenarios
- [ ] Add user guidance for zero-state

**Handle loading states**

- [ ] Add loading skeletons
- [ ] Implement progressive loading
- [ ] Maintain UI responsiveness

### 6. Testing

1. Unit Tests:

   - [ ] Test all hooks
   - [ ] Test data transformation functions
   - [ ] Test filter logic

2. Integration Tests:

   - [ ] Test component integration
   - [ ] Test data flow
   - [ ] Test error scenarios

3. E2E Tests:
   - [ ] Test full page functionality
   - [ ] Test real data scenarios
   - [ ] Test performance metrics

### Success Criteria

- [ ] All components connected to live Supabase data
- [ ] Smooth loading states and transitions
- [ ] Error handling for all edge cases
- [ ] Performance metrics meeting targets:
  - [ ] Initial load < 2s
  - [ ] Subsequent interactions < 200ms
  - [ ] Chart updates < 100ms

### Dependencies

- [ ] Supabase client setup
- [ ] Database types generation
- [ ] TanStack Query configuration
- [ ] ShadcnUI components

### Timeline

1. Data Layer Setup: 1 day
2. Data Fetching Implementation: 2 days
3. Component Updates: 2 days
4. Performance Optimization: 1 day
5. Error Handling & Edge Cases: 1 day
6. Testing: 1 day
   Total: **8 working days**

### Notes

- [ ] Maintain existing UI/UX while implementing live data
- [ ] Focus on performance and user experience
- [ ] Implement progressive enhancement
- [ ] Follow TypeScript best practices
- [ ] Maintain test coverage throughout implementation

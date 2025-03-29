# Data Fetching with TanStack Query in Next.js: Comprehensive Guide

![TanStack Query + Next.js](/images/tanstack-nextjs.png)

## Table of Contents

1. [Introduction to TanStack Query](#introduction-to-tanstack-query)
2. [Setting Up TanStack Query in Next.js](#setting-up-tanstack-query-in-nextjs)
   - [Installation](#installation)
   - [Provider Configuration](#provider-configuration)
   - [Integration with Next.js App Router](#integration-with-nextjs-app-router)
3. [Basic Queries](#basic-queries)
   - [Fetching Data with useQuery](#fetching-data-with-usequery)
   - [Query Keys and Structure](#query-keys-and-structure)
   - [Working with Query Results](#working-with-query-results)
4. [Advanced Queries](#advanced-queries)
   - [Pagination](#pagination)
   - [Filtering and Sorting](#filtering-and-sorting)
   - [Infinite Queries](#infinite-queries)
   - [Parallel Queries](#parallel-queries)
5. [Mutations](#mutations)
   - [Basic Mutations](#basic-mutations)
   - [Optimistic Updates](#optimistic-updates)
   - [Coordinating Mutations and Queries](#coordinating-mutations-and-queries)
6. [Server-Side Rendering with TanStack Query](#server-side-rendering-with-tanstack-query)
   - [Hydration Overview](#hydration-overview)
   - [SSR Pattern](#ssr-pattern)
   - [ISR and SSG Considerations](#isr-and-ssg-considerations)
7. [TanStack Table Integration](#tanstack-table-integration)
   - [Basic Table Setup](#basic-table-setup)
   - [Table with Server-Side Operations](#table-with-server-side-operations)
8. [Custom Hooks Pattern](#custom-hooks-pattern)
   - [Creating API Service Hooks](#creating-api-service-hooks)
   - [Composing Complex Data Requirements](#composing-complex-data-requirements)
9. [Real-Time Updates](#real-time-updates)
   - [Polling Strategies](#polling-strategies)
   - [WebSockets and SSE](#websockets-and-sse)
10. [Performance Optimization](#performance-optimization)
    - [Caching Strategies](#caching-strategies)
    - [Prefetching](#prefetching)
    - [Suspense and Error Boundaries](#suspense-and-error-boundaries)
11. [Best Practices](#best-practices)
    - [Query Organization](#query-organization)
    - [TypeScript Integration](#typescript-integration)
    - [Testing Strategies](#testing-strategies)
12. [Conclusion](#conclusion)

## Introduction to TanStack Query

TanStack Query (formerly React Query) is a powerful data-fetching library for React applications that simplifies server state management. It's particularly well-suited for applications like manufacturing inventory systems where you need to:

- Fetch, cache, and update server data
- Handle loading and error states
- Manage background updates and refetching
- Coordinate complex data dependencies

At its core, TanStack Query provides a set of hooks that make working with asynchronous data intuitive while eliminating much of the boilerplate traditionally associated with data fetching.

For a manufacturing inventory management application, TanStack Query excels because it:

1. **Separates server state from UI state**: Keep your database-backed data (inventory, orders, materials) separate from UI state (form inputs, selections)
2. **Handles caching automatically**: Reduce network requests while ensuring data freshness
3. **Provides loading and error states**: Easily display loading spinners and error messages
4. **Supports real-time updates**: Keep inventory counts and order statuses current
5. **Works seamlessly with server-rendered data**: Play well with Next.js data fetching strategies

## Setting Up TanStack Query in Next.js

### Installation

First, install the required packages:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
# or
yarn add @tanstack/react-query @tanstack/react-query-devtools
```

### Provider Configuration

Create a QueryClient provider to wrap your application:

```tsx:app/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default values for manufacturing inventory app
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Integration with Next.js App Router

Add the provider to your layout:

```tsx:app/layout.tsx
import { QueryProvider } from './providers/query-provider';

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

## Basic Queries

### Fetching Data with useQuery

The `useQuery` hook is the foundation of data fetching with TanStack Query:

```tsx:app/features/inventory/hooks/use-drums.ts
'use client';

import { useQuery } from '@tanstack/react-query';

interface DrumsParams {
  page?: number;
  limit?: number;
  status?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchDrums({
  page = 1,
  limit = 50,
  status = 'available',
  sortField = 'drum_id',
  sortOrder = 'desc'
}: DrumsParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status,
    sortField,
    sortOrder
  });

  const response = await fetch(`/api/inventory/drums?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch drums');
  }

  return response.json();
}

export function useDrums(params: DrumsParams = {}) {
  return useQuery({
    queryKey: ['drums', params],
    queryFn: () => fetchDrums(params),
  });
}
```

### Query Keys and Structure

Query keys identify and structure your queries. For an inventory system, you might organize them like:

```typescript
// Examples of query key patterns
["drums"][("drums", { status: "available" })][("orders", orderId)][ // All drums // Drums with a specific status // A specific order
  ("materials", "groups")
][("transactions", { material: "Steel" })]; // Material groups // Transactions for a material
```

A more complete example:

```tsx:app/features/inventory/hooks/use-transactions.ts
'use client';

import { useQuery } from '@tanstack/react-query';

interface TransactionsParams {
  page?: number;
  limit?: number;
  material?: string;
}

async function fetchTransactions(params: TransactionsParams = {}) {
  const urlParams = new URLSearchParams();

  if (params.page) urlParams.append('page', params.page.toString());
  if (params.limit) urlParams.append('limit', params.limit.toString());
  if (params.material) urlParams.append('material', params.material);

  const url = `/api/inventory/activity${urlParams.toString() ? `?${urlParams}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
}

export function useTransactions(params: TransactionsParams = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => fetchTransactions(params),
  });
}
```

### Working with Query Results

TanStack Query provides several properties to handle different states:

```tsx:app/features/inventory/components/drums-table.tsx
'use client';

import { useDrums } from '../hooks/use-drums';
import { useState } from 'react';

export function DrumsTable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('available');

  const {
    data,
    isLoading,
    isError,
    error,
    isPending,
    isFetching,
    refetch
  } = useDrums({
    page,
    status
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Error loading drums: {error.message}
        <button
          onClick={() => refetch()}
          className="ml-4 bg-red-100 px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Status filter */}
      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="used">Used</option>
        </select>
      </div>

      {/* Table of drums */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th>ID</th>
            <th>Material</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows.map((drum) => (
            <tr key={drum.drum_id}>
              <td>{drum.drum_id}</td>
              <td>{drum.material}</td>
              <td>{drum.status}</td>
              <td>
                <button className="text-blue-500 hover:underline">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex justify-between">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(data?.total / data?.limit)}</span>
        <button
          disabled={page >= Math.ceil(data?.total / data?.limit)}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Shows when data is being refreshed in the background */}
      {isFetching && !isPending && (
        <div className="text-sm text-gray-500 mt-2">
          Refreshing data...
        </div>
      )}
    </div>
  );
}
```

## Advanced Queries

### Pagination

Implementing paginated queries for inventory data:

```tsx:app/features/orders/hooks/use-orders.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';

export function useOrders({
  page = 1,
  limit = 10
}: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['orders', { page, limit }],
    queryFn: async () => {
      const response = await fetch(
        `/api/orders?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
    placeholderData: keepPreviousData, // Keep showing previous page data while loading next page
  });
}
```

### Filtering and Sorting

Add filtering and sorting to queries:

```tsx:app/features/materials/hooks/use-material-transactions.ts
'use client';

import { useQuery } from '@tanstack/react-query';

interface MaterialTransactionsParams {
  material: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export function useMaterialTransactions({
  material,
  sortField = 'tx_date',
  sortOrder = 'desc',
  startDate,
  endDate
}: MaterialTransactionsParams) {
  return useQuery({
    queryKey: ['transactions', 'material', { material, sortField, sortOrder, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams({ material });

      if (sortField) params.append('sortField', sortField);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/inventory/activity/material?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch material transactions');
      }
      return response.json();
    },
    enabled: !!material, // Only run query if material is provided
  });
}
```

### Infinite Queries

For transactions or activity logs where you want to load more as the user scrolls:

```tsx:app/features/activity/hooks/use-infinite-transactions.ts
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteTransactions(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', { limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/inventory/activity?page=${pageParam}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.rows.length < limit) {
        return undefined; // No more pages
      }
      return lastPage.page + 1;
    },
  });
}
```

Usage example:

```tsx:app/features/activity/components/transaction-log.tsx
'use client';

import { useInfiniteTransactions } from '../hooks/use-infinite-transactions';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

export function TransactionLog() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteTransactions();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Transaction History</h2>
      <div className="divide-y">
        {data.pages.map((page, i) => (
          <div key={i}>
            {page.rows.map((transaction) => (
              <div key={transaction.tx_id} className="py-3">
                <div className="font-medium">{transaction.tx_type}</div>
                <div className="text-sm text-gray-500">
                  {new Date(transaction.tx_date).toLocaleString()}
                </div>
                <div>Drum ID: {transaction.drum_id}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Load more sentinel */}
      <div ref={ref} className="h-10 flex items-center justify-center">
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
            ? ''
            : 'No more transactions'}
      </div>
    </div>
  );
}
```

### Parallel Queries

Fetch multiple related pieces of data simultaneously:

```tsx:app/features/dashboard/components/inventory-overview.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchCurrentStock() {
  const response = await fetch('/api/dashboard/current-stock');
  if (!response.ok) throw new Error('Failed to fetch current stock');
  return response.json();
}

async function fetchStockChanges() {
  const response = await fetch('/api/dashboard/stock-changes');
  if (!response.ok) throw new Error('Failed to fetch stock changes');
  return response.json();
}

async function fetchMaterialGroups() {
  const response = await fetch('/api/materials/groups');
  if (!response.ok) throw new Error('Failed to fetch material groups');
  return response.json();
}

export function InventoryOverview() {
  const stockQuery = useQuery({
    queryKey: ['dashboard', 'current-stock'],
    queryFn: fetchCurrentStock
  });

  const changesQuery = useQuery({
    queryKey: ['dashboard', 'stock-changes'],
    queryFn: fetchStockChanges
  });

  const groupsQuery = useQuery({
    queryKey: ['materials', 'groups'],
    queryFn: fetchMaterialGroups
  });

  const isLoading = stockQuery.isLoading || changesQuery.isLoading || groupsQuery.isLoading;
  const isError = stockQuery.isError || changesQuery.isError || groupsQuery.isError;

  if (isLoading) return <div>Loading dashboard data...</div>;

  if (isError) {
    return (
      <div className="bg-red-50 p-4 rounded">
        Error loading dashboard data. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Stock Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium">Total Available Stock</h3>
        <p className="text-3xl font-bold mt-2">{stockQuery.data.totalStock}</p>
      </div>

      {/* Weekly Change Chart */}
      <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
        <h3 className="text-lg font-medium">Stock Changes (14 Days)</h3>
        {/* Chart implementation would go here */}
        <pre className="text-xs mt-2 overflow-auto">
          {JSON.stringify(changesQuery.data.weeklyStockChanges, null, 2)}
        </pre>
      </div>

      {/* Material Groups */}
      <div className="bg-white p-6 rounded-lg shadow lg:col-span-3">
        <h3 className="text-lg font-medium">Material Groups</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {groupsQuery.data.groups.map((group) => (
            <div key={group.chemical_group} className="border p-4 rounded">
              <h4 className="font-medium">{group.chemical_group}</h4>
              <p className="text-2xl font-bold">{group.total_stock}</p>
              <p className="text-sm text-gray-500">
                {group.material_count} materials
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Mutations

### Basic Mutations

Use `useMutation` to update data:

```tsx:app/features/orders/hooks/use-update-order.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateOrderParams {
  orderId: number;
  etaStart?: string | null;
  etaEnd?: string | null;
}

async function updateOrder({ orderId, etaStart, etaEnd }: UpdateOrderParams) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ etaStart, etaEnd }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update order');
  }

  return response.json();
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrder,
    onSuccess: (data, variables) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: ['orders']
      });
      queryClient.invalidateQueries({
        queryKey: ['orders', variables.orderId]
      });
    },
  });
}
```

Usage example:

```tsx:app/features/orders/components/order-eta-form.tsx
'use client';

import { useState } from 'react';
import { useUpdateOrder } from '../hooks/use-update-order';

interface OrderEtaFormProps {
  orderId: number;
  initialEtaStart?: string | null;
  initialEtaEnd?: string | null;
}

export function OrderEtaForm({
  orderId,
  initialEtaStart,
  initialEtaEnd
}: OrderEtaFormProps) {
  const [etaStart, setEtaStart] = useState(initialEtaStart || '');
  const [etaEnd, setEtaEnd] = useState(initialEtaEnd || '');

  const updateOrder = useUpdateOrder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateOrder.mutate({
      orderId,
      etaStart: etaStart || null,
      etaEnd: etaEnd || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">
          ETA Start Date
        </label>
        <input
          type="date"
          value={etaStart}
          onChange={(e) => setEtaStart(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          ETA End Date
        </label>
        <input
          type="date"
          value={etaEnd}
          onChange={(e) => setEtaEnd(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <button
        type="submit"
        disabled={updateOrder.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {updateOrder.isPending ? 'Updating...' : 'Update ETA'}
      </button>

      {updateOrder.isSuccess && (
        <div className="text-green-600">
          Order ETA updated successfully!
        </div>
      )}

      {updateOrder.isError && (
        <div className="text-red-600">
          Error: {updateOrder.error.message}
        </div>
      )}
    </form>
  );
}
```

### Optimistic Updates

Apply updates immediately in the UI before they complete on the server:

```tsx:app/features/inventory/hooks/use-finalize-delivery.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FinalizeDeliveryParams {
  deliveryId: number;
}

async function finalizeDelivery({ deliveryId }: FinalizeDeliveryParams) {
  const response = await fetch(`/api/inventory/deliveries/${deliveryId}/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to finalize delivery');
  }

  return response.json();
}

export function useFinalizeDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: finalizeDelivery,

    // Update the delivery status locally before the server responds
    onMutate: async ({ deliveryId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['deliveries']
      });

      // Get current delivery data
      const previousDeliveries = queryClient.getQueryData(['deliveries']);

      // Optimistically update the delivery status
      queryClient.setQueryData(['deliveries'], (old: any) => {
        return {
          ...old,
          rows: old.rows.map((delivery: any) =>
            delivery.delivery_id === deliveryId
              ? { ...delivery, is_finalised: true }
              : delivery
          )
        };
      });

      // Return context for potential rollback
      return { previousDeliveries };
    },

    // If the mutation fails, roll back
    onError: (err, variables, context) => {
      if (context?.previousDeliveries) {
        queryClient.setQueryData(
          ['deliveries'],
          context.previousDeliveries
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}
```

### Coordinating Mutations and Queries

Create relationships between mutations and the queries they affect:

```tsx:app/features/orders/hooks/use-create-order.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateOrderParams {
  material: string;
  supplier: string;
  quantity: number;
  poNumber?: string;
}

async function createOrder(orderData: CreateOrderParams) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create order');
  }

  return response.json();
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      // Invalidate and refetch orders queries
      queryClient.invalidateQueries({
        queryKey: ['orders']
      });

      // Invalidate any recent orders queries
      queryClient.invalidateQueries({
        queryKey: ['orders', 'recent']
      });

      // Invalidate dashboard data that includes order counts
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'current-stock']
      });

      // Add the new order to the query cache
      queryClient.setQueryData(['orders', data.order.order_id], data.order);
    },
  });
}
```

## Server-Side Rendering with TanStack Query

### Hydration Overview

TanStack Query works well with Next.js server components by using a pattern of prefetching and hydration:

```tsx:app/inventory/drums/page.tsx
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import DrumsList from './components/drums-list';

async function fetchInitialDrums() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/drums`);
  if (!res.ok) throw new Error('Failed to fetch drums');
  return res.json();
}

export default async function DrumsPage() {
  const queryClient = new QueryClient();

  // Prefetch initial data on the server
  await queryClient.prefetchQuery({
    queryKey: ['drums', { page: 1, limit: 50 }],
    queryFn: fetchInitialDrums,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Inventory Drums</h1>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <DrumsList />
      </HydrationBoundary>
    </div>
  );
}
```

And the client component:

```tsx:app/inventory/drums/components/drums-list.tsx
'use client';

import { useDrums } from '@/features/inventory/hooks/use-drums';
import { useState } from 'react';

export default function DrumsList() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // This will use the server-prefetched data on initial render
  const { data, isLoading, isError } = useDrums({ page, limit });

  // Component implementation as before
}
```

### SSR Pattern

The general pattern for using TanStack Query with Next.js SSR:

1. Create a server component that fetches and dehydrates data
2. Pass dehydrated state to client components
3. Client components use the same query keys to hydrate the prefetched data

```tsx:app/dashboard/page.tsx
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import DashboardClientPage from './client-page';

async function fetchDashboardData() {
  const [stockResponse, changesResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/current-stock`),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stock-changes`)
  ]);

  if (!stockResponse.ok || !changesResponse.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return {
    stock: await stockResponse.json(),
    changes: await changesResponse.json()
  };
}

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  // Handle prefetching both queries
  const dashboardData = await fetchDashboardData();

  queryClient.setQueryData(['dashboard', 'current-stock'], dashboardData.stock);
  queryClient.setQueryData(['dashboard', 'stock-changes'], dashboardData.changes);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClientPage />
    </HydrationBoundary>
  );
}
```

### ISR and SSG Considerations

For pages that benefit from static generation or incremental static regeneration:

```tsx:app/materials/page.tsx
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import MaterialsClient from './materials-client';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

async function fetchMaterials() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/groups`);
  if (!res.ok) throw new Error('Failed to fetch materials');
  return res.json();
}

export default async function MaterialsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['materials', 'groups'],
    queryFn: fetchMaterials,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MaterialsClient />
    </HydrationBoundary>
  );
}
```

## TanStack Table Integration

### Basic Table Setup

Integrate TanStack Query with TanStack Table:

```tsx:app/features/inventory/components/activity-table.tsx
'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { useTransactions } from '../hooks/use-transactions';
import type { Transaction } from '@/types/models';

const columnHelper = createColumnHelper<Transaction>();

const columns = [
  columnHelper.accessor('tx_id', {
    header: 'ID',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('tx_type', {
    header: 'Type',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('tx_date', {
    header: 'Date',
    cell: info => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor('drum_id', {
    header: 'Drum ID',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: info => info.getValue() || 'N/A',
  }),
];

export function TransactionsTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError } = useTransactions({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const table = useReactTable({
    data: data?.rows || [],
    columns,
    pageCount: data ? Math.ceil(data.total / pagination.pageSize) : -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  if (isLoading) return <div>Loading transactions...</div>;
  if (isError) return <div>Error loading transactions</div>;

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4">
        <div className="flex-1 flex justify-between">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
      </span>
      <button
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
      className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
      >
      Next
      </button>
      </div>
      </div>
      </div>
      );
      }
```

### Table with Server-Side Operations

For more complex tables that need server-side operations, such as a drums inventory table:

````tsx:app/features/inventory/components/drums-table-with-server-operations.tsx
'use client';
import { useState, useMemo, useCallback } from 'react';
import {
useReactTable,
getCoreRowModel,
flexRender,
createColumnHelper,
SortingState,
getSortedRowModel,
} from '@tanstack/react-table';
import { useDrums } from '../hooks/use-drums';
import { Drum, DrumStatus } from '@/types/models';
import { Spinner } from '@/components/ui/spinner';
import { useQueryClient } from '@tanstack/react-query';
const columnHelper = createColumnHelper<Drum>();
export function DrumsTableWithServerOperations() {
// Pagination state
const [pagination, setPagination] = useState({
pageIndex: 0,
pageSize: 20,
});
// Sorting state
const [sorting, setSorting] = useState<SortingState>([
{ id: 'drum_id', desc: true }
]);
// Filtering state
const [filters, setFilters] = useState({
status: '' as DrumStatus | '',
material: '',
});
// Convert client-side state to server-side parameters
const serverParams = useMemo(() => ({
page: pagination.pageIndex + 1,
limit: pagination.pageSize,
status: filters.status ? [filters.status] : undefined,
material: filters.material || undefined,
sortField: sorting.length > 0 ? sorting[0].id : 'drum_id',
sortOrder: sorting.length > 0 && sorting[0].desc ? 'desc' : 'asc',
}), [pagination, sorting, filters]);
// Query client for cache management
const queryClient = useQueryClient();
// Fetch data with TanStack Query
const {
data,
isLoading,
isError,
error,
isFetching
} = useDrums(serverParams);
// Define column configuration
const columns = useMemo(() => [
columnHelper.accessor('drum_id', {
header: 'Drum ID',
cell: info => info.getValue(),
}),
columnHelper.accessor('material', {
header: 'Material',
cell: info => info.getValue(),
}),
columnHelper.accessor('status', {
header: 'Status',
cell: info => (
<span className={px-2 py-1 rounded-full text-xs font-medium ${ info.getValue() === 'available' ? 'bg-green-100 text-green-800' : info.getValue() === 'pending' ? 'bg-yellow-100 text-yellow-800' : info.getValue() === 'used' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800' }}>
{info.getValue()}
</span>
),
}),
columnHelper.accessor('supplier_name', {
header: 'Supplier',
cell: info => info.getValue() || 'N/A',
}),
columnHelper.accessor('created_at', {
header: 'Created',
cell: info => new Date(info.getValue()).toLocaleDateString(),
}),
columnHelper.display({
id: 'actions',
header: 'Actions',
cell: info => (
<div className="flex gap-2">
<button
onClick={() => handleViewDetails(info.row.original.drum_id)}
className="text-blue-600 hover:text-blue-800"
>
View
</button>
<button
onClick={() => handleStatusChange(info.row.original)}
className="text-green-600 hover:text-green-800"
>
Change Status
</button>
</div>
),
}),
], []);
// Table instance
const table = useReactTable({
data: data?.rows || [],
columns,
state: {
pagination,
sorting,
},
pageCount: data ? Math.ceil(data.total / pagination.pageSize) : -1,
onPaginationChange: setPagination,
onSortingChange: setSorting,
getCoreRowModel: getCoreRowModel(),
getSortedRowModel: getSortedRowModel(),
manualPagination: true,
manualSorting: true,
});
// Action handlers
const handleViewDetails = useCallback((drumId: number) => {
// Navigate to drum details page or open modal
console.log(View drum details: ${drumId});
}, []);
const handleStatusChange = useCallback(async (drum: Drum) => {
try {
// Optimistic update
queryClient.setQueryData(
['drums', serverParams],
(oldData: any) => {
if (!oldData) return oldData;
const newStatus = drum.status === 'available' ? 'pending' : 'available';
return {
...oldData,
rows: oldData.rows.map((d: Drum) =>
d.drum_id === drum.drum_id
? { ...d, status: newStatus }
: d
)
};
}
);
// Actual API call
const response = await fetch(/api/inventory/drums/${drum.drum_id}/status, {
method: 'PATCH',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
status: drum.status === 'available' ? 'pending' : 'available'
}),
});
if (!response.ok) {
throw new Error('Failed to update status');
}
// Invalidate the query to refetch
queryClient.invalidateQueries({ queryKey: ['drums'] });
} catch (error) {
console.error('Error updating drum status:', error);
// Revert optimistic update if necessary
queryClient.invalidateQueries({ queryKey: ['drums', serverParams] });
}
}, [queryClient, serverParams]);
// Status filter component
const StatusFilter = () => (
<select
value={filters.status}
onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as DrumStatus | '' }))}
className="border border-gray-300 rounded px-2 py-1 text-sm"
>
<option value="">All Statuses</option>
<option value="available">Available</option>
<option value="pending">Pending</option>
<option value="used">Used</option>
<option value="inprocess">In Process</option>
</select>
);
// Material filter component
const MaterialFilter = () => (
<input
type="text"
placeholder="Filter by material..."
value={filters.material}
onChange={e => setFilters(prev => ({ ...prev, material: e.target.value }))}
className="border border-gray-300 rounded px-2 py-1 text-sm"
/>
);
if (isError) {
return (
<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
Error: {error instanceof Error ? error.message : 'Unknown error'}
</div>
);
}
return (
<div>
{/ Filters /}
<div className="flex gap-4 mb-4">
<StatusFilter />
<MaterialFilter />
</div>
{/ Table /}
<div className="border rounded overflow-hidden">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
{table.getHeaderGroups().map(headerGroup => (
<tr key={headerGroup.id}>
{headerGroup.headers.map(header => (
<th
key={header.id}
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
>
<div className="flex items-center">
{flexRender(
header.column.columnDef.header,
header.getContext()
)}
{header.column.getCanSort() && (
<span className="ml-1">
{header.column.getIsSorted() === 'asc' ? '↑' :
header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
</span>
)}
</div>
</th>
))}
</tr>
))}
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{isLoading ? (
<tr>
<td colSpan={columns.length} className="px-6 py-4 text-center">
<Spinner />
</td>
</tr>
) : (
table.getRowModel().rows.map(row => (
<tr key={row.id}>
{row.getVisibleCells().map(cell => (
<td key={cell.id} className="px-6 py-4 whitespace-nowrap">
{flexRender(cell.column.columnDef.cell, cell.getContext())}
</td>
))}
</tr>
))
)}
</tbody>
</table>
</div>
{/ Pagination controls /}
<div className="flex items-center justify-between mt-4">
<div className="flex items-center gap-2">
<span className="text-sm text-gray-700">
Showing {data?.rows.length ? pagination.pageIndex pagination.pageSize + 1 : 0} to{' '}
{Math.min((pagination.pageIndex + 1) pagination.pageSize, data?.total || 0)} of{' '}
{data?.total || 0} drums
</span>
{isFetching && !isLoading && (
<span className="text-sm text-gray-500">
<Spinner size="sm" /> Refreshing...
</span>
)}
</div>
<div className="flex gap-2">
<button
onClick={() => table.previousPage()}
disabled={!table.getCanPreviousPage()}
className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
>
Previous
</button>
<span className="self-center">
Page {pagination.pageIndex + 1} of {table.getPageCount()}
</span>
<button
onClick={() => table.nextPage()}
disabled={!table.getCanNextPage()}
className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
>
Next
</button>
</div>
</div>
</div>
);
}
```tsx:app/features/api/hooks/use-distillations.ts

'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Distillation } from '@/types/models';
interface DistillationParams {
page?: number;
limit?: number;
sortField?: string;
sortOrder?: 'asc' | 'desc';
lab?: string;
}
interface CreateDistillationData {
still_code: string;
operator_initials: string;
start_date: string;
raw_material_id: number;
input_quantity: number;
}
// API functions
const api = {
getDistillations: async (params: DistillationParams = {}) => {
const searchParams = new URLSearchParams();
if (params.page) searchParams.set('page', params.page.toString());
if (params.limit) searchParams.set('limit', params.limit.toString());
if (params.sortField) searchParams.set('sortField', params.sortField);
if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
if (params.lab) searchParams.set('lab', params.lab);
const query = searchParams.toString() ? ?${searchParams.toString()} : '';
const response = await fetch(`/api/production/distillations${query}`);
if (!response.ok) {
throw new Error('Failed to fetch distillations');
}
return response.json();
},
getDistillationById: async (id: number) => {
const response = await fetch(`/api/production/distillations/${id}`);
if (!response.ok) {
throw new Error(Failed to fetch distillation with ID ${id});
}
return response.json();
},
createDistillation: async (data: CreateDistillationData) => {
const response = await fetch('/api/production/distillations', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(data),
});
if (!response.ok) {
const errorData = await response.json();
throw new Error(errorData.error || 'Failed to create distillation');
}
return response.json();
},
updateDistillation: async (id: number, data: Partial<Distillation>) => {
const response = await fetch(/api/production/distillations/${id}, {
method: 'PATCH',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(data),
});
if (!response.ok) {
const errorData = await response.json();
throw new Error(errorData.error || 'Failed to update distillation');
}
return response.json();
},
};
// Custom hooks
export function useDistillations(params: DistillationParams = {}) {
return useQuery({
queryKey: ['distillations', params],
queryFn: () => api.getDistillations(params),
});
}
export function useDistillation(id: number) {
return useQuery({
queryKey: ['distillation', id],
queryFn: () => api.getDistillationById(id),
enabled: !!id, // Only run query if ID is provided
});
}
export function useCreateDistillation() {
const queryClient = useQueryClient();
return useMutation({
mutationFn: api.createDistillation,
onSuccess: () => {
// Invalidate the distillations list query to refetch
queryClient.invalidateQueries({ queryKey: ['distillations'] });
},
});
}
export function useUpdateDistillation() {
const queryClient = useQueryClient();
return useMutation({
mutationFn: ({ id, data }: { id: number; data: Partial<Distillation> }) =>
api.updateDistillation(id, data),
onSuccess: (data, variables) => {
// Invalidate both the list and individual queries
queryClient.invalidateQueries({ queryKey: ['distillations'] });
queryClient.invalidateQueries({
queryKey: ['distillation', variables.id]
});
},
});
}

```tsx:app/features/production/components/distillation-detail.tsx

'use client';
import { useState } from 'react';
import {
useDistillation,
useUpdateDistillation
} from '@/features/api/hooks/use-distillations';
import { useRawMaterials } from '@/features/api/hooks/use-raw-materials';
import { useStills } from '@/features/api/hooks/use-stills';
import { useOperators } from '@/features/api/hooks/use-operators';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
interface DistillationDetailProps {
distillationId: number;
}
export function DistillationDetail({ distillationId }: DistillationDetailProps) {
const [isEditing, setIsEditing] = useState(false);
const [endDate, setEndDate] = useState<string | null>(null);
const [yield_quantity, setYieldQuantity] = useState<number | null>(null);
// Fetch distillation data
const {
data: distillation,
isLoading: isLoadingDistillation,
isError: isDistillationError,
error: distillationError
} = useDistillation(distillationId);
// Fetch supporting data for dropdowns, etc.
const { data: rawMaterials } = useRawMaterials();
const { data: stills } = useStills();
const { data: operators } = useOperators();
// Update mutation
const updateDistillation = useUpdateDistillation();
// Handle form submission
const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
updateDistillation.mutate({
id: distillationId,
data: {
end_date: endDate ? new Date(endDate).toISOString() : null,
yield_quantity,
},
}, {
onSuccess: () => {
setIsEditing(false);
},
});
};
if (isLoadingDistillation) {
return (
<div className="flex justify-center p-8">
<Spinner />
</div>
);
}
if (isDistillationError) {
return (
<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
Error: {distillationError instanceof Error ? distillationError.message : 'Unknown error'}
</div>
);
}
const rawMaterial = rawMaterials?.find(
rm => rm.id === distillation.raw_material_id
);
const still = stills?.find(
s => s.still_code === distillation.still_code
);
const operator = operators?.find(
o => o.initials === distillation.operator_initials
);
return (
<Card>
<CardHeader>
<CardTitle className="flex justify-between items-center">
<span>Distillation #{distillation.distillation_id}</span>
{!isEditing && (
<Button
onClick={() => {
setEndDate(distillation.end_date || '');
setYieldQuantity(distillation.yield_quantity || null);
setIsEditing(true);
}}
variant="outline"
>
Edit
</Button>
)}
</CardTitle>
</CardHeader>
<CardContent>
{isEditing ? (
<form onSubmit={handleSubmit} className="space-y-4">
<div>
<label className="block text-sm font-medium mb-1">
End Date
</label>
<input
type="date"
value={endDate || ''}
onChange={(e) => setEndDate(e.target.value)}
className="block w-full border border-gray-300 rounded px-3 py-2"
/>
</div>
<div>
<label className="block text-sm font-medium mb-1">
Yield Quantity (kg)
</label>
<input
type="number"
step="0.01"
value={yield_quantity || ''}
onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || null)}
className="block w-full border border-gray-300 rounded px-3 py-2"
/>
</div>
<div className="flex gap-2">
<Button
type="submit"
disabled={updateDistillation.isPending}
>
{updateDistillation.isPending ? 'Saving...' : 'Save'}
</Button>
<Button
type="button"
variant="outline"
onClick={() => setIsEditing(false)}
>
Cancel
</Button>
</div>
{updateDistillation.isError && (
<div className="text-red-600 text-sm">
Error: {updateDistillation.error instanceof Error
? updateDistillation.error.message
: 'Failed to update distillation'}
</div>
)}
</form>
) : (
<div className="space-y-4">
<div className="grid grid-cols-2 gap-4">
<div>
<h3 className="text-sm font-medium text-gray-500">Still</h3>
<p>{still?.still_code || distillation.still_code}</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">Operator</h3>
<p>{operator
? ${operator.first_name} ${operator.last_name}
: distillation.operator_initials}
</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">Raw Material</h3>
<p>{rawMaterial?.name || 'Unknown'}</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">Input Quantity</h3>
<p>{distillation.input_quantity} kg</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">Start Date</h3>
<p>{new Date(distillation.start_date).toLocaleDateString()}</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">End Date</h3>
<p>{distillation.end_date
? new Date(distillation.end_date).toLocaleDateString()
: 'In Progress'}
</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">Yield Quantity</h3>
<p>{distillation.yield_quantity
? ${distillation.yield_quantity} kg
: 'Pending'}
</p>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500">Yield Percentage</h3>
<p>{distillation.yield_quantity && distillation.input_quantity
? ${((distillation.yield_quantity / distillation.input_quantity) * 100).toFixed(1)}%
: 'Pending'}
</p>
</div>
</div>
<div>
<h3 className="text-sm font-medium text-gray-500 mb-2">Drums Used</h3>
{distillation.drums?.length ? (
<ul className="list-disc list-inside">
{distillation.drums.map(drum => (
<li key={drum.drum_id}>
Drum #{drum.drum_id} - {drum.material}
({(drum.fraction_used 100).toFixed()}% used)
</li>
))}
</ul>
) : (
<p className="text-sm text-gray-500">No drums assigned</p>
)}
</div>
</div>
)}
</CardContent>
</Card>
);
}

```tsx:app/features/dashboard/hooks/use-current-production.ts

'use client';
import { useQuery } from '@tanstack/react-query';
async function fetchCurrentProduction() {
const response = await fetch('/api/dashboard/current-production');
if (!response.ok) {
throw new Error('Failed to fetch current production');
}
return response.json();
}
export function useCurrentProduction() {
return useQuery({
queryKey: ['dashboard', 'current-production'],
queryFn: fetchCurrentProduction,
// Set a short polling interval for "near real-time" updates
refetchInterval: 30000, // 30 seconds
// Don't stop polling even when the browser tab is not active
refetchIntervalInBackground: true,
});
}

```tsx:app/features/production/components/active-distillations.tsx

'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
async function fetchActiveDistillations() {
const response = await fetch('/api/production/distillations/active');
if (!response.ok) {
throw new Error('Failed to fetch active distillations');
}
return response.json();
}
export function ActiveDistillations() {
const queryClient = useQueryClient();
// Fetch active distillations
const { data, isLoading, isError } = useQuery({
queryKey: ['distillations', 'active'],
queryFn: fetchActiveDistillations,
});
// Set up SSE for real-time updates
useEffect(() => {
const eventSource = new EventSource('/api/production/sse/distillations');
eventSource.addEventListener('open', () => {
console.log('SSE connection opened for distillations');
});
eventSource.addEventListener('error', (error) => {
console.error('SSE connection error:', error);
// Attempt to reconnect after a delay
setTimeout(() => {
eventSource.close();
// The new EventSource will be created on the next render
}, 5000);
});
// Listen for distillation updates
eventSource.addEventListener('distillationUpdate', (event) => {
const updatedDistillation = JSON.parse((event as MessageEvent).data);
console.log('Received distillation update:', updatedDistillation);
// Update the query cache with the new data
queryClient.setQueryData(
['distillations', 'active'],
(oldData: any) => {
if (!oldData) return oldData;
// If the distillation is no longer active (has end_date),
// remove it from the active list
if (updatedDistillation.end_date) {
return {
...oldData,
distillations: oldData.distillations.filter(
(d: any) => d.distillation_id !== updatedDistillation.distillation_id
)
};
}
// Otherwise, update the distillation in the list
return {
...oldData,
distillations: oldData.distillations.map((d: any) =>
d.distillation_id === updatedDistillation.distillation_id
? { ...d, ...updatedDistillation }
: d
)
};
}
);
});
// Listen for new distillations
eventSource.addEventListener('newDistillation', (event) => {
const newDistillation = JSON.parse((event as MessageEvent).data);
console.log('Received new distillation:', newDistillation);
// Add the new distillation to the active list
queryClient.setQueryData(
['distillations', 'active'],
(oldData: any) => {
if (!oldData) return { distillations: [newDistillation] };
return {
...oldData,
distillations: [...oldData.distillations, newDistillation]
};
}
);
});
return () => {
eventSource.close();
};
}, [queryClient]);
if (isLoading) {
return <div>Loading active distillations...</div>;
}
if (isError) {
return <div>Error loading active distillations</div>;
}
return (
<Card>
<CardHeader>
<CardTitle>Active Distillations</CardTitle>
</CardHeader>
<CardContent>
{data.distillations.length === 0 ? (
<p className="text-gray-500">No active distillations</p>
) : (
<div className="space-y-4">
{data.distillations.map((distillation: any) => (
<div
key={distillation.distillation_id}
className="border rounded p-4"
>
<div className="flex justify-between">
<h3 className="font-medium">
Distillation #{distillation.distillation_id}
</h3>
<span className="text-sm text-gray-500">
Still {distillation.still_code}
</span>
</div>
<div className="mt-2 grid grid-cols-2 gap-2 text-sm">
<div>
<span className="text-gray-500">Started:</span>{' '}
{new Date(distillation.start_date).toLocaleString()}
</div>
<div>
<span className="text-gray-500">Operator:</span>{' '}
{distillation.operator_initials}
</div>
<div>
<span className="text-gray-500">Material:</span>{' '}
{distillation.raw_material?.name || 'Unknown'}
</div>
<div>
<span className="text-gray-500">Input:</span>{' '}
{distillation.input_quantity} kg
</div>
</div>
<div className="mt-2">
<div className="w-full bg-gray-200 rounded-full h-2.5">
<div
className="bg-blue-600 h-2.5 rounded-full"
style={{
width: ${Math.min( ((Date.now() - new Date(distillation.start_date).getTime()) / (24 * 60 * 60 * 1000)) * 100, 100 )}%
}}
></div>
</div>
<div className="text-xs text-gray-500 mt-1">
Running for {
Math.floor(
(Date.now() - new Date(distillation.start_date).getTime()) /
(60 60 1000)
)
} hours
</div>
</div>
</div>
))}
</div>
)}
</CardContent>
</Card>
);
}

```tsx:app/providers/query-provider.tsx

'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';
interface QueryProviderProps {
children: ReactNode;
}
export function QueryProvider({ children }: QueryProviderProps) {
const [queryClient] = useState(() => new QueryClient({
defaultOptions: {
queries: {
// Default settings for all queries
staleTime: 60 1000, // 1 minute
refetchOnWindowFocus: true,
retry: 1,
},
},
}));
// Configure specific query defaults
queryClient.setQueryDefaults(['dashboard'], {
// Dashboard data refreshes more frequently
staleTime: 30 1000, // 30 seconds
refetchInterval: 60 1000, // 1 minute
});
queryClient.setQueryDefaults(['reference'], {
// Reference data changes infrequently
staleTime: 24 60 60 1000, // 24 hours
cacheTime: 48 60 60 1000, // 48 hours
});
queryClient.setQueryDefaults(['inventory'], {
// Inventory data needs to be fresh
staleTime: 2 60 1000, // 2 minutes
});
queryClient.setQueryDefaults(['production', 'active'], {
// Active production data needs to be very fresh
staleTime: 10 1000, // 10 seconds
refetchInterval: 30 1000, // 30 seconds
});
return (
<QueryClientProvider client={queryClient}>
{children}
<ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
);
}

```tsx:app/features/production/components/distillations-list.tsx

'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDistillations } from '@/features/api/hooks/use-distillations';
import { Link } from '@/components/ui/link';
export function DistillationsList() {
const queryClient = useQueryClient();
const { data, isLoading, isError } = useDistillations();
// Prefetch distillation details when hovering over a list item
const prefetchDistillation = (id: number) => {
queryClient.prefetchQuery({
queryKey: ['distillation', id],
queryFn: () => fetch(`/api/production/distillations/${id}).then(res => res.json()`),
});
};
// Prefetch the first 5 distillations on component mount
useEffect(() => {
if (data?.distillations && data.distillations.length > 0) {
const distillationsToPreload = data.distillations.slice(0, 5);
distillationsToPreload.forEach(distillation => {
queryClient.prefetchQuery({
queryKey: ['distillation', distillation.distillation_id],
queryFn: () => fetch(`/api/production/distillations/${distillation.distillation_id}).then(res => res.json()`),
});
});
}
}, [data, queryClient]);
if (isLoading) return <div>Loading distillations...</div>;
if (isError) return <div>Error loading distillations</div>;
return (
<ul className="divide-y divide-gray-200">
{data.distillations.map((distillation: any) => (
<li
key={distillation.distillation_id}
className="py-4"
onMouseEnter={() => prefetchDistillation(distillation.distillation_id)}
>
<Link
href={`/production/distillations/${distillation.distillation_id}`}
className="flex items-center justify-between"
>
<div>
<h3 className="font-medium">
Distillation #{distillation.distillation_id}
</h3>
<p className="text-sm text-gray-500">
{new Date(distillation.start_date).toLocaleDateString()} •
Still {distillation.still_code}
</p>
</div>
<div className="text-sm">
{distillation.end_date ? 'Completed' : 'In Progress'}
</div>
</Link>
</li>
))}
</ul>
);
}
````

# Data Fetching with TanStack Query in Next.js: Comprehensive Guide

I'll format the second half of the document to match the style of the first half, ensuring consistent headings, spacing, and code block formatting.

## Custom Hooks Pattern

### Creating API Service Hooks

Organize your API calls into custom hooks for better reusability:

```tsx:app/features/api/hooks/use-distillations.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Distillation } from '@/types/models';

interface DistillationParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  lab?: string;
}

interface CreateDistillationData {
  still_code: string;
  operator_initials: string;
  start_date: string;
  raw_material_id: number;
  input_quantity: number;
}

// API functions
const api = {
  getDistillations: async (params: DistillationParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sortField) searchParams.set('sortField', params.sortField);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.lab) searchParams.set('lab', params.lab);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/production/distillations${query}`);

    if (!response.ok) {
      throw new Error('Failed to fetch distillations');
    }
    return response.json();
  },

  getDistillationById: async (id: number) => {
    const response = await fetch(`/api/production/distillations/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch distillation with ID ${id}`);
    }
    return response.json();
  },

  createDistillation: async (data: CreateDistillationData) => {
    const response = await fetch('/api/production/distillations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create distillation');
    }
    return response.json();
  },

  updateDistillation: async (id: number, data: Partial<Distillation>) => {
    const response = await fetch(`/api/production/distillations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update distillation');
    }
    return response.json();
  },
};

// Custom hooks
export function useDistillations(params: DistillationParams = {}) {
  return useQuery({
    queryKey: ['distillations', params],
    queryFn: () => api.getDistillations(params),
  });
}

export function useDistillation(id: number) {
  return useQuery({
    queryKey: ['distillation', id],
    queryFn: () => api.getDistillationById(id),
    enabled: !!id, // Only run query if ID is provided
  });
}

export function useCreateDistillation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDistillation,
    onSuccess: () => {
      // Invalidate the distillations list query to refetch
      queryClient.invalidateQueries({ queryKey: ['distillations'] });
    },
  });
}

export function useUpdateDistillation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Distillation> }) =>
      api.updateDistillation(id, data),
    onSuccess: (data, variables) => {
      // Invalidate both the list and individual queries
      queryClient.invalidateQueries({ queryKey: ['distillations'] });
      queryClient.invalidateQueries({
        queryKey: ['distillation', variables.id]
      });
    },
  });
}
```

### Composing Complex Data Requirements

Create a component that uses multiple hooks to display detailed information:

```tsx:app/features/production/components/distillation-detail.tsx
'use client';
import { useState } from 'react';
import {
  useDistillation,
  useUpdateDistillation
} from '@/features/api/hooks/use-distillations';
import { useRawMaterials } from '@/features/api/hooks/use-raw-materials';
import { useStills } from '@/features/api/hooks/use-stills';
import { useOperators } from '@/features/api/hooks/use-operators';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface DistillationDetailProps {
  distillationId: number;
}

export function DistillationDetail({ distillationId }: DistillationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [yield_quantity, setYieldQuantity] = useState<number | null>(null);

  // Fetch distillation data
  const {
    data: distillation,
    isLoading: isLoadingDistillation,
    isError: isDistillationError,
    error: distillationError
  } = useDistillation(distillationId);

  // Fetch supporting data for dropdowns, etc.
  const { data: rawMaterials } = useRawMaterials();
  const { data: stills } = useStills();
  const { data: operators } = useOperators();

  // Update mutation
  const updateDistillation = useUpdateDistillation();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDistillation.mutate({
      id: distillationId,
      data: {
        end_date: endDate ? new Date(endDate).toISOString() : null,
        yield_quantity,
      },
    }, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  if (isLoadingDistillation) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (isDistillationError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Error: {distillationError instanceof Error ? distillationError.message : 'Unknown error'}
      </div>
    );
  }

  const rawMaterial = rawMaterials?.find(
    rm => rm.id === distillation.raw_material_id
  );
  const still = stills?.find(
    s => s.still_code === distillation.still_code
  );
  const operator = operators?.find(
    o => o.initials === distillation.operator_initials
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Distillation #{distillation.distillation_id}</span>
          {!isEditing && (
            <Button
              onClick={() => {
                setEndDate(distillation.end_date || '');
                setYieldQuantity(distillation.yield_quantity || null);
                setIsEditing(true);
              }}
              variant="outline"
            >
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Yield Quantity (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={yield_quantity || ''}
                onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || null)}
                className="block w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateDistillation.isPending}
              >
                {updateDistillation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
            {updateDistillation.isError && (
              <div className="text-red-600 text-sm">
                Error: {updateDistillation.error instanceof Error
                  ? updateDistillation.error.message
                  : 'Failed to update distillation'}
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Still</h3>
                <p>{still?.still_code || distillation.still_code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Operator</h3>
                <p>{operator
                  ? `${operator.first_name} ${operator.last_name}`
                  : distillation.operator_initials}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Raw Material</h3>
                <p>{rawMaterial?.name || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Input Quantity</h3>
                <p>{distillation.input_quantity} kg</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p>{new Date(distillation.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p>{distillation.end_date
                  ? new Date(distillation.end_date).toLocaleDateString()
                  : 'In Progress'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Yield Quantity</h3>
                <p>{distillation.yield_quantity
                  ? `${distillation.yield_quantity} kg`
                  : 'Pending'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Yield Percentage</h3>
                <p>{distillation.yield_quantity && distillation.input_quantity
                  ? `${((distillation.yield_quantity / distillation.input_quantity) * 100).toFixed(1)}%`
                  : 'Pending'}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Drums Used</h3>
              {distillation.drums?.length ? (
                <ul className="list-disc list-inside">
                  {distillation.drums.map(drum => (
                    <li key={drum.drum_id}>
                      Drum #{drum.drum_id} - {drum.material}
                      ({(drum.fraction_used * 100).toFixed()}% used)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No drums assigned</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Real-Time Updates

### Polling Strategies

For data that changes frequently, implement polling:

```tsx:app/features/dashboard/hooks/use-current-production.ts
'use client';
import { useQuery } from '@tanstack/react-query';

async function fetchCurrentProduction() {
  const response = await fetch('/api/dashboard/current-production');
  if (!response.ok) {
    throw new Error('Failed to fetch current production');
  }
  return response.json();
}

export function useCurrentProduction() {
  return useQuery({
    queryKey: ['dashboard', 'current-production'],
    queryFn: fetchCurrentProduction,
    // Set a short polling interval for "near real-time" updates
    refetchInterval: 30000, // 30 seconds
    // Don't stop polling even when the browser tab is not active
    refetchIntervalInBackground: true,
  });
}
```

### WebSockets and SSE

For truly real-time updates, integrate with Server-Sent Events (SSE):

```tsx:app/features/production/components/active-distillations.tsx
'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function fetchActiveDistillations() {
  const response = await fetch('/api/production/distillations/active');
  if (!response.ok) {
    throw new Error('Failed to fetch active distillations');
  }
  return response.json();
}

export function ActiveDistillations() {
  const queryClient = useQueryClient();

  // Fetch active distillations
  const { data, isLoading, isError } = useQuery({
    queryKey: ['distillations', 'active'],
    queryFn: fetchActiveDistillations,
  });

  // Set up SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/production/sse/distillations');

    eventSource.addEventListener('open', () => {
      console.log('SSE connection opened for distillations');
    });

    eventSource.addEventListener('error', (error) => {
      console.error('SSE connection error:', error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
        // The new EventSource will be created on the next render
      }, 5000);
    });

    // Listen for distillation updates
    eventSource.addEventListener('distillationUpdate', (event) => {
      const updatedDistillation = JSON.parse((event as MessageEvent).data);
      console.log('Received distillation update:', updatedDistillation);

      // Update the query cache with the new data
      queryClient.setQueryData(
        ['distillations', 'active'],
        (oldData: any) => {
          if (!oldData) return oldData;

          // If the distillation is no longer active (has end_date),
          // remove it from the active list
          if (updatedDistillation.end_date) {
            return {
              ...oldData,
              distillations: oldData.distillations.filter(
                (d: any) => d.distillation_id !== updatedDistillation.distillation_id
              )
            };
          }

          // Otherwise, update the distillation in the list
          return {
            ...oldData,
            distillations: oldData.distillations.map((d: any) =>
              d.distillation_id === updatedDistillation.distillation_id
                ? { ...d, ...updatedDistillation }
                : d
            )
          };
        }
      );
    });

    // Listen for new distillations
    eventSource.addEventListener('newDistillation', (event) => {
      const newDistillation = JSON.parse((event as MessageEvent).data);
      console.log('Received new distillation:', newDistillation);

      // Add the new distillation to the active list
      queryClient.setQueryData(
        ['distillations', 'active'],
        (oldData: any) => {
          if (!oldData) return { distillations: [newDistillation] };
          return {
            ...oldData,
            distillations: [...oldData.distillations, newDistillation]
          };
        }
      );
    });

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  if (isLoading) {
    return <div>Loading active distillations...</div>;
  }

  if (isError) {
    return <div>Error loading active distillations</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Distillations</CardTitle>
      </CardHeader>
      <CardContent>
        {data.distillations.length === 0 ? (
          <p className="text-gray-500">No active distillations</p>
        ) : (
          <div className="space-y-4">
            {data.distillations.map((distillation: any) => (
              <div
                key={distillation.distillation_id}
                className="border rounded p-4"
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">
                    Distillation #{distillation.distillation_id}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Still {distillation.still_code}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Started:</span>{' '}
                    {new Date(distillation.start_date).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-gray-500">Operator:</span>{' '}
                    {distillation.operator_initials}
                  </div>
                  <div>
                    <span className="text-gray-500">Material:</span>{' '}
                    {distillation.raw_material?.name || 'Unknown'}
                  </div>
                  <div>
                    <span className="text-gray-500">Input:</span>{' '}
                    {distillation.input_quantity} kg
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((Date.now() - new Date(distillation.start_date).getTime()) /
                          (24 * 60 * 60 * 1000)) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Running for {
                      Math.floor(
                        (Date.now() - new Date(distillation.start_date).getTime()) /
                        (60 * 60 * 1000)
                      )
                    } hours
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Performance Optimization

### Caching Strategies

Configure different caching strategies for different types of data:

```tsx:app/providers/query-provider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default settings for all queries
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  // Configure specific query defaults
  queryClient.setQueryDefaults(['dashboard'], {
    // Dashboard data refreshes more frequently
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  queryClient.setQueryDefaults(['reference'], {
    // Reference data changes infrequently
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
  });

  queryClient.setQueryDefaults(['inventory'], {
    // Inventory data needs to be fresh
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  queryClient.setQueryDefaults(['production', 'active'], {
    // Active production data needs to be very fresh
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // 30 seconds
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Prefetching

Improve perceived performance by prefetching data the user is likely to need:

```tsx:app/features/production/components/distillations-list.tsx
'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDistillations } from '@/features/api/hooks/use-distillations';
import { Link } from '@/components/ui/link';

export function DistillationsList() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useDistillations();

  // Prefetch distillation details when hovering over a list item
  const prefetchDistillation = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['distillation', id],
      queryFn: () => fetch(`/api/production/distillations/${id}`).then(res => res.json()),
    });
  };

  // Prefetch the first 5 distillations on component mount
  useEffect(() => {
    if (data?.distillations && data.distillations.length > 0) {
      const distillationsToPreload = data.distillations.slice(0, 5);
      distillationsToPreload.forEach(distillation => {
        queryClient.prefetchQuery({
          queryKey: ['distillation', distillation.distillation_id],
          queryFn: () => fetch(`/api/production/distillations/${distillation.distillation_id}`).then(res => res.json()),
        });
      });
    }
  }, [data, queryClient]);

  if (isLoading) return <div>Loading distillations...</div>;
  if (isError) return <div>Error loading distillations</div>;

  return (
    <ul className="divide-y divide-gray-200">
      {data.distillations.map((distillation: any) => (
        <li
          key={distillation.distillation_id}
          className="py-4"
          onMouseEnter={() => prefetchDistillation(distillation.distillation_id)}
        >
          <Link
            href={`/production/distillations/${distillation.distillation_id}`}
            className="flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium">
                Distillation #{distillation.distillation_id}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(distillation.start_date).toLocaleDateString()} •
                Still {distillation.still_code}
              </p>
            </div>
            <div className="text-sm">
              {distillation.end_date ? 'Completed' : 'In Progress'}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

### Suspense and Error Boundaries

Use React Suspense and Error Boundaries with TanStack Query:

```tsx:app/production/distillations/[id]/page.tsx
'use client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DistillationDetail } from '@/features/production/components/distillation-detail';
import { Spinner } from '@/components/ui/spinner';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
      <p className="font-medium">Something went wrong:</p>
      <p className="mt-1">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
      >
        Try again
      </button>
    </div>
  );
}

export default function DistillationDetailPage({ params }: { params: { id: string } }) {
  const distillationId = parseInt(params.id, 10);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Distillation Details</h1>

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Reset the state of your app here
          window.location.reload();
        }}
      >
        <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
          <DistillationDetail distillationId={distillationId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

## Best Practices

### Query Organization

Organize your queries by domain and purpose:

```typescript
// Query key structure examples
["inventory", "drums", { status: "available" }][
  ("production", "distillations", distillationId)
][("dashboard", "current-production")][("reference", "materials")][
  ("orders", { status: "pending" })
];
```

### TypeScript Integration

Use TypeScript to ensure type safety in your queries and mutations:

```tsx:app/types/query.ts
import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { Drum, Distillation, Order } from './models';

// Define response types
export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

// Define query parameter types
export interface DrumQueryParams {
  page?: number;
  limit?: number;
  status?: string | string[];
  material?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// Define typed query hooks
export type UseGetDrumsOptions = UseQueryOptions<
  PaginatedResponse<Drum>,
  Error,
  PaginatedResponse<Drum>,
  ['drums', DrumQueryParams]
>;

export type UseGetDistillationOptions = UseQueryOptions<
  Distillation,
  Error,
  Distillation,
  ['distillation', number]
>;

// Define typed mutation hooks
export type UseUpdateOrderOptions = UseMutationOptions<
  Order,
  Error,
  { id: number; data: Partial<Order> }
>;
```

### Testing Strategies

Test your queries and mutations with proper mocking:

```tsx:app/features/inventory/__tests__/use-drums.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDrums } from '../hooks/use-drums';
import { server } from '@/mocks/server';
import { rest } from 'msw';

// Create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useDrums hook', () => {
  it('should fetch drums successfully', async () => {
    // Mock the API response
    server.use(
      rest.get('/api/inventory/drums', (req, res, ctx) => {
        return res(
          ctx.json({
            rows: [
              { drum_id: 1, material: 'Lavender', status: 'available' },
              { drum_id: 2, material: 'Rose', status: 'pending' },
            ],
            total: 2,
            page: 1,
            limit: 10
          })
        );
      })
    );

    const { result } = renderHook(() => useDrums(), {
      wrapper: createWrapper(),
    });

    // Initially in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check the data
```

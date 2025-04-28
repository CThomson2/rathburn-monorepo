# Purchase Orders User Flow

```typescript
/**
 * Fetches all raw material purchase orders and constituent order line item details
 *
 * @returns {Promise<OrdersView[]>} Array of purchase orders with line item details
 */
export async function fetchOrders(): Promise<OrdersView[]> {}

/**
 * Fetches all materials for dropdown selection
 * Returns a simplified list of materials with id and name
 */
export async function fetchItems(): Promise<
  Array<{ id: string; name: string }>
> {}

/**
 * Searches materials with a prefix filter
 * Much faster than a full text search for autocomplete purposes
 */
export async function searchItems(
  prefix: string
): Promise<Array<{ id: string; name: string }>> {
  // ...
}

/**
 * Fetches items (supplier-specific materials) for a specific supplier
 * Returns a list of items with id and name
 */
export async function fetchItemsBySupplier(
  supplierId: string
): Promise<Array<{ id: string; name: string }>> {
  // ...
}

/**
 * Searches items (supplier-specific materials) for a specific supplier with a prefix filter
 * Returns a filtered list of items with id and name
 */
export async function searchItemsBySupplier(
  supplierId: string,
  prefix: string
): Promise<Array<{ id: string; name: string; materialId: string }>> {
  // ...
}

/**
 * Fetches all suppliers for dropdown selection
 * Returns a simplified list of suppliers with id and name
 */
export async function fetchSuppliers(): Promise<
  Array<{ id: string; name: string }>
> {
  // ...
}

/**
 * Searches suppliers with a prefix filter
 * Much faster than a full text search for autocomplete purposes
 */
export async function searchSuppliers(
  prefix: string
): Promise<Array<{ id: string; name: string }>> {
  // ...
}

/**
 * Types for order form data
 */
interface OrderMaterial {
  itemId: string;
  quantity: number;
  weight?: number;
}

interface OrderData {
  poNumber: string;
  supplierId: string;
  orderDate: string;
  etaDate?: string;
  items: OrderMaterial[];
}

/**
 * Handles inserting new purchase orders into the database
 *
 * @param formData - The form data containing order details
 * @returns {Promise<{success: boolean, message?: string, orderId?: string}>} Result of order creation
 */
export async function createOrder(
  formData: FormData
): Promise<{ success: boolean; message?: string; orderId?: string }> {
  // ...
}

/**
 * Calculates the suggested next PO number for a new order given a date
 * Searches orders for previous orders made on the same day, if any
 * Uses the letter of the alphabet to determine the next PO number
 *
 * @param date - The date of the order
 * @returns The suggested next PO number
 */
export async function getNextPONumber(date?: Date) {
  // ...
}

// Lines of code: 437
```

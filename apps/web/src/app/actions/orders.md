# Purchase Orders User Flow & Server Actions

## User Flow

1. User opens the purchase orders modal using the global sidebar menu
2. The purchase orders modal loads with a table of 10 most recent purchase orders

- `fetchOrders` server action fetches data from `public.v_goods_in`

3. User clicks the "Create Purchase Order" button
4. The purchase order creation modal loads

- `getNextPONumber` server action generates the next purchase order number

5. User enters purchase order details

- `createOrder` server action creates the purchase order

3. ## getNextPONumber

Returns the next sequential purchase order number in the format
YY-MM-DD-A-RS, where A is a letter (A, B, C, D, E) indicating the
number of orders placed today. If no orders have been placed today,

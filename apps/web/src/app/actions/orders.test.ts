import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchOrders, createOrder } from './orders';
import * as databaseModule from '@/lib/database';

// Mock the database module
vi.mock('@/lib/database', () => ({
  executeServerDbOperation: vi.fn(),
}));

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Orders Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOrders', () => {
    it('should fetch and format orders from the v_goods_in view', async () => {
      // Mock data returned from the database
      const mockOrdersData = [
        {
          po_number: 'PO-12345',
          item: 'Test Material',
          supplier: 'Test Supplier',
          quantity: 10,
          order_date: '2023-01-01T00:00:00.000Z',
          status: 'pending',
          eta_date: '2023-01-15T00:00:00.000Z',
        },
        {
          po_number: 'PO-67890',
          item: 'Another Material',
          supplier: 'Another Supplier',
          quantity: 5,
          order_date: '2023-02-01T00:00:00.000Z',
          status: 'complete',
          eta_date: null,
        },
      ];

      // Mock the Supabase client's select method
      const mockSupabaseSelect = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: mockOrdersData, 
          error: null 
        }),
      };

      // Mock the executeServerDbOperation function
      vi.mocked(databaseModule.executeServerDbOperation).mockImplementation(
        async (callback) => {
          return callback(mockSupabaseSelect as any);
        }
      );

      // Call the function
      const result = await fetchOrders();

      // Check if the database was queried correctly
      expect(mockSupabaseSelect.from).toHaveBeenCalledWith('v_goods_in');
      expect(mockSupabaseSelect.select).toHaveBeenCalledWith('*');

      // Verify the result contains formatted data
      expect(result).toHaveLength(2);
      expect(result[0]?.po_number).toBe('PO-12345');
      expect(result[0]?.status).toBe('pending');
      expect(result[0]?.order_date).toBeDefined(); // Formatted date
      expect(result[0]?.eta).toBeDefined(); // Formatted ETA date

      expect(result[1]?.po_number).toBe('PO-67890');
      expect(result[1]?.status).toBe('complete');
      expect(result[1]?.order_date).toBeDefined(); // Formatted date
      expect(result[1]?.eta).toBeUndefined(); // No ETA date
    });

    it('should return an empty array if there is an error', async () => {
      // Mock a database error
      const mockSupabaseError = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
      };

      // Mock the executeServerDbOperation function with an error
      vi.mocked(databaseModule.executeServerDbOperation).mockImplementation(
        async (callback) => {
          return callback(mockSupabaseError as any);
        }
      );

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function
      const result = await fetchOrders();

      // Check if the error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Verify the result is an empty array
      expect(result).toEqual([]);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createOrder', () => {
    it('should create a purchase order with order lines', async () => {
      // Create FormData mock
      const formData = new FormData();
      formData.append('poNumber', 'PO-TEST-123');
      formData.append('supplier', '0e84084f-139e-44b5-8041-faabbad25166');
      formData.append('orderDate', '2023-04-15');
      
      // Add materials
      formData.append('material-1-name', 'Material 1');
      formData.append('material-1-id', 'de651fa6-bcfd-4127-b266-8c23e473583e');
      formData.append('material-1-quantity', '5');
      formData.append('material-1-weight', '10.5');
      
      formData.append('material-2-name', 'Material 2');
      formData.append('material-2-id', 'de651fa6-bcfd-4127-b266-8c23e473583f');
      formData.append('material-2-quantity', '3');

      // Mock Supabase responses
      const mockOrderId = 'new-order-id-123';
      
      const mockSupabaseClient = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((data) => {
          // Different responses for purchase_orders and purchase_order_lines
          if (data.po_number) { // purchase_orders table
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { po_id: mockOrderId },
                error: null,
              }),
            };
          } else { // purchase_order_lines table
            return {
              error: null,
            };
          }
        }),
      };

      // Mock the executeServerDbOperation function
      vi.mocked(databaseModule.executeServerDbOperation).mockImplementation(
        async (callback) => {
          return callback(mockSupabaseClient as any);
        }
      );

      // Call the function
      const result = await createOrder(formData);

      // Check if the database was called correctly
      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('inventory');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchase_orders');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchase_order_lines');

      // Verify insert was called with the right data for purchase_orders
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        po_number: 'PO-TEST-123',
        supplier_id: '0e84084f-139e-44b5-8041-faabbad25166',
        order_date: '2023-04-15',
        status: 'pending'
      }));

      // Verify insert was called with the right data for purchase_order_lines
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            po_id: mockOrderId,
            item_id: 'de651fa6-bcfd-4127-b266-8c23e473583e',
            quantity: 5
          }),
          expect.objectContaining({
            po_id: mockOrderId,
            item_id: 'de651fa6-bcfd-4127-b266-8c23e473583f',
            quantity: 3
          })
        ])
      );

      // Check the result
      expect(result.success).toBe(true);
      expect(result.orderId).toBe(mockOrderId);
    });

    it('should handle missing required fields', async () => {
      // Create FormData with missing fields
      const formData = new FormData();
      formData.append('poNumber', 'PO-TEST-123');
      // Missing supplier and materials

      // Mock Supabase
      const mockSupabaseClient = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn(),
      };

      // Mock the executeServerDbOperation function
      vi.mocked(databaseModule.executeServerDbOperation).mockImplementation(
        async (callback) => {
          return callback(mockSupabaseClient as any);
        }
      );

      // Call the function
      const result = await createOrder(formData);

      // Check that no insert was attempted
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();

      // Check the error result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });

    it('should handle database errors when creating purchase order', async () => {
      // Create valid FormData
      const formData = new FormData();
      formData.append('poNumber', 'PO-TEST-123');
      formData.append('supplier', '0e84084f-139e-44b5-8041-faabbad25166');
      formData.append('orderDate', '2023-04-15');
      formData.append('material-1-name', 'Material 1');
      formData.append('material-1-id', 'de651fa6-bcfd-4127-b266-8c23e473583e');
      formData.append('material-1-quantity', '5');

      // Mock Supabase with an error
      const mockSupabaseClient = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation(() => {
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            }),
          };
        }),
      };

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock the executeServerDbOperation function
      vi.mocked(databaseModule.executeServerDbOperation).mockImplementation(
        async (callback) => {
          return callback(mockSupabaseClient as any);
        }
      );

      // Call the function
      const result = await createOrder(formData);

      // Check the result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create order');

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});

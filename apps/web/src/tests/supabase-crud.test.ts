import { createClient } from '@/lib/supabase/server';
import { SupabaseCRUD, createCRUD, FilterCondition } from '@/utils/crud';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test Item' }, error: null }),
    rpc: jest.fn().mockResolvedValue({ data: { result: 'Success' }, error: null }),
  })),
}));

describe('SupabaseCRUD', () => {
  let crudInstance: SupabaseCRUD<any>;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    crudInstance = new SupabaseCRUD('test_table', 'id');
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('Basic CRUD operations', () => {
    it('should fetch all records', async () => {
      // Setup the mock to return specific data
      const mockData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      (createClient().from().select as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      
      const result = await crudInstance.fetchAll();
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().select).toHaveBeenCalledWith('*');
      expect(result).toEqual({ data: mockData, error: null });
    });
    
    it('should fetch a record by ID', async () => {
      const mockData = { id: 1, name: 'Item 1' };
      (createClient().from().select().eq().single as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      
      const result = await crudInstance.fetchById(1);
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().select).toHaveBeenCalledWith('*');
      expect(createClient().from().select().eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual({ data: mockData, error: null });
    });
    
    it('should create a record', async () => {
      const newItem = { name: 'New Item' };
      const mockData = { id: 3, name: 'New Item' };
      (createClient().from().insert().select().single as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      
      const result = await crudInstance.create(newItem);
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().insert).toHaveBeenCalledWith(newItem);
      expect(createClient().from().insert().select).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });
    
    it('should update a record', async () => {
      const updateData = { name: 'Updated Item' };
      const mockData = { id: 1, name: 'Updated Item' };
      (createClient().from().update().eq().select().single as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      
      const result = await crudInstance.update(1, updateData);
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().update).toHaveBeenCalledWith(updateData);
      expect(createClient().from().update().eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual({ data: mockData, error: null });
    });
    
    it('should delete a record', async () => {
      (createClient().from().delete().eq as jest.Mock).mockResolvedValueOnce({
        error: null,
      });
      
      const result = await crudInstance.delete(1);
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().delete).toHaveBeenCalled();
      expect(createClient().from().delete().eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual({ data: null, error: null });
    });
  });
  
  describe('Advanced operations', () => {
    it('should perform complex selects with joins', async () => {
      const mockData = [{ id: 1, name: 'Item 1', related: { id: 1, name: 'Related 1' } }];
      (createClient().from().select as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      
      const result = await crudInstance.select({
        columns: ['id', 'name'],
        joins: {
          related: { columns: ['id', 'name'] }
        },
        filters: [{ column: 'status', operator: 'eq', value: 'active' }],
        orderBy: [{ column: 'created_at', ascending: false }],
        limit: 10,
        offset: 0
      });
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().select).toHaveBeenCalledWith('id, name, related(id, name)');
      expect(createClient().from().select().eq).toHaveBeenCalledWith('status', 'active');
      expect(createClient().from().select().eq().order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(createClient().from().select().eq().order().limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({ data: mockData, error: null });
    });
    
    it('should count records with filters', async () => {
      const mockCount = 5;
      (createClient().from().select as jest.Mock).mockResolvedValueOnce({
        count: mockCount,
        error: null,
      });
      
      const filters: FilterCondition[] = [
        { column: 'status', operator: 'eq', value: 'active' }
      ];
      
      const result = await crudInstance.count(filters);
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(createClient().from().select().eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual({ data: mockCount, error: null });
    });
    
    it('should perform RPC calls', async () => {
      const mockResult = { result: 'function result' };
      (createClient().rpc as jest.Mock).mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });
      
      const result = await crudInstance.rpc('test_function', { param1: 'value1' });
      
      expect(createClient().rpc).toHaveBeenCalledWith('test_function', { param1: 'value1' });
      expect(result).toEqual({ data: mockResult, error: null });
    });
    
    it('should upsert records', async () => {
      const upsertData = { id: 1, name: 'Upserted Item' };
      (createClient().from().upsert().select().single as jest.Mock).mockResolvedValueOnce({
        data: upsertData,
        error: null,
      });
      
      const result = await crudInstance.upsert(upsertData);
      
      expect(createClient().from).toHaveBeenCalledWith('test_table');
      expect(createClient().from().upsert).toHaveBeenCalledWith(upsertData);
      expect(result).toEqual({ data: upsertData, error: null });
    });
  });

  describe('Error handling', () => {
    it('should handle errors in fetchAll', async () => {
      const mockError = new Error('Database error');
      (createClient().from().select as jest.Mock).mockRejectedValueOnce(mockError);
      
      const result = await crudInstance.fetchAll();
      
      expect(result).toEqual({ data: null, error: 'Database error' });
    });
    
    it('should handle errors in create', async () => {
      const mockError = { message: 'Validation error' };
      (createClient().from().insert().select().single as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: mockError,
      });
      
      const result = await crudInstance.create({ name: 'Invalid Item' });
      
      expect(result).toEqual({ data: null, error: mockError.message });
    });
  });

  describe('createCRUD helper', () => {
    it('should create a typed CRUD instance', () => {
      const typedCrud = createCRUD('raw_materials', 'material_id');
      expect(typedCrud).toBeInstanceOf(SupabaseCRUD);
      // Since this is just type checking at compile time, we're mainly verifying it creates an instance
    });
  });
});
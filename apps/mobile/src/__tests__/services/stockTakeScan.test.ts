import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handleStockTakeScan, type StocktakeScanPayload } from '@/services/stockTakeScan';

describe('stockTakeScan', () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();
  global.fetch = mockFetch;
  
  // Test values
  const testPayload: StocktakeScanPayload = {
    barcode: 'TEST123456',
    sessionId: 'test-session-id',
    deviceId: 'test-device-id',
  };
  const testToken = 'test-auth-token';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default success response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        scanId: 'test-scan-id',
        message: 'Scan recorded successfully',
      }),
    });
  });
  
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('sends the correct request to the API', async () => {
    // Call the function
    await handleStockTakeScan(testPayload, testToken);
    
    // Check that fetch was called with the correct parameters
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/scanner/stocktake/scan'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
          'Accept': 'application/json',
        }),
        mode: 'cors',
        body: JSON.stringify(testPayload),
      })
    );
  });

  it('returns a success response when the API call succeeds', async () => {
    const response = await handleStockTakeScan(testPayload, testToken);
    
    expect(response).toEqual({
      success: true,
      scanId: 'test-scan-id',
      message: 'Scan recorded successfully',
    });
  });

  it('handles API error responses correctly', async () => {
    // Mock an error response from the API
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'Invalid barcode format',
      }),
    });
    
    const response = await handleStockTakeScan(testPayload, testToken);
    
    expect(response).toEqual({
      success: false,
      error: 'Invalid barcode format',
    });
  });

  it('handles network errors correctly', async () => {
    // Mock a network failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const response = await handleStockTakeScan(testPayload, testToken);
    
    expect(response).toEqual({
      success: false,
      error: 'Network error',
    });
  });

  it('handles unexpected API responses correctly', async () => {
    // Mock a response with an unexpected structure
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        // Missing expected fields
        unexpected: 'data',
      }),
    });
    
    const response = await handleStockTakeScan(testPayload, testToken);
    
    // Should still return a success structure but with undefined fields
    expect(response).toEqual({
      success: true,
      scanId: undefined,
      message: undefined,
    });
  });

  it('handles malformed JSON responses', async () => {
    // Mock a response that throws during JSON parsing
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('JSON parse error'); },
    });
    
    const response = await handleStockTakeScan(testPayload, testToken);
    
    expect(response).toEqual({
      success: false,
      error: 'JSON parse error',
    });
  });

  it('handles authentication failures from API', async () => {
    // Mock an auth error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Authentication required',
      }),
    });
    
    const response = await handleStockTakeScan(testPayload, testToken);
    
    expect(response).toEqual({
      success: false,
      error: 'Authentication required',
    });
  });
}); 
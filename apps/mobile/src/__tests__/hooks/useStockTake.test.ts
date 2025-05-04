import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useStockTake } from '@/hooks/use-stock-take';
import { handleStockTakeScan } from '@/services/stockTakeScan';
import { supabase } from '@/lib/supabase/client';

// Mock external dependencies
vi.mock('@/services/stockTakeScan', () => ({
  handleStockTakeScan: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    removeChannel: vi.fn(),
  },
}));

// Mock fetch API
const originalFetch = global.fetch;
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useStockTake', () => {
  const sessionId = 'test-session-id';
  const mockToken = 'test-token';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase authentication session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          access_token: mockToken,
        },
      },
      error: null,
    });
    
    // Default fetch mock implementation
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, session: { id: sessionId, name: 'Test Session' } }),
    });
    
    // Default scan handler mock
    (handleStockTakeScan as any).mockResolvedValue({
      success: true,
      scanId: 'test-scan-id',
      message: 'Scan recorded successfully',
    });
  });
  
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useStockTake());
    
    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.isScanning).toBe(false);
    expect(result.current.lastScanStatus).toBe('idle');
    expect(result.current.lastScanMessage).toBeNull();
    expect(result.current.lastScanId).toBeNull();
  });

  it('should start a stocktake session successfully', async () => {
    const { result } = renderHook(() => useStockTake());
    
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    
    // Check state updates
    expect(result.current.currentSessionId).toBe(sessionId);
    expect(result.current.isScanning).toBe(false);
    
    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/scanner/stocktake/sessions/start'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it('should handle auth errors when starting a session', async () => {
    // Mock auth error
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'Auth error' },
    });
    
    const { result } = renderHook(() => useStockTake());
    
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    
    // Should update state with error
    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.lastScanStatus).toBe('error');
    expect(result.current.lastScanMessage).toContain('Authentication error');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API errors when starting a session', async () => {
    // Mock failed API response
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Server error' }),
    });
    
    const { result } = renderHook(() => useStockTake());
    
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    
    // Should update state with error
    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.lastScanStatus).toBe('error');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should end a stocktake session successfully', async () => {
    // Initialize with active session
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, session: { id: sessionId, name: 'Test Session' } }),
    });
    
    const { result } = renderHook(() => useStockTake());
    
    // Start session first
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    
    // Mock successful end session response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Session ended' }),
    });
    
    // End session
    await act(async () => {
      await result.current.endStocktakeSession();
    });
    
    // Check state updates
    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.lastScanStatus).toBe('idle');
    expect(result.current.lastScanMessage).toContain('ended successfully');
    
    // Verify API call
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining(`/api/scanner/stocktake/sessions/${sessionId}/end`),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it('should process a barcode scan successfully during an active session', async () => {
    // Initialize with active session
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, session: { id: sessionId, name: 'Test Session' } }),
    });
    
    const { result } = renderHook(() => useStockTake());
    
    // Start session first
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    
    // Process a scan
    const barcode = 'TEST123456';
    await act(async () => {
      await result.current.processStocktakeScan(barcode);
    });
    
    // Check state updates
    expect(result.current.isScanning).toBe(false);
    expect(result.current.lastScanStatus).toBe('success');
    
    // Verify scan service was called with correct params
    expect(handleStockTakeScan).toHaveBeenCalledWith(
      {
        barcode,
        sessionId,
        deviceId: expect.any(String),
      },
      mockToken
    );
  });

  it('should not process scans when no session is active', async () => {
    const { result } = renderHook(() => useStockTake());
    
    // Try to process a scan without an active session
    await act(async () => {
      await result.current.processStocktakeScan('TEST123456');
    });
    
    // Should update state with error
    expect(result.current.lastScanStatus).toBe('error');
    expect(result.current.lastScanMessage).toContain('No active stocktake session');
    expect(handleStockTakeScan).not.toHaveBeenCalled();
  });

  it('should handle scan processing failures', async () => {
    // Initialize with active session
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, session: { id: sessionId, name: 'Test Session' } }),
    });
    
    const { result } = renderHook(() => useStockTake());
    
    // Start session first
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    
    // Mock scan failure
    (handleStockTakeScan as any).mockResolvedValueOnce({
      success: false,
      error: 'Failed to process scan',
    });
    
    // Process a scan
    await act(async () => {
      await result.current.processStocktakeScan('TEST123456');
    });
    
    // Check state updates
    expect(result.current.isScanning).toBe(false);
    expect(result.current.lastScanStatus).toBe('error');
  });
}); 
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { useStockTake } from '@/features/scanner/hooks/use-stocktake';
import { handleStockTakeScan } from '@/features/scanner/services/stocktake-scan';
import { supabase } from '@/lib/supabase/client';

// Define the hardcoded device ID used in the hook
const hardcodedDeviceId = '4f096e70-33fd-4913-9df1-8e1fae9591bc';

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
      status: 200,
    });
    
    // Default scan handler mock
    (handleStockTakeScan as any).mockResolvedValue({ success: true, scanId: 'scan-123', message: 'Scan OK' });
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
    // Setup mocks
    const { result } = renderHook(() => useStockTake());

    // Mock fetch responses sequence for this test
    mockFetch
      // 1. Check active session (return specific session to end)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, session: { id: sessionId, name: 'Test Session', location: null } }),
      })
      // 2. End session API call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Session ended successfully.' }),
      });

    // Wait for initialization to finish and session to be active
    await waitFor(() => expect(result.current.currentSessionId).toBe(sessionId));

    // End the session
    await act(async () => {
      result.current.endStocktakeSession();
    });

    // Wait for the state update after ending session
    await waitFor(() => {
        expect(result.current.currentSessionId).toBeNull();
        expect(result.current.lastScanStatus).toBe('idle');
        // Ensure the message is not null before checking content
        expect(result.current.lastScanMessage).not.toBeNull();
        expect(result.current.lastScanMessage).toContain('ended successfully');
    });

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith(
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
        sessionId: 'test-session-id',
        deviceId: hardcodedDeviceId,
        location: null,
      },
      'test-token'
    );
  });

  it('should not process scans when no session is active', async () => {
    // **Override** the default fetch mock for the active session check for THIS test
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, session: null }), // Ensure no active session for this test
    });

    const { result } = renderHook(() => useStockTake());

    // Wait for initialization to complete (and confirm no session was found)
    await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
        expect(result.current.currentSessionId).toBeNull();
    });

    const barcode = 'SCAN001';
    // Try to process a scan without an active session
    await act(async () => {
      await result.current.processStocktakeScan(barcode);
    });
    
    // Should update state with error
    expect(result.current.lastScanStatus).toBe('error');
    expect(result.current.lastScanMessage).toContain('No active stocktake session');
    expect(handleStockTakeScan).not.toHaveBeenCalled();
  });

  it('should handle scan processing failures', async () => {
    const scanError = 'Invalid barcode';
    // Mock check active session (none)
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, session: null }),
    });
    // Mock start session success
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, session: { id: 'fail-session', name: 'Fail Session' } }),
    });

    const { result } = renderHook(() => useStockTake());

    // Wait for init and start session
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    await act(async () => {
      await result.current.startStocktakeSession();
    });
    await waitFor(() => expect(result.current.currentSessionId).toBe('fail-session'));

    // Mock failed scan response
    (handleStockTakeScan as any).mockResolvedValueOnce({
      success: false,
      message: scanError,
    });

    await act(async () => {
      await result.current.processStocktakeScan('BADSCAN');
    });

    expect(result.current.lastScanStatus).toBe('error');
    expect(result.current.lastScanMessage).toBe(scanError);
  });
}); 
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // Need router context
import Index from "@/pages/Index";
import { useStockTake } from "@/features/scanner/hooks/use-stocktake"; // To mock
import { useScan } from "@/core/hooks/use-scan"; // To mock (if needed)
import { vi, Mock } from "vitest";

// Mock the hooks
vi.mock("@/core/hooks/use-stock-take");
vi.mock("@/core/hooks/use-scan"); // Mock transport scan if its interaction matters

// Mock supabase client if IndexContent fetches session directly (it was commented out)
// vi.mock('@/core/lib/supabase/client', ...)

// Mock useToast
vi.mock("@/core/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Index Page Integration - Scan Input", () => {
  const mockProcessStocktakeScan = vi.fn();
  const mockStartStocktakeSession = vi.fn();
  const mockEndStocktakeSession = vi.fn();
  const mockHandleDrumScan = vi.fn(); // Mock from useScan

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock return value for useStockTake
    (useStockTake as Mock).mockReturnValue({
      currentSessionId: null, // Start with no active session
      isScanning: false,
      lastScanStatus: "idle",
      lastScanMessage: null,
      lastScanId: null,
      currentLocation: null,
      isInitializing: false, // Assume initialized
      startStocktakeSession: mockStartStocktakeSession.mockImplementation(
        async () => {
          // Simulate starting a session - update the mock's internal state representation
          (useStockTake as Mock).mockReturnValue({
            ...useStockTake(), // Get current mock state
            currentSessionId: "mock-session-123", // Set active session
            lastScanMessage: "Session started",
          });
        }
      ),
      endStocktakeSession: mockEndStocktakeSession.mockImplementation(() => {
        // Simulate ending a session
        (useStockTake as Mock).mockReturnValue({
          ...useStockTake(),
          currentSessionId: null,
          lastScanMessage: "Session ended",
        });
      }),
      processStocktakeScan: mockProcessStocktakeScan.mockResolvedValue({
        success: true,
        message: "Mock Scan OK",
        scanId: "mock-scan-id",
      }),
    });

    // Setup mock return value for useScan
    (useScan as Mock).mockReturnValue({
      handleDrumScan: mockHandleDrumScan,
      // Add other properties returned by useScan if needed
    });
  });

  it("should call processStocktakeScan when input is entered during an active stocktake session", async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    // Simulate starting a session (e.g., clicking the StocktakeButton - needs label/role)
    // For simplicity here, we'll directly modify the mock state *as if* the session started
    act(() => {
      (useStockTake as Mock).mockReturnValue({
        ...(useStockTake() as ReturnType<typeof useStockTake>), // Get current mock state
        currentSessionId: "mock-session-123", // Set active session
      });
    });

    // Re-render might be needed if state changes affect component structure significantly
    // Or use waitFor to ensure effects dependent on session ID have run

    await waitFor(() => {
      // Check that the component recognizes the active session state (e.g., ScanInput becomes active)
      // This is hard to check directly without exposing internal state, rely on behavior below
    });

    const barcodeInput = screen.getByTestId("barcode-input"); // Use test-id added previously
    const testBarcode = "INTEGRATION_TEST_SCAN";

    // Simulate typing into the (focused) hidden input
    fireEvent.change(barcodeInput, { target: { value: testBarcode } });
    fireEvent.keyDown(barcodeInput, { key: "Enter" });

    // Check if the stocktake scan processor was called
    await waitFor(() => {
      expect(mockProcessStocktakeScan).toHaveBeenCalledWith(testBarcode);
    });

    // Ensure the transport scan was NOT called
    expect(mockHandleDrumScan).not.toHaveBeenCalled();
  });

  // Add more tests:
  // - Test that transportScan.handleDrumScan is called when NO stocktake session active
  // - Test interaction with the actual StocktakeButton if possible
});

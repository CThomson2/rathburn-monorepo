import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { StocktakeButton } from "@/features/scanner/components/scan-button/scan-button";
import { useStockTake } from "@/features/scanner/hooks/stocktake/use-stocktake";
import { useToast } from "@/core/components/ui/use-toast";

// Mock the hooks
vi.mock("@/core/hooks/use-stock-take", () => ({
  useStockTake: vi.fn(),
}));

vi.mock("@/core/components/ui/use-toast", () => ({
  useToast: vi.fn(),
}));

describe("StocktakeButton", () => {
  // Common mock setup
  const mockStartSession = vi.fn().mockResolvedValue(undefined);
  const mockEndSession = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default hook mocks
    (useStockTake as any).mockReturnValue({
      currentSessionId: null,
      isScanning: false,
      startStocktakeSession: mockStartSession,
      endStocktakeSession: mockEndSession,
    });

    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
  });

  it("renders correctly when no session is active", () => {
    render(<StocktakeButton />);

    // Should find button with Scan icon (not StopCircle)
    expect(
      screen.queryByLabelText("Start stock take session")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("End stock take session")
    ).not.toBeInTheDocument();
  });

  it("renders correctly when a session is active", () => {
    // Mock the hook to return an active session
    (useStockTake as any).mockReturnValue({
      currentSessionId: "test-session-id",
      isScanning: false,
      startStocktakeSession: mockStartSession,
      endStocktakeSession: mockEndSession,
    });

    render(<StocktakeButton />);

    // Should find button with StopCircle icon
    expect(
      screen.queryByLabelText("End stock take session")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Start stock take session")
    ).not.toBeInTheDocument();
  });

  it("starts a new session when clicked while inactive", async () => {
    render(<StocktakeButton />);

    // Click the button
    const button = screen.getByLabelText("Start stock take session");
    fireEvent.click(button);

    // Should call startStocktakeSession
    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Stock Take Started",
        })
      );
    });
  });

  it("ends the current session when clicked while active", async () => {
    // Mock active session
    (useStockTake as any).mockReturnValue({
      currentSessionId: "test-session-id",
      isScanning: false,
      startStocktakeSession: mockStartSession,
      endStocktakeSession: mockEndSession,
    });

    render(<StocktakeButton />);

    // Click the button
    const button = screen.getByLabelText("End stock take session");
    fireEvent.click(button);

    // Should call endStocktakeSession
    await waitFor(() => {
      expect(mockEndSession).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Stock Take Ended",
        })
      );
    });
  });

  it("shows error toast when starting session fails", async () => {
    // Mock a failing start session
    const mockFailedStart = vi
      .fn()
      .mockRejectedValue(new Error("Failed to start"));
    (useStockTake as any).mockReturnValue({
      currentSessionId: null,
      isScanning: false,
      startStocktakeSession: mockFailedStart,
      endStocktakeSession: mockEndSession,
    });

    render(<StocktakeButton />);

    // Click the button
    const button = screen.getByLabelText("Start stock take session");
    fireEvent.click(button);

    // Should show error toast
    await waitFor(() => {
      expect(mockFailedStart).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          variant: "destructive",
        })
      );
    });
  });
});

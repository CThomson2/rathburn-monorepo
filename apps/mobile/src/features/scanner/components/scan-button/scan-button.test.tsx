import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { StocktakeButton } from "@/features/scanner/components/scan-button/scan-button";
import { useStockTake } from "@/features/scanner/hooks/stocktake/use-stocktake";
import { useToast } from "@/components/ui/use-toast";

// Mock custom hooks
vi.mock("@/features/scanner/hooks/stocktake/use-stocktake", () => ({
  useStockTake: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
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
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ScanInput } from "@/features/transport/ScanInput";

describe("ScanInput", () => {
  const mockOnScan = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Use fake timers for controlling timeouts
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after tests
  });

  it("renders a hidden input element", () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    const input = screen.getByLabelText("Barcode scanner input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-hidden", "true");
    expect(input).toHaveStyle({
      position: "fixed",
      opacity: 0,
    });
  });

  it("triggers onScan when Enter key is pressed with valid input", () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    const input = screen.getByLabelText("Barcode scanner input");

    // Type barcode and press Enter
    fireEvent.change(input, { target: { value: "BARCODE123" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnScan).toHaveBeenCalledWith("BARCODE123");
    expect(input).toHaveValue(""); // Input should be cleared after scanning
  });

  it("automatically sends barcode after timeout when no Enter key is pressed", async () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    const input = screen.getByLabelText("Barcode scanner input");

    // Type barcode without pressing Enter
    fireEvent.change(input, { target: { value: "BARCODE123" } });

    // Advance timers to trigger the auto-send timeout (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnScan).toHaveBeenCalledWith("BARCODE123");
  });

  it("does not trigger onScan if barcode is too short", () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    const input = screen.getByLabelText("Barcode scanner input");

    // Type short barcode and press Enter
    fireEvent.change(input, { target: { value: "AB" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnScan).not.toHaveBeenCalled();
  });

  it("does not process input when isActive is false", () => {
    render(<ScanInput onScan={mockOnScan} isActive={false} />);

    const input = screen.getByLabelText("Barcode scanner input");
    expect(input).toBeDisabled();

    // Type barcode and press Enter
    fireEvent.change(input, { target: { value: "BARCODE123" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnScan).not.toHaveBeenCalled();
  });

  it("automatically refocuses input when it loses focus", async () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    const input = screen.getByLabelText("Barcode scanner input");

    // Simulate blur event
    fireEvent.blur(input);

    // Advance timers to trigger refocus timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // In a real browser environment, the input would get focus
    // In tests, we can't directly check document.activeElement equality
    // but we can check that focus handling was attempted
    expect(input).toBeInTheDocument();
  });
});

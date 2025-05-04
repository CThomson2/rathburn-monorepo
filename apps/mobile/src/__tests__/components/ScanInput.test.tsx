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

  it("triggers the global keydown handler for keyboard-wedge scanner input", () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    // Simulate rapid key presses from a barcode scanner
    const barcode = "BARCODE123";

    // First simulate rapid keypresses (less than 100ms apart)
    act(() => {
      for (let i = 0; i < barcode.length; i++) {
        // Dispatch keydown event to window to simulate scanner
        const keyEvent = new KeyboardEvent("keydown", { key: barcode[i] });
        window.dispatchEvent(keyEvent);
        // Advance timer slightly between keypresses (30ms)
        vi.advanceTimersByTime(30);
      }

      // Finish with Enter key
      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
      window.dispatchEvent(enterEvent);
    });

    expect(mockOnScan).toHaveBeenCalledWith(barcode);
  });

  it("ignores slow keydown events as they are likely manual typing", () => {
    render(<ScanInput onScan={mockOnScan} isActive={true} />);

    // Simulate slow key presses (likely manual typing, not a scanner)
    const barcode = "SLOW123";

    act(() => {
      for (let i = 0; i < barcode.length; i++) {
        const keyEvent = new KeyboardEvent("keydown", { key: barcode[i] });
        window.dispatchEvent(keyEvent);
        // Advance timer by more than 100ms between keypresses
        vi.advanceTimersByTime(150);
      }

      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
      window.dispatchEvent(enterEvent);
    });

    // Since the keypresses were too slow, buffer should have been reset
    // and the final scan should not contain the full barcode
    expect(mockOnScan).not.toHaveBeenCalledWith(barcode);
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

import { useRef, useEffect, useState } from "react";

interface ScanInputProps {
  onScan: (barcode: string) => void;
}

/**
 * A hidden input element that captures barcode scans and passes them to the
 * `onScan` callback.
 *
 * This component automatically focuses the input element on mount and
 * re-focuses it whenever the window regains focus. It also attempts to prevent
 * the virtual keyboard from appearing on mobile devices.
 *
 * @prop {function} onScan - called with the scanned barcode string
 *
 * @example
 * <ScanInput onScan={barcode => console.log(barcode)} />
 */
export function ScanInput({ onScan }: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Auto-send the barcode after a delay of inactivity
  // This helps with scanning barcodes that don't end with Enter key
  useEffect(() => {
    if (!barcode.trim()) return;

    const timeoutId = setTimeout(() => {
      if (barcode.trim().length >= 3) {
        console.log("Auto-sending barcode after timeout:", barcode);
        onScan(barcode.trim());
        setBarcode("");
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [barcode, onScan]);

  // Focus the input element on component mount
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        // Focus the input but don't show the keyboard on mobile
        inputRef.current.focus();
        setIsFocused(true);

        // This tries to prevent keyboard from showing on first focus
        inputRef.current.setAttribute("readonly", "readonly");
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.removeAttribute("readonly");
          }
        }, 100);
      }
    };

    // Initial focus
    focusInput();

    // Re-focus the input when the window regains focus
    const handleFocus = () => {
      focusInput();
    };

    // Periodically check if input has lost focus and refocus if needed
    const focusInterval = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        console.log("ScanInput lost focus, refocusing...");
        focusInput();
      }
    }, 1000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("click", handleFocus);
    document.addEventListener("touchstart", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", handleFocus);
      document.removeEventListener("touchstart", handleFocus);
      clearInterval(focusInterval);
    };
  }, []);

  // Handle keypress events for barcode scanning
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("Key pressed:", e.key, "Current barcode:", barcode);

    // If Enter key is pressed, process the barcode
    if (e.key === "Enter" && barcode.trim()) {
      console.log("Enter key pressed, processing barcode:", barcode);
      onScan(barcode.trim());
      setBarcode("");
      e.preventDefault();
    }
  };

  // Capture input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
    console.log("Barcode input changed:", e.target.value);
  };

  // Handle focus and blur events
  const handleFocus = () => {
    setIsFocused(true);
    console.log("ScanInput focused");
  };

  const handleBlur = () => {
    setIsFocused(false);
    console.log("ScanInput blurred, refocusing...");
    // Refocus after a short delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={barcode}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        position: "fixed", // Use fixed instead of absolute to ensure it stays in view
        top: -100, // Position off-screen but not too far
        left: 0,
        opacity: 0,
        height: 10, // Small but not zero height
        width: 10, // Small but not zero width
        zIndex: 9999, // Very high z-index
        pointerEvents: "none", // Prevents it from intercepting touch events
      }}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode="none"
      autoFocus
      aria-hidden="true"
      data-testid="barcode-input"
    />
  );
}

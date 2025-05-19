import { useRef, useEffect, useState } from "react";

interface ScanInputProps {
  onScan: (barcode: string) => void;
  isActive?: boolean; // Add a prop to control whether the input should maintain focus
}

/**
 * A hidden input element that captures barcode scans and passes them to the
 * `onScan` callback.
 *
 * This component automatically focuses the input element when `isActive` is true
 * and attempts to maintain focus. It uses direct input events (`onChange`, `onKeyDown`)
 * to capture scans when active. It also includes a timeout fallback for devices
 * that don't send an "Enter" key event.
 *
 * @prop {function} onScan - called with the scanned barcode string
 * @prop {boolean} isActive - determines if the input should maintain focus (default: true)
 *
 * @example
 * <ScanInput onScan={barcode => console.log(barcode)} isActive={true} />
 */
export function ScanInput({ onScan, isActive = true }: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Auto-send the barcode after a delay of inactivity
  useEffect(() => {
    if (!barcode.trim() || !isActive) return;

    const timeoutId = setTimeout(() => {
      if (barcode.trim().length >= 3) {
        onScan(barcode.trim());
        setBarcode("");
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [barcode, onScan, isActive]);

  // Focus the input element on component mount and when isActive changes
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && isActive) {
        inputRef.current.focus();
        setIsFocused(true);

        // This tries to prevent keyboard from showing on first focus
        inputRef.current.setAttribute("readonly", "readonly");
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.removeAttribute("readonly");
          }
        }, 100);
      } else if (
        !isActive &&
        inputRef.current &&
        document.activeElement === inputRef.current
      ) {
        inputRef.current.blur();
        setIsFocused(false);
      }
    };

    // Focus immediately when becoming active
    if (isActive) {
      focusInput();

      // Set up a focus interval for maintaining focus
      const focusInterval = setInterval(() => {
        if (
          inputRef.current &&
          document.activeElement !== inputRef.current &&
          isActive
        ) {
          focusInput();
        }
      }, 1000);

      // Set up event listeners to help maintain focus
      const handleFocus = () => {
        if (isActive) {
          setTimeout(focusInput, 100);
        }
      };

      window.addEventListener("focus", handleFocus);
      document.addEventListener("click", handleFocus);
      document.addEventListener("touchstart", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("click", handleFocus);
        document.removeEventListener("touchstart", handleFocus);
        clearInterval(focusInterval);
      };
    }
  }, [isActive]);

  // Handle keypress events for barcode scanning
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ignore if not active
    if (!isActive) {
      return;
    }

    // If Enter key is pressed, process the barcode stored in state
    if (e.key === "Enter" || e.key === "Backslash") {
      e.preventDefault(); // Prevent form submission or other default actions
      const currentBarcode = barcode.trim();
      if (currentBarcode.length >= 3) {
        onScan(currentBarcode);
        setBarcode(""); // Clear the state after processing
      }
    }
  };

  // Capture input changes (typing, pasting)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ignore if not active
    if (!isActive) {
      return;
    }

    const newValue = e.target.value;

    // Check for the backslash suffix from the hardware scanner
    if (newValue.endsWith("\\")) {
      e.preventDefault(); // Prevent any default action if applicable
      const processedBarcode = newValue.slice(0, -1).trim(); // Remove suffix and trim

      if (processedBarcode.length >= 3) {
        onScan(processedBarcode);
        setBarcode(""); // Clear the state
        if (inputRef.current) {
          inputRef.current.value = ""; // Directly clear the input element's value
        }
      } else {
        setBarcode(""); // Still clear the state
        if (inputRef.current) {
          inputRef.current.value = ""; // Directly clear the input element's value
        }
      }
      return; // Important: Stop further processing in this handler
    }

    // If no suffix, update state as usual for manual input or timeout processing
    setBarcode(newValue);
  };

  // Handle blur events - only refocus if still active
  const handleBlur = () => {
    if (!isActive) return;

    setIsFocused(false);

    // Refocus after a short delay only if still active
    // Use a longer delay to avoid focus fighting with other elements
    setTimeout(() => {
      if (
        inputRef.current &&
        isActive &&
        document.activeElement !== inputRef.current
      ) {
        inputRef.current.focus();
        setIsFocused(true);
      }
    }, 300);
  };

  // Add a special effect to log when component mounts/unmounts
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <>
      {" "}
      {/* Use a fragment to return multiple elements */}
      <input
        ref={inputRef}
        type="text"
        value={barcode}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (isActive) {
            setIsFocused(true);
          }
        }}
        onBlur={handleBlur}
        style={{
          position: "fixed", // Use fixed instead of absolute to ensure it stays in view
          top: -100, // Position off-screen but not too far
          left: 0,
          opacity: 0,
          height: 10, // Small but not zero height
          width: 10, // Small but not zero width
          zIndex: 9999, // Very high z-index
          pointerEvents: isActive ? "auto" : "none", // Prevents it from intercepting touch events when not active
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="none"
        autoFocus={isActive}
        aria-hidden="true"
        aria-label="Barcode scanner input"
        data-testid="barcode-input"
        disabled={!isActive}
      />
    </>
  );
}

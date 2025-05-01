import { useRef, useEffect, useState } from "react";

interface ScanInputProps {
  onScan: (barcode: string) => void;
  isActive?: boolean; // Add a prop to control whether the input should maintain focus
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
 * @prop {boolean} isActive - determines if the input should maintain focus (default: true)
 *
 * @example
 * <ScanInput onScan={barcode => console.log(barcode)} isActive={true} />
 */
export function ScanInput({ onScan, isActive = true }: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Buffer and timing refs for global barcode scanner detection
  const bufferRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  // Global keydown listener to capture keyboard-wedge barcode scanner input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only process keys if the component is active
      if (!isActive) return;

      const now = Date.now();
      // Reset buffer if pause between keys is too long
      if (lastTimeRef.current && now - lastTimeRef.current > 100) {
        bufferRef.current = "";
      }
      lastTimeRef.current = now;

      // On Enter, treat buffer as full scan
      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (code.length >= 3) {
          console.log("Global scan detected:", code);
          onScan(code);
        }
      } else if (e.key.length === 1) {
        // Append character to buffer
        bufferRef.current += e.key;
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () =>
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [onScan, isActive]);

  // Auto-send the barcode after a delay of inactivity
  useEffect(() => {
    if (!barcode.trim() || !isActive) return;

    const timeoutId = setTimeout(() => {
      if (barcode.trim().length >= 3) {
        console.log("Auto-sending barcode after timeout:", barcode);
        onScan(barcode.trim());
        setBarcode("");
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [barcode, onScan, isActive]);

  // Focus the input element on component mount and when isActive changes
  useEffect(() => {
    console.log(`[ScanInput] isActive changed to: ${isActive}`);

    const focusInput = () => {
      if (inputRef.current && isActive) {
        console.log(`[ScanInput] Focusing input element`);
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
      } else if (
        !isActive &&
        inputRef.current &&
        inputRef.current === document.activeElement
      ) {
        console.log(`[ScanInput] Blurring input element`);
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
          console.log("[ScanInput] Input lost focus, refocusing...");
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
    if (!isActive) return;

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
    if (!isActive) return;

    setBarcode(e.target.value);
    console.log("Barcode input changed:", e.target.value);
  };

  // Handle blur events - only refocus if still active
  const handleBlur = () => {
    if (!isActive) return;

    setIsFocused(false);
    console.log("[ScanInput] Input blurred, waiting to refocus...");

    // Refocus after a short delay only if still active
    // Use a longer delay to avoid focus fighting with other elements
    setTimeout(() => {
      if (
        inputRef.current &&
        isActive &&
        document.activeElement !== inputRef.current
      ) {
        console.log("[ScanInput] Refocusing after blur");
        inputRef.current.focus();
        setIsFocused(true);
      }
    }, 300);
  };

  // Add a special effect to log when component mounts/unmounts
  useEffect(() => {
    console.log("[ScanInput] Component mounted");

    return () => {
      console.log("[ScanInput] Component unmounted");
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={barcode}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        console.log("[ScanInput] Input focused directly");
        setIsFocused(true);
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
  );
}

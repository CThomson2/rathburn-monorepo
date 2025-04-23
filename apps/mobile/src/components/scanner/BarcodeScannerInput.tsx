// components/BarcodeScannerInput.tsx
import { useRef, useEffect, useState } from "react";
import { isMobile } from "../../utils/deviceDetection";

interface BarcodeScannerInputProps {
  onScan: (barcode: string) => void;
  isActive?: boolean;
  setIsActive?: (active: boolean) => void;
}

const BarcodeScannerInput = ({
  onScan,
  isActive = true,
  setIsActive,
}: BarcodeScannerInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  const bufferTimeout = useRef<number | null>(null);

  const activateScanner = () => {
    if (setIsActive) {
      setIsActive(true);
    }

    if (inputRef.current) {
      // For Android, set readonly first to prevent keyboard
      if (isMobile()) {
        inputRef.current.readOnly = true;
      }

      // Focus the input
      inputRef.current.focus();

      // For Android, remove readonly after focusing
      if (isMobile()) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.readOnly = false;
          }
        }, 100);
      }
    }
  };

  // Set up event listeners to keep input focused
  useEffect(() => {
    if (!isActive) return;

    const keepFocused = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        // For Android, prevent keyboard
        if (isMobile()) {
          inputRef.current.readOnly = true;
          inputRef.current.focus();
          setTimeout(() => {
            if (inputRef.current) inputRef.current.readOnly = false;
          }, 100);
        } else {
          inputRef.current.focus();
        }
      }
    };

    // Initial focus
    keepFocused();

    // Set up focus maintenance
    const focusInterval = setInterval(keepFocused, 300);

    // Add document-level event listeners
    document.addEventListener("visibilitychange", keepFocused);
    window.addEventListener("focus", keepFocused);
    document.addEventListener("touchstart", keepFocused);
    document.addEventListener("click", keepFocused);

    return () => {
      clearInterval(focusInterval);
      document.removeEventListener("visibilitychange", keepFocused);
      window.removeEventListener("focus", keepFocused);
      document.removeEventListener("touchstart", keepFocused);
      document.removeEventListener("click", keepFocused);

      if (bufferTimeout.current) {
        window.clearTimeout(bufferTimeout.current);
        bufferTimeout.current = null;
      }
    };
  }, [isActive]);

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    // Clear any existing timeout
    if (bufferTimeout.current) {
      window.clearTimeout(bufferTimeout.current);
      bufferTimeout.current = null;
    }

    // Only process if we have a value
    if (value) {
      // Debounce to avoid double scans - many scanners trigger multiple events
      bufferTimeout.current = window.setTimeout(() => {
        const now = Date.now();

        // Prevent duplicate scans within 500ms
        if (now - lastScanTime > 500) {
          setLastScanTime(now);
          onScan(value);
        }

        // Clear the input for next scan
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Many scanners will send Enter key after the scan
    if (e.key === "Enter") {
      const value = inputRef.current?.value.trim() || "";

      if (value) {
        const now = Date.now();

        // Prevent duplicate scans within 500ms
        if (now - lastScanTime > 500) {
          setLastScanTime(now);
          onScan(value);
        }

        // Clear the input for next scan
        if (inputRef.current) {
          inputRef.current.value = "";
        }

        // Prevent default to avoid form submissions
        e.preventDefault();
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      onChange={handleBarcodeInput}
      onKeyDown={handleKeyDown}
      className="absolute opacity-0 pointer-events-none h-0 w-0 p-0 border-none"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
      aria-label="Barcode scan input"
    />
  );
};

export default BarcodeScannerInput;

// apps/mobile/src/features/transport/ScanInput.tsx
import { useRef, useEffect, useState, useCallback } from "react";

interface ScanInputProps {
  onScan: (barcode: string) => void;
  autoFocus?: boolean;
  placeholderText?: string;
  scanDelay?: number;
  disabled?: boolean;
}

/**
 * A hidden input element that captures barcode scans and passes them to the
 * `onScan` callback.
 *
 * This component automatically focuses the input element on mount and
 * re-focuses it whenever the window regains focus. It also attempts to prevent
 * the virtual keyboard from appearing on mobile devices.
 *
 * @param onScan Called with the scanned barcode string
 * @param autoFocus Whether to auto-focus the input on mount (default: true)
 * @param placeholderText Placeholder text for debug mode (default: "Scan barcode...")
 * @param scanDelay Minimum delay between scans in ms (default: 300)
 * @param disabled Whether the input is disabled (default: false)
 */
export function ScanInput({ 
  onScan, 
  autoFocus = true,
  placeholderText = "Scan barcode...",
  scanDelay = 300,
  disabled = false
}: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [isDebugMode, setIsDebugMode] = useState(false);
  const lastScanTimeRef = useRef<number>(0);

  // Handler for Enter key to submit scan
  const handleScanSubmit = useCallback(() => {
    if (!barcode.trim() || disabled) return;
    
    // Check if minimum scan delay has elapsed
    const now = Date.now();
    if (now - lastScanTimeRef.current < scanDelay) {
      console.log("Scan ignored: too soon after previous scan");
      return;
    }
    
    // Update last scan time
    lastScanTimeRef.current = now;
    
    // Process the scan
    onScan(barcode.trim());
    setBarcode("");
  }, [barcode, disabled, onScan, scanDelay]);

  // Handler for key press events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed, process the barcode
    if (e.key === "Enter") {
      e.preventDefault();
      handleScanSubmit();
    }
    
    // Toggle debug mode with Ctrl+Shift+D
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      e.preventDefault();
      setIsDebugMode(prev => !prev);
    }
  }, [handleScanSubmit]);

  // Capture input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  }, []);

  // Focus the input element on component mount and when window regains focus
  useEffect(() => {
    if (!autoFocus || disabled) return;
    
    const focusInput = () => {
      if (inputRef.current && !disabled) {
        // Focus without showing keyboard
        inputRef.current.focus();
        // This class prevents mobile browsers from zooming on focus
        document.documentElement.classList.add('no-focus-zoom');
      }
    };

    // Initial focus
    focusInput();

    // Re-focus when window or document regains focus
    window.addEventListener("focus", focusInput);
    document.addEventListener("click", focusInput);
    
    // Prevent zoom on mobile when input is focused
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
    document.head.appendChild(meta);

    return () => {
      window.removeEventListener("focus", focusInput);
      document.removeEventListener("click", focusInput);
      document.documentElement.classList.remove('no-focus-zoom');
      document.head.removeChild(meta);
    };
  }, [autoFocus, disabled]);

  // Apply initial tricks to prevent keyboard
  useEffect(() => {
    if (!inputRef.current || !autoFocus || disabled) return;
    
    // Temporarily set readonly to prevent keyboard on first focus
    inputRef.current.setAttribute("readonly", "readonly");
    
    // Remove readonly after a short delay
    const timeout = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.removeAttribute("readonly");
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [autoFocus, disabled]);

  // Helper for debugging - log barcode changes
  useEffect(() => {
    if (isDebugMode && barcode) {
      console.log("Barcode input:", barcode);
    }
  }, [barcode, isDebugMode]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        value={barcode}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          // In debug mode, show input for testing; otherwise hide it
          position: isDebugMode ? "fixed" : "absolute",
          opacity: isDebugMode ? 0.8 : 0,
          height: isDebugMode ? "auto" : 0,
          width: isDebugMode ? "80%" : 0,
          bottom: isDebugMode ? "20px" : 0,
          left: isDebugMode ? "50%" : 0,
          transform: isDebugMode ? "translateX(-50%)" : "none",
          zIndex: isDebugMode ? 9999 : -1,
          padding: isDebugMode ? "10px" : 0,
          borderRadius: isDebugMode ? "8px" : 0,
          border: isDebugMode ? "2px solid #0066FF" : "none",
          backgroundColor: isDebugMode ? "rgba(255, 255, 255, 0.9)" : "transparent",
        }}
        placeholder={isDebugMode ? placeholderText : ""}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-hidden={!isDebugMode}
      />
      
      {isDebugMode && (
        <div 
          style={{
            position: "fixed",
            bottom: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "4px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 9999,
          }}
        >
          Debug Mode: Press Enter to submit
        </div>
      )}
    </>
  );
}
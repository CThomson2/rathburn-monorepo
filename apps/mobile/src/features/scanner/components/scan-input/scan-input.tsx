import { useRef, useEffect } from "react";
import { useScanStore } from "@/core/stores/use-scan"; // Import the new store

// ScanInputProps is no longer needed as props are managed by the store
// interface ScanInputProps {
//   onScan: (barcode: string) => void;
//   isActive?: boolean;
// }

/**
 * A hidden input element that captures barcode scans.
 * This component is now controlled by the `useScanStore`.
 * It automatically focuses the input element when it should be active
 * (globally active and not manually paused) and attempts to maintain focus.
 */
export function ScanInput() {
  // Removed props
  const inputRef = useRef<HTMLInputElement>(null);

  // Get state and actions from the store
  const {
    isScanInputGloballyActive,
    isManuallyPaused,
    barcode,
    setBarcode,
    triggerScanProcess, // Renamed from onScan for clarity within the store
    setIsScanInputDOMFocused,
    clearBarcode,
    logCurrentState, // Added for debugging focus changes directly within component
  } = useScanStore();

  const shouldBeEffectivelyActive =
    isScanInputGloballyActive && !isManuallyPaused;

  // Auto-send the barcode after a delay of inactivity
  useEffect(() => {
    if (!barcode.trim() || !shouldBeEffectivelyActive) return;

    const timeoutId = setTimeout(() => {
      if (barcode.trim().length >= 3) {
        triggerScanProcess(barcode.trim());
        // Barcode is cleared by triggerScanProcess
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [barcode, triggerScanProcess, shouldBeEffectivelyActive]);

  // Focus the input element logic
  useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    const attemptFocus = () => {
      if (
        shouldBeEffectivelyActive &&
        document.activeElement !== inputElement
      ) {
        // logCurrentState('ScanInput_attemptFocus_before');
        inputElement.focus();
        // setIsScanInputDOMFocused(true) will be called by onFocus handler
        // logCurrentState('ScanInput_attemptFocus_after');
      }
    };

    const attemptBlur = () => {
      if (
        !shouldBeEffectivelyActive &&
        document.activeElement === inputElement
      ) {
        // logCurrentState('ScanInput_attemptBlur_before');
        inputElement.blur();
        // setIsScanInputDOMFocused(false) will be called by onBlur handler
        // logCurrentState('ScanInput_attemptBlur_after');
      }
    };

    if (shouldBeEffectivelyActive) {
      attemptFocus();
      // Interval to recapture focus if lost, e.g. by alerts or other OS-level interruptions
      const focusInterval = setInterval(attemptFocus, 1000);
      // Re-attempt focus on document click to handle cases where focus might be stolen by other UI elements.
      // Using 'click' is generally safer than 'touchstart' to avoid interfering with scrolling.
      document.addEventListener("click", attemptFocus);
      window.addEventListener("focus", attemptFocus); // When the window itself gains focus

      return () => {
        clearInterval(focusInterval);
        document.removeEventListener("click", attemptFocus);
        window.removeEventListener("focus", attemptFocus);
      };
    } else {
      attemptBlur(); // If not active, ensure it's blurred
    }
  }, [shouldBeEffectivelyActive, logCurrentState]);

  // Handle keypress events for barcode scanning
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldBeEffectivelyActive) {
      return;
    }

    if (e.key === "Enter" || e.key === "Backslash") {
      // Added Backslash as an Enter equivalent
      e.preventDefault();
      const currentBarcode = barcode.trim();
      if (currentBarcode.length >= 3) {
        triggerScanProcess(currentBarcode);
      }
      // Barcode is cleared by triggerScanProcess or handleChange for Backslash
    }
  };

  // Capture input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!shouldBeEffectivelyActive) {
      // If the input is not supposed to be active, ensure its value is cleared
      // This can happen if it was focused, then immediately paused/deactivated
      if (inputRef.current) inputRef.current.value = "";
      clearBarcode();
      return;
    }

    const newValue = e.target.value;

    if (newValue.endsWith("\\")) {
      // Hardware scanners sometimes send a backslash
      e.preventDefault();
      const processedBarcode = newValue.slice(0, -1).trim();
      if (processedBarcode.length >= 3) {
        triggerScanProcess(processedBarcode);
      }
      // Ensure input field is also cleared visually
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      // Barcode state is cleared by triggerScanProcess
      return;
    }
    setBarcode(newValue);
  };

  const onFocusHandler = () => {
    // logCurrentState('ScanInput_onFocusHandler_before');
    setIsScanInputDOMFocused(true);
    // logCurrentState('ScanInput_onFocusHandler_after');
    // Prevent keyboard on initial focus if possible (can be finicky)
    if (inputRef.current) {
      inputRef.current.setAttribute("readonly", "readonly");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.removeAttribute("readonly");
        }
      }, 100);
    }
  };

  const onBlurHandler = () => {
    // logCurrentState('ScanInput_onBlurHandler_before');
    setIsScanInputDOMFocused(false);
    // logCurrentState('ScanInput_onBlurHandler_after');
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={barcode} // Controlled by the store's barcode state
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocusHandler}
      onBlur={onBlurHandler}
      style={{
        position: "fixed",
        top: -100, // Position off-screen
        left: 0,
        opacity: 0,
        height: 1,
        width: 1,
        zIndex: -1, // Send it behind everything, focus can still be programmatically set
        pointerEvents: "none", // Completely disable pointer events on the input itself
      }}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode="none" // To prevent software keyboard on mobile if possible
      // autoFocus removed; focus is managed by useEffect
      aria-hidden="true"
      aria-label="Barcode scanner input"
      data-testid="barcode-input"
      // 'disabled' attribute can interfere with focus attempts; control via pointerEvents and logic
    />
  );
}

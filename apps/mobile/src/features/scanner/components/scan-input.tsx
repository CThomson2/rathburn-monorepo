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
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const addLogMessage = (message: string) => {
    // Keep only the last 20 messages to prevent the list from growing too large
    setLogMessages((prevMessages) => [message, ...prevMessages.slice(0, 19)]);
  };

  // Auto-send the barcode after a delay of inactivity
  useEffect(() => {
    if (!barcode.trim() || !isActive) return;

    const timeoutId = setTimeout(() => {
      if (barcode.trim().length >= 3) {
        // console.log("Auto-sending barcode after timeout:", barcode);
        addLogMessage(`Auto-sending barcode after timeout: ${barcode}`);
        onScan(barcode.trim());
        setBarcode("");
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [barcode, onScan, isActive]);

  // Focus the input element on component mount and when isActive changes
  useEffect(() => {
    // console.log(`[ScanInput] isActive changed to: ${isActive}`);
    addLogMessage(`isActive changed to: ${isActive}`);

    const focusInput = () => {
      if (inputRef.current && isActive) {
        // console.log(`[ScanInput] Focusing input element`);
        addLogMessage("Focusing input element");
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
        document.activeElement === inputRef.current
      ) {
        // console.log(`[ScanInput] Blurring input element`);
        addLogMessage("Blurring input element");
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
          // console.log("[ScanInput] Input lost focus, refocusing...");
          addLogMessage("Input lost focus, refocusing...");
          focusInput();
        }
      }, 1000);

      // Set up event listeners to help maintain focus
      const handleFocus = () => {
        if (isActive) {
          // Add a log for when this generic handleFocus is triggered
          addLogMessage(
            "Global focus/click/touchstart detected, attempting to refocus input."
          );
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
      // addLogMessage("[ScanInput] KeyDown ignored: Not active"); // Optional: Log inactive state
      return;
    }

    // console.log(
    //   "[ScanInput] KeyDown event FIRED:",
    //   e.key,
    //   "Current value:",
    //   inputRef.current?.value
    // );
    addLogMessage(
      `KeyDown event FIRED: ${e.key}, Current value: ${inputRef.current?.value || ""}`
    );

    // If Enter key is pressed, process the barcode stored in state
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission or other default actions
      const currentBarcode = barcode.trim();
      if (currentBarcode.length >= 3) {
        // console.log(
        //   "[ScanInput] Enter key pressed, processing barcode:",
        //   currentBarcode
        // );
        addLogMessage(
          `Enter key pressed, processing barcode: ${currentBarcode}`
        );
        onScan(currentBarcode);
        setBarcode(""); // Clear the state after processing
      } else {
        // console.log(
        //   "[ScanInput] Enter key pressed, but barcode is too short:",
        //   currentBarcode
        // );
        addLogMessage(
          `Enter key pressed, but barcode is too short: ${currentBarcode}`
        );
      }
    }
  };

  // Capture input changes (typing, pasting)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ignore if not active
    if (!isActive) {
      // addLogMessage("[ScanInput] Change ignored: Not active"); // Optional: Log inactive state
      return;
    }

    const newValue = e.target.value;
    setBarcode(newValue);
    // console.log("[ScanInput] Input changed (handleChange) FIRED:", newValue);
    addLogMessage(`Input changed (handleChange) FIRED: ${newValue}`);
  };

  // Handle blur events - only refocus if still active
  const handleBlur = () => {
    if (!isActive) return;

    setIsFocused(false);
    // console.log("[ScanInput] Input blurred, waiting to refocus...");
    addLogMessage("Input blurred, waiting to refocus...");

    // Refocus after a short delay only if still active
    // Use a longer delay to avoid focus fighting with other elements
    setTimeout(() => {
      if (
        inputRef.current &&
        isActive &&
        document.activeElement !== inputRef.current
      ) {
        // console.log("[ScanInput] Refocusing after blur");
        addLogMessage("Refocusing after blur");
        inputRef.current.focus();
        setIsFocused(true);
      }
    }, 300);
  };

  // Add a special effect to log when component mounts/unmounts
  useEffect(() => {
    // console.log("[ScanInput] Component mounted");
    addLogMessage("Component mounted");

    return () => {
      // console.log("[ScanInput] Component unmounted");
      addLogMessage("Component unmounted");
    };
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
            // Only set focused state if supposed to be active
            // console.log("[ScanInput] Input focused directly");
            addLogMessage("Input focused directly");
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
      {/* Visual logger */}
      {/* <ul
        style={{
          position: "fixed",
          top: "80px",
          left: "10px",
          right: "10px",
          bottom: "120px",
          // maxHeight: "400px",
          overflowY: "auto",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "10px",
          zIndex: 10000, // Ensure it's on top
          listStyleType: "none",
          fontSize: "12px",
          borderRadius: "5px",
          opacity: 0.8,
        }}
        aria-live="polite" // Announce changes to screen readers
      >
        {logMessages.map((msg, index) => (
          <li
            key={index}
            style={{
              borderBottom: "1px solid #555",
              paddingBottom: "3px",
              marginBottom: "3px",
            }}
          >
            {msg}
          </li>
        ))}
      </ul> */}
    </>
  );
}

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

  // Focus the input element on component mount
  useEffect(() => {
    if (inputRef.current) {
      // Focus the input but don't show the keyboard on mobile
      inputRef.current.focus();

      // This tries to prevent keyboard from showing on first focus
      inputRef.current.setAttribute("readonly", "readonly");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.removeAttribute("readonly");
        }
      }, 100);
    }

    // Re-focus the input when the window regains focus
    const handleFocus = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("click", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", handleFocus);
    };
  }, []);

  // Handle keypress events for barcode scanning
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed, process the barcode
    if (e.key === "Enter" && barcode.trim()) {
      onScan(barcode.trim());
      setBarcode("");
      e.preventDefault();
    }
  };

  // Capture input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={barcode}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        opacity: 0,
        height: 0,
        width: 0,
        zIndex: -1,
        // These properties help prevent keyboard from appearing on mobile
        // autoComplete: "off",
        // autoCorrect: "off",
        // autoCapitalize: "off",
        // spellCheck: false,
      }}
      readOnly={false} // We'll toggle this with JS
      // Additional attributes to prevent virtual keyboard
      inputMode="none"
      autoFocus
      aria-hidden="true"
    />
  );
}

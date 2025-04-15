// components/BarcodeScannerInput.tsx
import { useRef, useEffect } from "react";

const BarcodeScannerInput = ({
  onScan,
}: {
  onScan: (barcode: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Re-focus input when window gains focus or on user interaction
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

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const barcodeValue = e.target.value;
    // Process barcode value and pass to parent component
    onScan(barcodeValue);
    // Clear input for next scan
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    // Invisible input field that captures barcode scanner input
    <input
      title="Barcode Scanner"
      placeholder=""
      name="barcode"
      ref={inputRef}
      type="text"
      onBlur={(e) => e.target.focus()}
      onChange={handleBarcodeInput}
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
      }}
      autoFocus
    />
  );
};

export default BarcodeScannerInput;

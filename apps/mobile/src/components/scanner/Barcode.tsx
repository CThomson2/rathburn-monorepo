import React, { forwardRef } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface BarcodeProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Barcode input component that handles barcode scanning and manual entry
 */
const Barcode = forwardRef<HTMLInputElement, BarcodeProps>(
  ({ className, label, id = "barcode-input", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={id} className="mb-2 block">
            {label}
          </Label>
        )}
        <Input
          type="text"
          id={id}
          ref={ref}
          className={className}
          placeholder="Enter or scan barcode"
          {...props}
        />
      </div>
    );
  }
);

Barcode.displayName = "Barcode";

export default Barcode;

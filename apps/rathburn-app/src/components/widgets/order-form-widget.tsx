"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const OrderFormWidget = ({
  onSubmit,
}: {
  onSubmit: (formData: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    material: "",
    quantity: "",
    supplier: "",
    urgency: "normal",
    notes: "",
  });

  const suppliers = [
    "MetalWorks Inc.",
    "TechSupply Co.",
    "ElectroParts Ltd.",
    "IndustrialMaterials Corp.",
    "PrecisionComponents Inc.",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!formData.material || !formData.quantity || !formData.supplier) {
      // In a real application, we would show validation errors
      console.error("Please fill out all required fields");
      return;
    }

    // Submit form data
    onSubmit(formData);

    // Show success message
    setShowSuccess(true);

    // Reset form
    setFormData({
      material: "",
      quantity: "",
      supplier: "",
      urgency: "normal",
      notes: "",
    });

    // Hide success message after a delay
    setTimeout(() => {
      setShowSuccess(false);
      setIsOpen(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Widget Header */}
      <div
        className="p-4 flex justify-between items-center cursor-pointer bg-white hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Package className="text-blue-600 h-5 w-5 mr-2" />
          <h3 className="font-medium text-gray-900">Place New Order</h3>
        </div>
        <button className="text-gray-500">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 p-4 border-t border-green-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Order successfully submitted!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
          <div className="space-y-4">
            {/* Material Type */}
            <div>
              <label
                htmlFor="material"
                className="block text-sm font-medium text-gray-700"
              >
                Material Type*
              </label>
              <input
                type="text"
                id="material"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="E.g., Aluminum Sheets, Steel Rods"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity*
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            {/* Supplier */}
            <div>
              <label
                htmlFor="supplier"
                className="block text-sm font-medium text-gray-700"
              >
                Supplier*
              </label>
              <select
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label
                htmlFor="urgency"
                className="block text-sm font-medium text-gray-700"
              >
                Urgency
              </label>
              <div className="mt-1 flex items-center space-x-4">
                {["low", "normal", "high"].map((level) => (
                  <label key={level} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={formData.urgency === level}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Additional information or special requirements"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormWidget;

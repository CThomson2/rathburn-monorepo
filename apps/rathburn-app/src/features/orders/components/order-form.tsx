"use client";

import { StockOrderFormValues, StockOrderDetailInput } from "@/types/models";
import { useState, useEffect, useCallback } from "react";
import styles from "./form.module.css";
import { cn } from "@/lib/utils";
import { Dropdown } from "./form/dropdown";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { clientApi as api } from "@/lib/api-client/client";

export const CreateForm = ({
  onOrderCreated,
}: {
  onOrderCreated: (order: StockOrderFormValues) => void;
}) => {
  // Form state
  const [supplier, setSupplier] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [dateOrdered, setDateOrdered] = useState(
    new Date().toISOString().split("T")[0]
  ); // Default to today in YYYY-MM-DD format
  const [orderDetails, setOrderDetails] = useState<StockOrderDetailInput[]>([
    { material: "", drum_quantity: 1, drum_weight: undefined },
  ]);

  // Suggestions state
  const [materialSuggestions, setMaterialSuggestions] = useState<string[]>([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial PO number when component mounts
  useEffect(() => {
    const fetchNextPoNumber = async () => {
      try {
        const response = await api.get<{ poNumber: string }>(
          "/orders/next-po-number"
        );
        setPoNumber(response.poNumber);
      } catch (error) {
        console.error("Failed to fetch next PO number:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch PO number"
        );
      }
    };

    fetchNextPoNumber();
  }, []);

  const fetchMaterialSuggestions = async (query: string) => {
    setIsLoadingMaterials(true);
    try {
      const response = await fetch(
        `/api/materials/suggestions?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setMaterialSuggestions(
        Array.isArray(data.suggestions) ? data.suggestions : []
      );
    } catch (error) {
      console.error("Error:", error);
      setMaterialSuggestions([]);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const fetchSupplierSuggestions = useCallback(async (query: string) => {
    setIsLoadingSuppliers(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/suppliers/suggestions?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setSupplierSuggestions(
        Array.isArray(data.suggestions) ? data.suggestions : []
      );
    } catch (error) {
      console.error("Failed to fetch supplier suggestions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch suggestions"
      );
      setSupplierSuggestions([]);
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, []);

  const handleAddOrderDetail = () => {
    setOrderDetails([
      ...orderDetails,
      { material: "", drum_quantity: 1, drum_weight: undefined },
    ]);
  };

  const handleRemoveOrderDetail = (index: number) => {
    setOrderDetails(orderDetails.filter((_, i) => i !== index));
  };

  const handleOrderDetailChange = (
    index: number,
    field: keyof StockOrderDetailInput,
    value: string | number
  ) => {
    const newOrderDetails = [...orderDetails];
    newOrderDetails[index] = {
      ...newOrderDetails[index],
      [field]: value,
    };
    setOrderDetails(newOrderDetails);
  };

  const resetForm = useCallback(() => {
    setSupplier("");
    setDateOrdered(new Date().toISOString().split("T")[0]);
    setOrderDetails([
      { material: "", drum_quantity: 1, drum_weight: undefined },
    ]);
  }, []);

  const handleSubmit = async () => {
    if (
      !supplier ||
      !poNumber ||
      !dateOrdered ||
      orderDetails.some(
        (detail) => !detail.material || detail.drum_quantity < 1
      )
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date properly for API submission
      const formattedDate = new Date(dateOrdered).toISOString();

      onOrderCreated({
        supplier,
        po_number: poNumber,
        date_ordered: formattedDate,
        order_details: orderDetails,
      });

      // Fetch new PO number for next order
      const response = await api.get<{ poNumber: string }>(
        "/orders/next-po-number"
      );
      setPoNumber(response.poNumber);
      resetForm();
    } catch (error) {
      console.error("Failed to create order:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles["form-container"]}>
      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      <div className={styles["form"]}>
        <h1 className={styles["title"]}>Create Order</h1>

        {/* Order Header Section */}
        <div className="space-y-4 mb-8">
          <div className={cn(styles["form-field-container"])}>
            <label className={styles["label"]}>Supplier</label>
            <Dropdown
              value={supplier}
              onValueChange={(value) => {
                setSupplier(value);
              }}
              options={supplierSuggestions}
              placeholder="Enter supplier name"
              onInputChange={fetchSupplierSuggestions}
              disabled={false}
              heading="Suppliers"
              emptyMessage={
                isLoadingSuppliers ? "Loading..." : "No suppliers found."
              }
            />
          </div>

          <div className={cn(styles["form-field-container"])}>
            <label className={styles["label"]}>Purchase Order Number</label>
            <input
              className={cn(
                styles["input"],
                poNumber && styles["input-filled"]
              )}
              placeholder="PO Format: YY-MM-DD-A-RS"
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              disabled={false}
            />
          </div>

          <div className={cn(styles["form-field-container"])}>
            <label className={styles["label"]}>Order Date</label>
            <div className="relative">
              <input
                className={cn(
                  styles["input"],
                  dateOrdered && styles["input-filled"]
                )}
                placeholder="YYYY-MM-DD"
                type="date"
                value={dateOrdered}
                onChange={(e) => setDateOrdered(e.target.value)}
                disabled={false}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Order Details Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <button
              type="button"
              onClick={handleAddOrderDetail}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
          </div>

          {orderDetails.map((detail, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Material {index + 1}</span>
                {orderDetails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOrderDetail(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className={cn(styles["form-field-container"])}>
                <label className={styles["label"]}>Material</label>
                <Dropdown
                  value={detail.material}
                  onValueChange={(value) =>
                    handleOrderDetailChange(index, "material", value)
                  }
                  options={materialSuggestions}
                  placeholder="Enter material name"
                  onInputChange={fetchMaterialSuggestions}
                  disabled={false}
                  heading="Materials"
                  emptyMessage={
                    isLoadingMaterials ? "Loading..." : "No materials found."
                  }
                />
              </div>

              <div className={cn(styles["form-field-container"])}>
                <label className={styles["label"]}>Drum Quantity</label>
                <input
                  className={cn(
                    styles["input"],
                    detail.drum_quantity > 0 && styles["input-filled"]
                  )}
                  placeholder="Enter quantity"
                  type="number"
                  value={detail.drum_quantity}
                  onChange={(e) =>
                    handleOrderDetailChange(
                      index,
                      "drum_quantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                  min="1"
                />
              </div>

              <div className={cn(styles["form-field-container"])}>
                <label className={styles["label"]}>
                  Drum Weight (kg)
                  <span className="text-slate-400 text-sm ml-2">
                    (Optional)
                  </span>
                </label>
                <input
                  className={cn(
                    styles["input"],
                    detail.drum_weight && styles["input-filled"]
                  )}
                  placeholder="Enter weight in kg"
                  type="number"
                  value={detail.drum_weight || ""}
                  onChange={(e) =>
                    handleOrderDetailChange(
                      index,
                      "drum_weight",
                      e.target.value ? parseFloat(e.target.value) : ""
                    )
                  }
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          className={cn(
            styles["button"],
            isSubmitting && "opacity-50 cursor-not-allowed",
            "mt-8"
          )}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Order...
            </>
          ) : (
            "Submit Order"
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Testing with Postman
To test this function in Postman:
URL Structure:
123
Where 123 is the drum ID you want to generate a label for.
Response:
The function returns a PDF file directly in the response body
Content-Type will be application/pdf
Postman will display the PDF in its preview window or offer to download it
Postman won't open a browser - it will display the PDF in its own viewer or let you save it. The Content-Disposition: inline header tells clients to display the PDF rather than download it, but how this is handled depends on the client.
To properly view the PDF, you can:
Use Postman's visualizer
Save the response to a file
Copy the request URL to a browser, which will display the PDF directly
 */

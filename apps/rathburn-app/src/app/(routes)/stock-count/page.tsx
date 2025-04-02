"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { ObjectKeys } from "@/types/util-types";

interface DrumFields {
  oldId: number;
  material: string;
  batchCode: string;
  supplier: string;
  status: string;
}

type DrumFieldKeys = ObjectKeys<DrumFields>;

const DrumStockCountForm = () => {
  // Form state
  const [drums, setDrums] = useState<DrumFields[]>([
    {
      oldId: 0,
      material: "",
      batchCode: "",
      supplier: "",
      status: "new",
    },
  ]);

  // For batch entry
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState(2);
  const [batchTemplate, setBatchTemplate] = useState({
    oldIdStart: 1,
    material: "",
    batchCode: "",
    supplier: "",
    status: "new",
  });

  // For submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });

  // Focus management
  const newRowRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (submitMessage.text) {
      const timer = setTimeout(() => {
        setSubmitMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitMessage]);

  // Handle input changes
  const handleChange = <K extends keyof DrumFields>(
    index: number,
    field: K,
    value: DrumFields[K]
  ) => {
    const newDrums = [...drums];
    newDrums[index][field] = value;
    setDrums(newDrums);
  };

  // Handle batch template changes
  const handleBatchTemplateChange = (
    field: keyof typeof batchTemplate,
    value: string | number
  ) => {
    setBatchTemplate({
      ...batchTemplate,
      [field]: value, // Fixed type error by ensuring the field is a valid key of batchTemplate
    });
  };

  // Add a new empty row
  const addRow = () => {
    setDrums([
      ...drums,
      {
        oldId: 0,
        material: "",
        batchCode: "",
        supplier: "",
        status: "new",
      },
    ]);

    // Focus on the first field of the new row
    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.focus();
      }
    }, 0);
  };

  // Remove a row
  const removeRow = (index: number) => {
    if (drums.length === 1) {
      // Don't remove the last row, just clear it
      setDrums([
        {
          oldId: 0,
          material: "",
          batchCode: "",
          supplier: "",
          status: "new",
        },
      ]);
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    } else {
      const newDrums = drums.filter((_, i) => i !== index);
      setDrums(newDrums);
    }
  };

  // Generate batch entries
  const generateBatchEntries = () => {
    const { oldIdStart, material, batchCode, supplier, status } = batchTemplate;

    const newBatchDrums: DrumFields[] = [];
    for (let i = 0; i < batchCount; i++) {
      const oldIdNumber = oldIdStart + i;
      newBatchDrums.push({
        oldId: oldIdNumber,
        material,
        batchCode,
        supplier,
        status,
      });
    }

    setDrums([...drums, ...newBatchDrums]);
    setShowBatchModal(false);
    setBatchTemplate({
      oldIdStart: 1,
      material: "",
      batchCode: "",
      supplier: "",
      status: "new",
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    const invalidDrums = drums.filter((drum) => !drum.oldId || !drum.material);
    if (invalidDrums.length > 0) {
      setSubmitMessage({
        type: "error",
        text: "All drums must have an ID and material type",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty drums that don't have any data
      const filteredDrums = drums.filter((d) => d.oldId);

      // Submit to the API endpoint
      const response = await fetch("/stock-count/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filteredDrums), // Use filteredDrums here instead of drums
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save drums");
      }

      setSubmitMessage({
        type: "success",
        text: `Successfully submitted ${filteredDrums.length} drums!`,
      });

      // Clear the form after successful submission
      setDrums([
        {
          oldId: 0,
          material: "",
          batchCode: "",
          supplier: "",
          status: "new",
        },
      ]);

      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error submitting drums:", error);
        setSubmitMessage({
          type: "error",
          text: `Error: ${error.message}`,
        });
      } else {
        console.error("Unexpected error:", error);
        setSubmitMessage({
          type: "error",
          text: "An unexpected error occurred.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Drum Stock Count</h1>

      <div className="mb-6 space-y-4 text-gray-700">
        <div>
          <h2 className="font-semibold text-lg mb-2">Drum ID System:</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>New drums with existing ID labels</strong> will keep their
              current IDs in the new system
            </li>
            <li>
              <strong>Washed/process drums (P)</strong> will keep their orignal
              IDs in the new system
            </li>
            <li>
              <strong>New drums without labels</strong> will use sequential IDs
              starting from <strong>15001</strong>
            </li>
            <li>
              <strong>Repro drums (R)</strong> will use new sequential IDs
              starting from <strong>3001</strong> (regardless of existing
              labels)
            </li>
            <li>
              <strong>
                Waste/empty drums (W), and Unknown/unmarked drums (X)
              </strong>{" "}
              will use IDs from
              <strong>9001</strong> onwards and require manual verification
            </li>
          </ul>
        </div>
      </div>

      {submitMessage.text && (
        <div
          className={`p-3 mb-4 rounded ${submitMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {submitMessage.text}
        </div>
      )}

      <div className="flex justify-between mb-4">
        <button
          type="button"
          onClick={addRow}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Row
        </button>

        <button
          type="button"
          onClick={() => setShowBatchModal(true)}
          className="bg-violet-800 hover:bg-purple-600 text-white px-4 py-2 rounded"
        >
          + Add Batch
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Legacy ID</th>
                <th className="border p-2 text-left">Material *</th>
                <th className="border p-2 text-left">Batch Code</th>
                <th className="border p-2 text-left">Supplier</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drums.map((drum, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border p-2">
                    <input
                      type="text"
                      value={drum.oldId}
                      onChange={(e) =>
                        handleChange(index, "oldId", parseInt(e.target.value))
                      }
                      className="w-full p-1 border rounded"
                      placeholder="ID on label"
                      ref={
                        index === 0
                          ? firstInputRef
                          : index === drums.length - 1
                            ? newRowRef
                            : null
                      }
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={drum.material}
                      onChange={(e) =>
                        handleChange(index, "material", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Material type"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={drum.batchCode}
                      onChange={(e) =>
                        handleChange(index, "batchCode", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={drum.supplier}
                      onChange={(e) =>
                        handleChange(index, "supplier", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      title="status"
                      value={drum.status}
                      onChange={(e) =>
                        handleChange(index, "status", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                    >
                      <option value="new">New</option>
                      <option value="reprocessing">Reprocessing</option>
                      <option value="waste">Waste</option>
                      <option value="empty">Empty</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="bg-red-500 hover:bg-red-600 text-white p-1 rounded w-8 h-8 flex items-center justify-center"
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded text-white font-bold ${isSubmitting ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}
          >
            {isSubmitting ? "Submitting..." : "Save All Drums"}
          </button>

          <div className="text-gray-600">
            {drums.filter((d) => d.oldId || d.material).length} drum(s) ready to
            submit
          </div>
        </div>
      </form>

      {/* Batch Entry Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Batch of Drums</h2>

            <div className="mb-4">
              <label className="block mb-1">Starting ID Number</label>
              <input
                type="number"
                value={batchTemplate.oldIdStart}
                onChange={(e) =>
                  handleBatchTemplateChange(
                    "oldIdStart",
                    parseInt(e.target.value)
                  )
                }
                className="w-full p-2 border rounded"
                placeholder="Starting number"
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Number of Drums</label>
              <input
                title="drum-number"
                type="number"
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
                min="2"
                max="100"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Material *</label>
              <input
                type="text"
                value={batchTemplate.material}
                onChange={(e) =>
                  handleBatchTemplateChange("material", e.target.value)
                }
                className="w-full p-2 border rounded"
                placeholder="Material type"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Batch Code</label>
              <input
                type="text"
                value={batchTemplate.batchCode}
                onChange={(e) =>
                  handleBatchTemplateChange("batchCode", e.target.value)
                }
                className="w-full p-2 border rounded"
                placeholder="Optional"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Supplier</label>
              <input
                type="text"
                value={batchTemplate.supplier}
                onChange={(e) =>
                  handleBatchTemplateChange("supplier", e.target.value)
                }
                className="w-full p-2 border rounded"
                placeholder="Optional"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Status</label>
              <select
                title="status"
                value={batchTemplate.status}
                onChange={(e) =>
                  handleBatchTemplateChange("status", e.target.value)
                }
                className="w-full p-2 border rounded"
              >
                <option value="new">New</option>
                <option value="reprocessing">Reprocessing</option>
                <option value="waste">Waste</option>
                <option value="empty">Empty</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateBatchEntries}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!batchTemplate.material}
              >
                Add {batchCount} Drums
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrumStockCountForm;

# Stock Count

File: **`stock-count.js`**

```js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import Head from "next/head";

export default function StockCountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [formData, setFormData] = useState({
    material_id: "",
    material_name: "",
    batch_number: "",
    location: "",
    quantity: "",
    unit_of_measure: "",
    notes: "",
  });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [user, setUser] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login"); // Redirect to login if not authenticated
      } else {
        setUser(session.user);
        // Fetch any reference data needed for dropdowns
        fetchMaterials();
        fetchLocations();
        fetchRecentEntries();
      }
    };

    checkUser();
  }, [router]);

  // Fetch materials for dropdown (assuming you have a materials table)
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("id, name, default_unit_of_measure");

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  // Fetch locations for dropdown (assuming you have a locations table)
  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      // Fallback to some default locations if table doesn't exist
      setLocations([
        { id: "warehouse-a", name: "Warehouse A" },
        { id: "warehouse-b", name: "Warehouse B" },
        { id: "production", name: "Production Area" },
      ]);
    }
  };

  // Fetch recent entries by this user
  const fetchRecentEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_count_entries")
        .select("*, materials(name)")
        .order("count_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentEntries(data || []);
    } catch (error) {
      console.error("Error fetching recent entries:", error);
    }
  };

  // Handle material selection
  const handleMaterialChange = (e) => {
    const materialId = e.target.value;
    const selectedMaterial = materials.find((m) => m.id === materialId);

    if (selectedMaterial) {
      setFormData({
        ...formData,
        material_id: materialId,
        material_name: selectedMaterial.name,
        unit_of_measure: selectedMaterial.default_unit_of_measure || "",
      });
    } else {
      setFormData({
        ...formData,
        material_id: "",
        material_name: "",
      });
    }
  };

  // Handle manual entry of material name (for materials not in system)
  const handleMaterialNameChange = (e) => {
    setFormData({
      ...formData,
      material_id: null, // Clear material_id when manually entering name
      material_name: e.target.value,
    });
  };

  // Handle other form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      // Validate form
      if (!formData.material_name || !formData.quantity || !formData.location) {
        throw new Error("Material name, quantity, and location are required");
      }

      if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
        throw new Error("Quantity must be a positive number");
      }

      // Insert data into Supabase
      const { data, error } = await supabase
        .from("stock_count_entries")
        .insert({
          material_id: formData.material_id,
          material_name: formData.material_name,
          batch_number: formData.batch_number,
          location: formData.location,
          quantity: Number(formData.quantity),
          unit_of_measure: formData.unit_of_measure,
          notes: formData.notes,
          counted_by: user.id,
        })
        .select();

      if (error) throw error;

      // Success! Clear form (except location)
      setSuccessMessage(
        `Successfully added ${formData.quantity} ${formData.unit_of_measure} of ${formData.material_name}`
      );
      setFormData({
        ...formData,
        material_id: "",
        material_name: "",
        batch_number: "",
        quantity: "",
        notes: "",
        // Keep location the same for faster entry of multiple items
      });

      // Refresh recent entries
      fetchRecentEntries();

      // Focus back on material field for quick entry of next item
      document.getElementById("material-name").focus();
    } catch (error) {
      console.error("Error adding stock count entry:", error);
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Stock Count Entry</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Stock Count Entry</h1>

      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Material Selection */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="material-select"
            >
              Select Material (Optional)
            </label>
            <select
              id="material-select"
              name="material_id"
              value={formData.material_id || ""}
              onChange={handleMaterialChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">-- Select a material --</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          {/* Material Name (manual entry) */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="material-name"
            >
              Material Name *
            </label>
            <input
              id="material-name"
              type="text"
              name="material_name"
              value={formData.material_name}
              onChange={handleMaterialNameChange}
              placeholder="Enter material name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          {/* Batch Number */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="batch-number"
            >
              Batch Number
            </label>
            <input
              id="batch-number"
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              placeholder="Enter batch number (if any)"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="location"
            >
              Location *
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">-- Select a location --</option>
              {locations.map((location) => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="quantity"
            >
              Quantity *
            </label>
            <input
              id="quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Unit of Measure */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="unit-of-measure"
            >
              Unit of Measure
            </label>
            <input
              id="unit-of-measure"
              type="text"
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleChange}
              placeholder="e.g., kg, pcs, liters"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Notes */}
          <div className="mb-4 md:col-span-2">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="notes"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Stock Count Entry"}
          </button>
        </div>
      </form>

      {/* Recent Entries Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Material</th>
                <th className="py-2 px-4 border-b">Quantity</th>
                <th className="py-2 px-4 border-b">Location</th>
                <th className="py-2 px-4 border-b">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    No recent entries found
                  </td>
                </tr>
              ) : (
                recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 px-4 border-b">
                      {entry.material_name ||
                        (entry.materials && entry.materials.name)}
                      {entry.batch_number && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({entry.batch_number})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {entry.quantity} {entry.unit_of_measure}
                    </td>
                    <td className="py-2 px-4 border-b">{entry.location}</td>
                    <td className="py-2 px-4 border-b">
                      {new Date(entry.count_date).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

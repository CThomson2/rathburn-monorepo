"use client";

import { useState, useEffect } from "react";

export default function TestSupplierSuggestions() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const fetchSuggestions = async () => {
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/suppliers/suggestions?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      setResponse(data); // Store full response for debugging

      if (Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
        setError("Invalid response format");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Supplier Suggestions API</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search suppliers..."
          className="border p-2 rounded"
        />
        <button
          onClick={fetchSuggestions}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Suggestions:</h2>
        {suggestions.length === 0 ? (
          <p className="text-gray-500">No suggestions found</p>
        ) : (
          <ul className="list-disc pl-5">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Raw Response:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px]">
          {JSON.stringify(response, null, 2) || "No response yet"}
        </pre>
      </div>
    </div>
  );
}

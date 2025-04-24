import React, { useState } from "react";
// import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  casNumber: string;
  color: string;
  scans: number;
}

interface SearchBarProps {
  materials: Material[];
  onSelect: (material: Material) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ materials, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.casNumber &&
        material.casNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative w-full mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">🔍</span>
        </div>
        <input
          type="text"
          className="w-full py-3 px-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            <span className="text-gray-500">✕</span>
          </button>
        )}
      </div>

      {isFocused && searchQuery && filteredMaterials.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto border border-gray-200 animate-fadeIn">
          <ul className="py-1">
            {filteredMaterials.map((material) => (
              <li
                key={material.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => {
                  onSelect(material);
                  setSearchQuery("");
                  setIsFocused(false);
                }}
              >
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: material.color }}
                ></div>
                <span>{material.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

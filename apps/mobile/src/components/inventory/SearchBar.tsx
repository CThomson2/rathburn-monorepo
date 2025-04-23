
import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Material {
  id: string;
  name: string;
  casNumber?: string;
  color: string;
}

interface SearchBarProps {
  materials: Material[];
  onSelect: (material: Material) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ materials, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredMaterials = searchQuery
    ? materials.filter((material) =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search raw materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && searchQuery && filteredMaterials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto border border-gray-200"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;

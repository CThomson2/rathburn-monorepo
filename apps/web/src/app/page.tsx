"use client";

// Metadata needs to be defined in a separate layout or specific metadata file for client components
// as they cannot use the metadata export directly

export default function HomePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Inventory Management System
      </h1>

      {/* Chemical Inventory Dashboard is now rendered with SSR in /inventory-dashboard page */}
    </div>
  );
}

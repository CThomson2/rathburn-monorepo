"use client";

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { TransportSettingsView } from "@/views/TransportSettingsView";

/**
 * TransportSettings page component
 * Wraps the TransportSettingsView component with a page layout including a back button
 */
export default function TransportSettings() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col pt-10 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-2 px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Transport Settings
        </h1>
      </div>

      <div className="flex-1 overflow-auto">
        <TransportSettingsView />
      </div>
    </div>
  );
}

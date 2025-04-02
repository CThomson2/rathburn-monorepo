
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WidgetProvider } from "@/contexts/WidgetContext";
import DrumDashboard from "./pages/DrumDashboard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CustomDashboard from "./pages/CustomDashboard";
import WidgetLibrary from "./pages/WidgetLibrary";
import DrumManagementPage from "./pages/Drums";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WidgetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DrumDashboard />} />
            <Route path="/mock-data" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/custom-dashboard" element={<CustomDashboard />} />
            <Route path="/widget-library" element={<WidgetLibrary />} />
            <Route path="/drums" element={<DrumManagementPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WidgetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

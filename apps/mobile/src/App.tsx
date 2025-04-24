import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import ScanView from "./pages/ScanViewSimple";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { ErrorBoundary } from "react-error-boundary";

const queryClient = new QueryClient();

// Error boundary fallback component
const ErrorFallback = ({ error }: { error: Error }) => {
  console.error("React Error Boundary caught an error:", error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-800">
      <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-4">
        The application encountered an error. Please try refreshing the page.
      </p>
      <pre className="bg-white p-4 rounded shadow text-xs overflow-auto max-w-full">
        {error.message}
      </pre>
      <button
        onClick={() => (window.location.href = "/")}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Go to Home
      </button>
    </div>
  );
};

// Router component with console logs for debugging
const RouterWithLogging = () => {
  const location = useLocation();

  useEffect(() => {
    console.log(`Route changed to: ${location.pathname}`);
  }, [location]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Routes>
        <Route path="/sign-in" element={<Auth />} />
        <Route path="/" element={<Index />} />
        <Route path="/scan" element={<ScanView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouterWithLogging />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

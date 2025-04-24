import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import ScanView from "./pages/ScanViewSimple";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import { ErrorBoundary } from "react-error-boundary";
import { supabase } from "@/lib/supabase/client-auth";
import { Session } from "@supabase/auth-js";
import { withAuth } from "./lib/auth/route-guard";
import { ThemeProvider } from "./providers/theme-provider";

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

// Apply the withAuth HOC to protected components
const ProtectedIndex = withAuth(Index);
const ProtectedScanView = withAuth(ScanView);
const ProtectedSettings = withAuth(Settings);

// Router component with console logs for debugging
const RouterWithLogging = () => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const isAuthPage = location.pathname === "/sign-in";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log(`Route changed to: ${location.pathname}`);
  }, [location]);

  // Set body class based on route
  useEffect(() => {
    const body = document.body;
    if (isAuthPage) {
      body.classList.remove("dark");
    }
  }, [isAuthPage]);

  return (
    <div
      className={`app-container ${isAuthPage ? "" : "dark:bg-gray-900 dark:text-gray-100"}`}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Routes>
          <Route path="/sign-in" element={<Auth />} />
          <Route path="/" element={<ProtectedIndex />} />
          <Route path="/scan" element={<ProtectedScanView />} />
          <Route path="/settings" element={<ProtectedSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
};

const App = () => (
  <ThemeProvider defaultTheme="system">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <RouterWithLogging />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

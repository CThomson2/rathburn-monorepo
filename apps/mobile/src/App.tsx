import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import ScanView from "./views/ScanViewSimple";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/callback";
import TransportSettings from "./pages/TransportSettings";
import { ErrorBoundary } from "react-error-boundary";
import { supabase } from "@/lib/supabase/client-auth";
import { Session } from "@supabase/auth-js";
import { withAuth } from "./lib/auth/route-guard";
import { ThemeProvider } from "./providers/theme-provider";
import { ScanProvider } from "@/contexts/scan-context";

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

// Wrap our authenticated components with both auth and the ScanProvider
// This ensures the ScanHandler is available in all authenticated routes
const withAuthAndScan = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const AuthenticatedComponent = withAuth(Component);

  return (props: P) => (
    <ScanProvider>
      <AuthenticatedComponent {...props} />
    </ScanProvider>
  );
};

// Apply the withAuthAndScan HOC to protected components
const ProtectedIndex = withAuthAndScan(Index);
const ProtectedScanView = withAuthAndScan(ScanView);
const ProtectedTransportSettings = withAuthAndScan(TransportSettings);

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
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedIndex />} />
          <Route path="/scan" element={<ProtectedScanView />} />
          <Route
            path="/transport-settings"
            element={<ProtectedTransportSettings />}
          />
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

import { ToastProvider } from "@/providers/toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect, useState, ReactNode } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/callback";
import TransportSettings from "./pages/TransportSettings";
import { ErrorBoundary } from "react-error-boundary";
import { ThemeProvider } from "./providers/theme-provider";
import { ScanProvider } from "@/contexts/scan-context";
import { ToastContextSetter } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useMiddleware } from "@/hooks/use-middleware";
import { publicRoutes } from "@/middleware";

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

// Protected route component that uses the middleware hook
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isLoading, isAuthenticated } = useMiddleware();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  // The middleware hook will handle redirections, but we add this as a failsafe
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <ScanProvider>{children}</ScanProvider>;
};

// Public route component that ensures users are redirected to home if already authenticated
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isLoading, isAuthenticated } = useMiddleware();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  // The middleware hook will handle redirections
  return <>{children}</>;
};

// Router component with middleware integration
const RouterWithMiddleware = () => {
  const location = useLocation();
  const isAuthPage = publicRoutes.includes(location.pathname);

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
          {/* Public routes */}
          <Route
            path="/sign-in"
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/callback"
            element={
              <PublicRoute>
                <AuthCallback />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transport-settings"
            element={
              <ProtectedRoute>
                <TransportSettings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
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
        <ToastProvider>
          <ToastContextSetter />
          <BrowserRouter>
            <RouterWithMiddleware />
          </BrowserRouter>
          <Toaster />
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";

import { RouteAwareControls } from "@/components/layouts/route-aware-controls";
import { Providers } from "./providers";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { cn } from "@/lib/utils";
import Hero from "@/components/layouts/auth/hero";

import "@/styles/globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Rathburn",
  description: "Inventory Management System",
  icons: {
    icon: "/rc-logo-b.png",
  },
};

function isAuthPage(pathname: string) {
  return (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuth = isAuthPage(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/rc-logo-b.png" sizes="any" />
      </head>
      <body
        className={cn(
          inter.className,
          isAuth ? "overflow-hidden" : "overflow-auto"
        )}
      >
        <Providers>
          <ThemeProvider>
            {/* Show Hero and controls only on non-auth pages */}
            {!isAuth && (
              <>
                <Hero />
                <RouteAwareControls />
              </>
            )}

            {/* Main content */}
            <main
              className={cn(
                !isAuth && "pt-16" // Add padding only when Hero is shown
              )}
            >
              {children}
            </main>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

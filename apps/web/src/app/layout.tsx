import type { Metadata } from "next";
import { Inter, Alfa_Slab_One } from "next/font/google";
import { headers } from "next/headers";

import { RouteAwareControls } from "@/components/desktop/layout/route-aware-controls";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

import "@/styles/globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa-slab",
});

export const metadata: Metadata = {
  title: "Dashboard | Rathburn Dashboard",
  description: "View and manage inventory statistics and operations",
  icons: {
    icon: "/ms-icon-150x150.png",
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
          alfaSlabOne.variable,
          isAuth ? "overflow-hidden" : "overflow-auto",
          "antialiased bg-background text-foreground"
        )}
      >
        <Providers>
          {/* Show Hero and controls only on non-auth pages */}
          {!isAuth && (
            <>
              <RouteAwareControls />
            </>
          )}

          {/* Main content */}
          <main
          // className={cn(
          //   !isAuth && "pt-16" // Add padding only when Hero is shown
          // )}
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

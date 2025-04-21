import type { Metadata } from "next";
import { Inter, Alfa_Slab_One } from "next/font/google";
import { headers } from "next/headers";

import { RouteAwareControls } from "@/components/desktop/layout/route-aware-controls";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/desktop/layout/dashboard-layout";

import "@/styles/globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa-slab",
});

export const metadata: Metadata = {
  title: "Rathburn",
  description: "Inventory Management System",
  icons: {
    icon: "/logo-square-bw.png",
  },
};

function isAuthPage(pathname: string) {
  // Check for auth routes
  const isAuth =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes("(auth-pages)");

  // For server-side debugging only
  console.log(`[LAYOUT DEBUG] Pathname: ${pathname}, isAuth: ${isAuth}`);

  return isAuth;
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
      <link rel="icon" href="/logo-square-bw.png" sizes="any" />
      <body
        className={cn(
          inter.className,
          alfaSlabOne.variable,
          isAuth ? "overflow-hidden" : "overflow-auto",
          "antialiased bg-background text-foreground"
        )}
      >
        <Providers>
          {isAuth ? (
            <>{children}</>
          ) : (
            <DashboardLayout>
              <RouteAwareControls />
              <main>{children}</main>
            </DashboardLayout>
          )}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Alfa_Slab_One } from "next/font/google";
import { headers } from "next/headers";

import { RouteAwareControls } from "@/components/layout/route-aware-controls";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { createServiceClient } from "@/lib/supabase/server";

import "@/styles/globals.css";

export const dynamic = "force-dynamic";

interface StocktakeScanFeedDetail {
  id: string;
  stocktake_session_id: string;
  scanned_at: string;
  created_at: string;
  raw_barcode: string;
  barcode_type: "material" | "supplier" | "unknown" | "error";
  status: "success" | "error" | "ignored";
  error_message?: string | null;
  user_id: string;
  device_id?: string | null;
  material_id?: string | null;
  material_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  associated_supplier_name_for_material?: string | null;
}

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

async function fetchInitialScans(): Promise<StocktakeScanFeedDetail[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("stocktake_scans_feed_details")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching initial scans from view (Layout):", error);
      return [];
    }

    return (data as StocktakeScanFeedDetail[]) || [];
  } catch (error) {
    console.error("Error in fetchInitialScans (Layout):", error);
    return [];
  }
}

function isAuthPage(pathname: string) {
  const isAuth =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes("(auth-pages)");

  console.log(`[LAYOUT DEBUG] Pathname: ${pathname}, isAuth: ${isAuth}`);

  return isAuth;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuth = isAuthPage(pathname);

  let initialScans: StocktakeScanFeedDetail[] = [];
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!isAuth) {
    initialScans = await fetchInitialScans();
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing Supabase URL or Anon Key in environment variables!"
      );
      supabaseUrl = "";
      supabaseAnonKey = "";
    }
  }

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
            <DashboardLayout
              apiUrl={supabaseUrl}
              apiKey={supabaseAnonKey}
              initialScans={initialScans}
            >
              <main>{children}</main>
            </DashboardLayout>
          )}
        </Providers>
      </body>
    </html>
  );
}

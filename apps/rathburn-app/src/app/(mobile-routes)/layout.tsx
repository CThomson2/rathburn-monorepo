import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { MobileNavbar } from "@/components/mobile/navbar";
import { MobileFooter } from "@/components/mobile/footer";
import { Providers } from "../providers"; // ThemeProvider is already part of Providers
import { DeviceFrameWrapper } from "@/components/mobile/device-frame-wrapper";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory Scanner - Mobile",
  description: "Mobile interface for inventory management and barcode scanning",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

// This creates a completely separate layout hierarchy for mobile routes
// This layout doesn't inherit the sidebar from the main app layout
export default function MobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check for a frame query parameter
  const headersList = headers();
  const url = headersList.get("x-url") || "";
  const showFrame =
    url.includes("frame=true") || url.includes("showframe=true");

  // Only show frame in development and when explicitly requested
  const shouldShowFrame = isDevelopment && showFrame;

  // The main mobile content
  const mobileContent = (
    <div className="min-h-screen bg-background text-foreground">
      <MobileNavbar />
      <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        {children}
      </main>
      <MobileFooter />
    </div>
  );

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/rc-logo-b.png" sizes="any" />
      </head>
      <body
        className={cn(
          "flex min-h-full flex-col bg-background antialiased",
          inter.className
        )}
      >
        <Providers>
          {shouldShowFrame ? (
            // In development with frame param, wrap with device frame
            <DeviceFrameWrapper>{mobileContent}</DeviceFrameWrapper>
          ) : (
            // Otherwise, render normally
            mobileContent
          )}
        </Providers>
      </body>
    </html>
  );
}

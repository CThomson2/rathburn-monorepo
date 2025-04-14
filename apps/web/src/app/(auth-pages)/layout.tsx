import { Inter, Alfa_Slab_One } from "next/font/google";
import { AuthLayoutContent } from "@/components/desktop/layout/auth/auth";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa-slab",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/rc-logo-b.png" sizes="any" />
      </head>
      <body
        className={cn(inter.className, alfaSlabOne.variable, "overflow-hidden")}
      >
        <AuthLayoutContent>{children}</AuthLayoutContent>
      </body>
    </html>
  );
}

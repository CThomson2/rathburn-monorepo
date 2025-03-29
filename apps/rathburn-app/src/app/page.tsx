import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { shouldUsesMobileVersion } from "@/utils/device-detection";

import { HomeContent } from "./_components/home-content";

export const metadata = {
  title: "Dashboard | Rathburn Dashboard",
  description: "View and manage inventory statistics and operations",
};

export default function HomePage() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  // Detect if this is a mobile device and redirect accordingly
  if (shouldUsesMobileVersion(userAgent)) {
    redirect("/mobile");
  }

  return <HomeContent />;
}

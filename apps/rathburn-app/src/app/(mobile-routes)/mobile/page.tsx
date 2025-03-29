import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Package, Scan, Clock, ArrowRight } from "lucide-react";
import { getRecentActivity } from "../actions/activity";
import { RecentActivitySection } from "./components/recent-activity";
import { Transaction } from "@/database/models/activity";

export const metadata: Metadata = {
  title: "Mobile Dashboard",
  description: "Mobile inventory management system",
};

export default async function MobileDashboardPage() {
  // Fetch initial recent activity data using server action
  const activityResult = await getRecentActivity(3);

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/mobile/scan" className="block">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Scan className="h-10 w-10 text-primary mb-3" />
              <CardTitle className="text-base">Scan Item</CardTitle>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mobile/inventory" className="block">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Package className="h-10 w-10 text-primary mb-3" />
              <CardTitle className="text-base">Inventory</CardTitle>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity - Now using real data */}
      <RecentActivitySection
        initialData={
          (activityResult.success ? activityResult.data : []) as Transaction[]
        }
      />
    </div>
  );
}

// Helper component for activity items
function ActivityItem({
  title,
  timestamp,
  icon,
}: {
  title: string;
  timestamp: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-xs text-muted-foreground flex items-center">
          <Clock className="mr-1 h-3 w-3" />
          {timestamp}
        </p>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import { getMoreActivity } from "../../actions/activity";
import { ActivityFeed } from "./components/activity-feed";
import { Transaction } from "@/database/models/activity";

export const metadata: Metadata = {
  title: "Activity History",
  description: "View all recent inventory activity",
};

export default async function ActivityPage() {
  // Fetch initial activity data using server action
  const initialActivityData = await getMoreActivity(1, 10);

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
      <p className="text-sm text-muted-foreground">
        View recent inventory transactions and status updates
      </p>

      {/* Activity feed with infinite scroll */}
      <ActivityFeed
        initialData={
          (initialActivityData.success
            ? initialActivityData.data
            : []) as Transaction[]
        }
        initialTotal={
          (initialActivityData.success
            ? initialActivityData.total
            : 0) as number
        }
      />
    </div>
  );
}

import { Suspense } from "react";
import { ActivityDashboard } from "@/features/activity";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Activity Dashboard | Rathburn Operations",
  description: "Real-time activity monitoring and notifications dashboard",
};

export default function ActivityPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Activity Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor real-time activities, scan events, and manage notifications
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="w-full h-[300px] rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="w-full h-[200px] rounded-md" />
              <Skeleton className="w-full h-[200px] rounded-md" />
            </div>
            <Skeleton className="w-full h-[400px] rounded-md" />
          </div>
        }
      >
        <ActivityDashboard />
      </Suspense>
    </div>
  );
}

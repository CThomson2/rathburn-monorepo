import { Suspense } from "react";
import { Metadata } from "next";

import BatchesContent from "@/features/batches/batches-content";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Batches | Inventory Management",
  description: "View and manage raw material batches in inventory",
};

export default function BatchesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Batches"
        description="View and manage raw material batches in inventory"
      />

      <Suspense fallback={<BatchesContentSkeleton />}>
        <BatchesContent />
      </Suspense>
    </div>
  );
}

function BatchesContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="border rounded-lg">
        <div className="bg-muted p-4 rounded-t-lg">
          <div className="grid grid-cols-6 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
          </div>
        </div>
        <div className="divide-y">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="p-4">
                <div className="grid grid-cols-6 gap-4">
                  {Array(6)
                    .fill(0)
                    .map((_, j) => (
                      <Skeleton key={j} className="h-5 w-full" />
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

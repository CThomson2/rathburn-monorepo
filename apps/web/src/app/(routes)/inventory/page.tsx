import { Suspense } from "react";
import { Metadata } from "next";

import BatchesContent from "@/features/batches/batches-content";
import { PageHeader } from "@/components/sidebar/page-header";
import { BatchesContentSkeleton } from "@/components/core/patterns/skeletons/batches-content";

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

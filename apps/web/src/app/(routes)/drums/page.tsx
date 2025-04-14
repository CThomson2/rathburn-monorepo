import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { getDb } from "@/lib/prisma-client";
import dynamic from "next/dynamic";

// Dynamically import the client component with no SSR
const StockLabelsGenerator = dynamic(
  () => import("./_components/stock-labels-generator"),
  {
    ssr: false,
  }
);

export const metadata: Metadata = {
  title: "Drums Management | Dashboard",
  description: "Inventory management for all drum types",
};

interface DrumSectionProps {
  title: string;
  description: string;
  href: string;
  count?: number;
}

async function getDrumCounts() {
  const db = getDb();
  const result = {
    drumCount: await db.stock_new.aggregate({
      _sum: {
        quantity: true,
      },
    }),
    reproDrumCount: await db.stock_repro.aggregate({
      _sum: {
        quantity: true,
      },
    }),
  };

  return {
    drumCount: result.drumCount._sum.quantity || 0,
    reproDrumCount: result.reproDrumCount._sum.quantity || 0,
  };
}

async function DrumSection({
  title,
  description,
  href,
  count,
}: DrumSectionProps) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-lg shadow transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          {count !== undefined && (
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
              {count}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

export default async function DrumsPage() {
  const { drumCount, reproDrumCount } = await getDrumCounts();

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Drums Management
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Select a section to manage different types of drums
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DrumSection
          title="New Drums"
          description="View & manage new drum stock"
          href="/drums/stock"
          count={drumCount}
        />

        <DrumSection
          title="Repro Drums"
          description="View & manage repro drum stock"
          href="/drums/repro"
          count={reproDrumCount}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Drum Labels
        </h2>
        <StockLabelsGenerator />
      </div>
    </div>
  );
}

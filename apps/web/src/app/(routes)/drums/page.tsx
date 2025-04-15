import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { executeDbOperation } from "@/lib/database";
import StockLabelsWrapper from "./_components/stock-labels-wrapper";

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

/**
 * Fetches drum counts from the database and returns them.
 *
 * @returns An object with `drumCount` and `reproDrumCount` properties, each containing the total quantity of drums in stock.
 */
async function getDrumCounts() {
  return executeDbOperation(async (client) => {
    try {
      // Get new drum count
      const { data: newDrumData, error: newDrumError } = await client
        .from("stock_new")
        .select("quantity")
        .not("quantity", "is", null);

      // Get repro drum count
      const { data: reproDrumData, error: reproDrumError } = await client
        .from("stock_repro")
        .select("quantity")
        .not("quantity", "is", null);

      // Handle any errors
      if (newDrumError || reproDrumError) {
        console.error(
          `Error fetching drum counts: ${newDrumError?.message || reproDrumError?.message}`
        );
        return { drumCount: 0, reproDrumCount: 0 };
      }

      // Calculate totals
      const drumCount =
        newDrumData?.reduce(
          (sum: number, item: { quantity: number }) =>
            sum + (typeof item.quantity === "number" ? item.quantity : 0),
          0
        ) || 0;

      const reproDrumCount =
        reproDrumData?.reduce(
          (sum, item) =>
            sum + (typeof item.quantity === "number" ? item.quantity : 0),
          0
        ) || 0;

      return {
        drumCount,
        reproDrumCount,
      };
    } catch (error) {
      console.error("Failed to get drum counts:", error);
      return { drumCount: 0, reproDrumCount: 0 };
    }
  });
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
/**
 * The DrumsPage component renders a page with sections for managing different
 * types of drums, including new drums and repro drums. It also includes a section
 * for generating drum labels.
 *
 * The page fetches the current drum counts from the database and passes them as
 * props to the `DrumSection` components, which are then used to conditionally
 * render the sections.
 *
 * @returns The DrumsPage component
 */

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
        <StockLabelsWrapper />
      </div>
    </div>
  );
}

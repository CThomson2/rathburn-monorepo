"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Package, Scan, Clock, ArrowRight, RefreshCcw } from "lucide-react";
import { getRecentActivity } from "../../actions/activity";
import { formatDistanceToNow } from "date-fns";

// Define the transaction type based on your Prisma schema
interface Transaction {
  tx_id: number;
  tx_type: string;
  tx_date: Date;
  material: string;
  direction?: string;
  // Add other fields as needed
}

interface RecentActivitySectionProps {
  initialData: Transaction[];
}

export function RecentActivitySection({
  initialData,
}: RecentActivitySectionProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Function to refresh data
  const refreshData = () => {
    startTransition(async () => {
      const result = await getRecentActivity(3);
      if (result.success && result.data) {
        setTransactions(result.data);
        setLastRefresh(new Date());
      }
    });
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Get appropriate icon based on transaction type
  const getTransactionIcon = (tx: Transaction) => {
    switch (tx.tx_type) {
      case "intake":
        return <Package className="h-4 w-4" />;
      case "loaded":
        return <Scan className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Format transaction title
  const getTransactionTitle = (tx: Transaction) => {
    switch (tx.tx_type) {
      case "intake":
        return `Received ${tx.material}`;
      case "loaded":
        return `Loaded ${tx.material}`;
      case "processed":
        return `Processed ${tx.material}`;
      case "disposed":
        return `Disposed ${tx.material}`;
      default:
        return `${tx.tx_type.charAt(0).toUpperCase() + tx.tx_type.slice(1)} ${
          tx.material
        }`;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest inventory actions</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={refreshData}
          disabled={isPending}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No recent activity found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <ActivityItem
                key={tx.tx_id}
                title={getTransactionTitle(tx)}
                timestamp={formatDistanceToNow(new Date(tx.tx_date), {
                  addSuffix: true,
                })}
                icon={getTransactionIcon(tx)}
              />
            ))}
          </div>
        )}

        <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
          <Link href="/mobile/activity">
            View All Activity
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>

        <div className="text-xs text-center text-muted-foreground mt-2">
          Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
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

"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Package, Scan, Clock, Filter, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMoreActivity } from "../../../actions/activity";
import { Transaction } from "@/types/models/activity";

interface ActivityFeedProps {
  initialData: Transaction[];
  initialTotal: number;
}

export function ActivityFeed({ initialData, initialTotal }: ActivityFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  // Setup infinite query with proper typing
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["activity"],
      queryFn: async ({ pageParam = 1 }) => {
        const result = await getMoreActivity(pageParam as number, 10);
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch activity");
        }
        return {
          data: result.data || [],
          total: result.total || 0,
          hasMore: result.hasMore || false,
        };
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasMore ? allPages.length + 1 : undefined;
      },
      initialData: {
        pages: [
          {
            data: initialData,
            total: initialTotal,
            hasMore: initialData.length < initialTotal,
          },
        ],
        pageParams: [1],
      },
    });

  // Intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    // Store the current element in a variable
    const currentLoaderRef = loaderRef.current;

    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      // Use the captured variable in cleanup
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Filter transactions based on search term
  const filteredTransactions = searchTerm.trim()
    ? data?.pages
        .flatMap((page) => page.data)
        .filter(
          (tx) =>
            tx.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.tx_type.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : data?.pages.flatMap((page) => page.data);

  // Get appropriate icon based on transaction type
  const getTransactionIcon = (tx: Transaction) => {
    switch (tx.tx_type) {
      case "intake":
        return <Package className="h-4 w-4" />;
      case "loaded":
        return <Scan className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
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
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="relative flex w-full items-center">
        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search activity..."
          className="w-full pl-8 pr-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="ghost" size="icon" className="absolute right-0 h-full">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {filteredTransactions?.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No matching activity found
          </Card>
        ) : (
          filteredTransactions?.map((tx) => (
            <Card key={tx.tx_id} className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    tx.direction === "IN"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : tx.direction === "OUT"
                        ? "bg-amber-100 dark:bg-amber-900/20"
                        : "bg-muted"
                  }`}
                >
                  {getTransactionIcon(tx)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{getTransactionTitle(tx)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.tx_date), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Transaction #{tx.tx_id} · {tx.tx_type.toUpperCase()}
                    {tx.direction && ` · ${tx.direction}`}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}

        {/* Loading indicator */}
        <div ref={loaderRef} className="py-4 flex justify-center">
          {hasNextPage &&
            (isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more...
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                Load More
              </Button>
            ))}

          {!hasNextPage && data?.pages[0].total > 0 && (
            <p className="text-sm text-muted-foreground py-2">
              Showing all {data.pages[0].total} items
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

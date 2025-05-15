"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightIcon, FileTextIcon, BookOpenIcon, PackageIcon, WorkflowIcon, PlusCircleIcon } from "lucide-react";

interface BentoGridProps {
  onOpenOrderModal: () => void;
  // Add other props as needed, e.g., for inventory KPIs
  totalDrums?: number;
  itemsBelowThreshold?: number;
}

export function BentoGrid({ onOpenOrderModal, totalDrums = 0, itemsBelowThreshold = 0 }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6">
      {/* Release Notes */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-6 w-6 text-primary" />
            <CardTitle>Release Notes</CardTitle>
          </div>
          <CardDescription>Latest updates and new features.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li><strong>Feature X:</strong> Now available for all users!</li>
            <li><strong>Improvement Y:</strong> Enhanced performance in module Z.</li>
            <li><strong>Bug Fix:</strong> Resolved issue with data syncing.</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" asChild>
            <Link href="/release-notes">View all updates <ArrowRightIcon className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardFooter>
      </Card>

      {/* User Guides */}
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-primary" />
            <CardTitle>User Guides</CardTitle>
          </div>
          <CardDescription>Learn how to use the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Find tutorials, walkthroughs, and FAQs to get the most out of our tools.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" asChild>
            <Link href="/guides">Explore Guides <ArrowRightIcon className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Inventory Dashboard */}
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PackageIcon className="h-6 w-6 text-primary" />
            <CardTitle>Inventory Snapshot</CardTitle>
          </div>
          <CardDescription>Quick view of your inventory status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Total Drums</p>
            <p className="text-2xl font-bold">{totalDrums}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Items Below Threshold</p>
            <p className="text-2xl font-bold">{itemsBelowThreshold}</p>
          </div>
           <div>
            <p className="text-sm font-medium">Most Common Material</p>
            <p className="text-lg font-semibold">Material XYZ</p> {/* Placeholder */}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="default" size="sm" asChild>
            <Link href="/inventory">Go to Inventory <ArrowRightIcon className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Tasks & Workflows */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <WorkflowIcon className="h-6 w-6 text-primary" />
            <CardTitle>Tasks & Workflows</CardTitle>
          </div>
          <CardDescription>Manage orders and production schedules.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={onOpenOrderModal} size="lg" className="w-full">
            <PlusCircleIcon className="mr-2 h-5 w-5" /> Create New Order
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => alert("Navigate to Create Production Schedule (Not Implemented)")}>
            <PlusCircleIcon className="mr-2 h-5 w-5" /> Create Production Schedule
          </Button>
        </CardContent>
         <CardFooter>
          <p className="text-xs text-muted-foreground">
            Streamline your operations by creating and managing tasks.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Filter, ChevronRight, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Mobile Inventory",
  description: "Mobile inventory management view",
};

// Mock inventory data - replace with real data fetching
const mockInventoryItems = [
  { id: "A1001", name: "Product Alpha", category: "Raw Material", stock: 24 },
  { id: "B2002", name: "Product Beta", category: "Finished Good", stock: 15 },
  { id: "C3003", name: "Product Charlie", category: "Raw Material", stock: 42 },
  { id: "D4004", name: "Product Delta", category: "Packaging", stock: 8 },
  { id: "E5005", name: "Product Echo", category: "Finished Good", stock: 30 },
];

export default function MobileInventoryPage() {
  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Inventory Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Categories</CardTitle>
          <CardDescription>Browse by inventory category</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <CategoryButton category="Raw Materials" count={42} />
          <CategoryButton category="Finished Goods" count={23} />
          <CategoryButton category="Packaging" count={15} />
          <CategoryButton category="Work in Progress" count={7} />
        </CardContent>
      </Card>

      {/* Recent Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Items</CardTitle>
          <CardDescription>Recently viewed or modified items</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {mockInventoryItems.map((item) => (
              <Link
                key={item.id}
                href={`/mobile/inventory/item/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{item.stock}</p>
                    <p className="text-xs text-muted-foreground">In Stock</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoryButtonProps {
  category: string;
  count: number;
}

function CategoryButton({ category, count }: CategoryButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-auto justify-start gap-3 px-4 py-3"
      asChild
    >
      <Link
        href={`/mobile/inventory/category/${category
          .toLowerCase()
          .replace(/\s+/g, "-")}`}
      >
        <div className="flex flex-col items-start">
          <span className="text-base font-medium">{category}</span>
          <span className="text-xs text-muted-foreground">{count} items</span>
        </div>
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </Link>
    </Button>
  );
}

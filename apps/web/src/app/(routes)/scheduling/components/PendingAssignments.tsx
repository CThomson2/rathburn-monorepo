"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingAssignments } from "@/features/drum-assignment/data-utils";
import {
  PendingAssignment,
  DrumAssignmentFilters,
} from "@/features/drum-assignment/types";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/core/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { CalendarIcon, FilterIcon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";

interface PendingAssignmentsProps {
  initialAssignments?: PendingAssignment[];
  initialTotal?: number;
  onRefresh?: () => void;
}

export function PendingAssignments({
  initialAssignments = [],
  initialTotal = 0,
  onRefresh,
}: PendingAssignmentsProps) {
  const [assignments, setAssignments] =
    useState<PendingAssignment[]>(initialAssignments);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<DrumAssignmentFilters>({
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPendingAssignments(filters);
      setAssignments(response.pendingAssignments);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAssignments();
  }, [filters, fetchAssignments]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, material: searchTerm, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({ page: 1, limit: 10 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(total / filters.limit);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejected
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pending Assignments</CardTitle>
        <CardDescription>
          View and manage drum assignments pending processing
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <Select onValueChange={handleStatusChange} value={filters.status}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex items-center gap-1"
              >
                <FilterIcon className="h-4 w-4" />
                Clear
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  fetchAssignments();
                  if (onRefresh) onRefresh();
                }}
                className="flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 3V8H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 16V21H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.83221C14.5341 3.29185 12.9474 3.00049 11.3273 3.00049C6.12779 3.00049 1.76275 7.36553 1.76275 12.565C1.76275 13.0113 1.79209 13.451 1.84887 13.8824"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 20.1678C9.46591 20.7082 11.0526 20.9995 12.6727 20.9995C17.8722 20.9995 22.2373 16.6345 22.2373 11.435C22.2373 10.9887 22.2079 10.549 22.1511 10.1176"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Drum ID</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Distillation ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading assignments...
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No pending assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.id}</TableCell>
                      <TableCell>{assignment.drum_id}</TableCell>
                      <TableCell>
                        {assignment.drum?.material || "Unknown"}
                      </TableCell>
                      <TableCell>{assignment.distillation_id}</TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>{assignment.assigned_by || "N/A"}</TableCell>
                      <TableCell>
                        {assignment.assigned_date
                          ? new Date(
                              assignment.assigned_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{assignment.notes || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > filters.limit && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, filters.page - 1))
                      }
                      className={
                        filters.page <= 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 py-2">{`Page ${filters.page} of ${totalPages}`}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, filters.page + 1))
                      }
                      className={
                        filters.page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js"; // Import directly from supabase-js
import { createClient } from "@/lib/supabase/client"; // Import your client creator
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle,
  AlertTriangleIcon,
  Info,
  Search,
  Filter,
  ScanBarcode,
  User,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Import the specific type from the centralized file
import { Database } from "@rathburn/types";

// Define the interface for scan data from public.session_scans
// Base type with original fields
type SessionScanBaseData = Database["public"]["Tables"]["session_scans"]["Row"];

// Add this new type for task comments
type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"] & {
  profiles?: {
    email?: string | null;
    username?: string | null;
  };
};

// Extended type for the view that includes the user email fields
interface SessionScanData extends SessionScanBaseData {
  user_email?: string | null;
  user_email_name?: string | null;
}

// Remove apiUrl and apiKey, make initialScans optional (will fetch if not provided)
interface RealtimeScanLogSidebarProps {
  initialScans?: SessionScanData[];
}

// Helper functions for styling (can be expanded)
function getStatusColor(status: SessionScanData["scan_status"]): string {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "ignored":
      return "bg-slate-500"; // Adjusted from gray-400 for dark theme
    default:
      return "bg-amber-500"; // For any other unexpected status
  }
}

function getActionColor(type: string): string {
  switch (type) {
    case "check_in":
      return "border-l-green-500";
    case "transport":
      return "border-l-blue-500";
    case "free_scan":
      return "border-l-slate-500";
    case "context":
      return "border-l-purple-500";
    case "cancel":
      return "border-l-red-500";
    case "process":
      return "border-l-yellow-500";
    default:
      return "border-l-slate-500";
  }
}

function getStatusBadgeVariant(
  status: SessionScanData["scan_status"]
): "default" | "destructive" | "secondary" | "outline" | null | undefined {
  switch (status) {
    case "success":
      return "default"; // Often green or primary
    case "error":
      return "destructive"; // Often red
    case "ignored":
      return "secondary"; // Often gray
    default:
      return "outline";
  }
}

// Supported filter types
type ScanStatus = "all" | "success" | "error" | "ignored";
type ScanAction =
  | "all"
  | "check_in"
  | "transport"
  | "process"
  | "context"
  | "cancel"
  | "free_scan";

/**
 * RealtimeScanLogSidebar component for displaying a list of recent scans.
 *
 * It will fetch initial scans from the database if not provided and
 * subscribe to the "session_scans_feed" channel to receive real-time updates.
 *
 * @property {SessionScanData[]} [initialScans] - Initial scans to display (optional)
 */
const RealtimeScanLogSidebar = ({
  initialScans,
}: RealtimeScanLogSidebarProps) => {
  // If initialScans are provided, use them, otherwise start empty
  const [scans, setScans] = useState<SessionScanData[]>(initialScans || []);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(!initialScans);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const commentsChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScanStatus>("success");
  const [actionFilter, setActionFilter] = useState<ScanAction>("all");
  // New state for view type: 'scans', 'comments', or 'updates'
  const [viewType, setViewType] = useState<"scans" | "comments" | "updates">(
    "scans"
  );

  // Use the imported createClient directly
  const supabase = useMemo(() => createClient(), []);

  // Effect to fetch initial scans if not provided
  useEffect(() => {
    async function fetchInitialScans() {
      if (!initialScans && supabase) {
        setIsLoadingInitial(true);
        try {
          // Use a more type-safe approach with this SQL query
          const { data, error: fetchError } = await supabase
            .from("v_session_scans_with_user")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)
            .gte(
              "created_at",
              new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            );

          if (fetchError) {
            console.error("Error fetching initial scans:", fetchError.message);
            setError("Failed to load initial scan data.");
            setScans([]);
          } else if (data) {
            // Safely cast the data to our expected type
            setScans(data as unknown as SessionScanData[]);
            setError(null);
          }
        } catch (err) {
          console.error("Exception fetching initial scans:", err);
          setError("Failed to load scan data due to an unexpected error.");
          setScans([]);
        }
        setIsLoadingInitial(false);
      }
    }

    fetchInitialScans();
    // Dependency array includes initialScans and supabase instance
  }, [initialScans, supabase]);

  // Effect to fetch initial comments
  useEffect(() => {
    async function fetchComments() {
      if (supabase && viewType === "comments") {
        setIsLoadingComments(true);
        try {
          const { data, error: fetchError } = await supabase
            .from("task_comments")
            .select(
              `
              *,
              profiles:user_id (
                email,
                username
              )
            `
            )
            .order("created_at", { ascending: false })
            .limit(100)
            .gte(
              "created_at",
              new Date(
                new Date().setDate(new Date().getDate() - 7)
              ).toISOString()
            );

          if (fetchError) {
            console.error("Error fetching comments:", fetchError.message);
            setError("Failed to load comment data.");
            setComments([]);
          } else if (data) {
            setComments(data as unknown as TaskComment[]);
            setError(null);
          }
        } catch (err) {
          console.error("Exception fetching comments:", err);
          setError("Failed to load comment data due to an unexpected error.");
          setComments([]);
        }
        setIsLoadingComments(false);
      }
    }

    fetchComments();
  }, [supabase, viewType]);

  // Effect for Realtime subscription (mostly unchanged)
  useEffect(() => {
    if (!supabase) {
      setIsConnected(false);
      return;
    }

    const channelName = `session_scans_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_scans", // We still subscribe to the base table
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(
            `RealtimeScanLogSidebar (${channelName}): Received payload:`,
            payload
          );
          if (payload.errors) {
            console.error(
              `RealtimeScanLogSidebar (${channelName}) error:`,
              payload.errors
            );
            setError(`Realtime error: ${payload.errors[0]}`);
            return;
          }

          if (payload.eventType === "INSERT" && payload.new) {
            try {
              // We need to fetch the complete row from the view to get the user_email
              const { data: viewData, error: viewError } = await supabase
                .from("v_session_scans_with_user")
                .select("*")
                .eq("id", payload.new.id)
                .single();

              if (viewError) {
                console.error(
                  "Error fetching inserted scan from view:",
                  viewError
                );
              }

              // Use the view data if available, otherwise fallback to the payload with no email
              const newScan = viewData || {
                ...payload.new,
                user_email: null,
                user_email_name: null,
              };

              setScans((prevScans) =>
                [newScan as SessionScanData, ...prevScans].slice(0, 100)
              );
              setError(null);
            } catch (err) {
              console.error("Error processing INSERT realtime update:", err);
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            try {
              // Similar approach for updates
              const { data: viewData, error: viewError } = await supabase
                .from("v_session_scans_with_user")
                .select("*")
                .eq("id", payload.new.id)
                .single();

              if (viewError) {
                console.error(
                  "Error fetching updated scan from view:",
                  viewError
                );
              }

              const updatedScan = viewData || {
                ...payload.new,
                user_email: null,
                user_email_name: null,
              };

              setScans((prevScans) =>
                prevScans.map((s) =>
                  s.id === updatedScan.id ? (updatedScan as SessionScanData) : s
                )
              );
              setError(null);
            } catch (err) {
              console.error("Error processing UPDATE realtime update:", err);
            }
          } else if (
            payload.eventType === "DELETE" &&
            payload.old &&
            payload.old.id
          ) {
            const deletedScanId = payload.old.id;
            setScans((prevScans) =>
              prevScans.filter((s) => s.id !== deletedScanId)
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `RealtimeScanLogSidebar subscription status (${channelName}): ${status}`
        );
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `RealtimeScanLogSidebar subscription error (${channelName}):`,
            err
          );
          setError(`Subscription error: ${err?.message || "Unknown issue"}`);
          setIsConnected(false);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current && supabase) {
        supabase
          .removeChannel(channelRef.current)
          .then((status) =>
            console.log(
              `RealtimeScanLogSidebar channel ${channelName} removed, status:`,
              status
            )
          )
          .catch((error) =>
            console.error(
              `Error removing RealtimeScanLogSidebar channel ${channelName}:`,
              error
            )
          );
        channelRef.current = null;
      }
    };
  }, [supabase]); // Dependency only on supabase client

  // Effect to subscribe to comment updates
  useEffect(() => {
    if (!supabase || viewType !== "comments") {
      // Clean up comment subscription if we're not viewing comments
      if (commentsChannelRef.current && supabase) {
        supabase.removeChannel(commentsChannelRef.current);
        commentsChannelRef.current = null;
      }
      return;
    }

    const channelName = `task_comments_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(
            `CommentsFeed (${channelName}): Received payload:`,
            payload
          );

          if (payload.errors) {
            console.error(
              `CommentsFeed (${channelName}) error:`,
              payload.errors
            );
            setError(`Realtime error: ${payload.errors[0]}`);
            return;
          }

          if (payload.eventType === "INSERT" && payload.new) {
            try {
              // Fetch the user information
              const { data: userData, error: userError } = await supabase
                .from("profiles")
                .select("email, username")
                .eq("user_id", payload.new.user_id)
                .single();

              if (userError) {
                console.error(
                  "Error fetching user info for comment:",
                  userError
                );
              }

              const newComment = {
                ...payload.new,
                profiles: userData || { email: null, username: null },
              };

              setComments((prevComments) => {
                // Check if this comment ID already exists to prevent duplicates
                const exists = prevComments.some(
                  (c) => c.id === payload.new.id
                );
                if (exists) return prevComments;
                return [newComment as TaskComment, ...prevComments].slice(
                  0,
                  100
                );
              });
              setError(null);
            } catch (err) {
              console.error("Error processing INSERT comment update:", err);
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            // For updates, use the username directly from the payload
            try {
              // The username is now included in the payload.new from the trigger
              const updatedComment = {
                ...payload.new,
                profiles: {
                  // Use username from the updated comment if available
                  username: payload.new.username || null,
                  email: null, // We don't have email in this context
                },
              };

              console.log("Comment update received:", updatedComment);

              setComments((prevComments) =>
                prevComments.map((c) =>
                  c.id === payload.new.id ? (updatedComment as TaskComment) : c
                )
              );
            } catch (err) {
              console.error("Error processing UPDATE comment update:", err);
            }
          } else if (
            payload.eventType === "DELETE" &&
            payload.old &&
            payload.old.id
          ) {
            // Handle comment deletions
            const deletedCommentId = payload.old.id;
            setComments((prevComments) =>
              prevComments.filter((c) => c.id !== deletedCommentId)
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `CommentsFeed subscription status (${channelName}): ${status}`
        );
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `CommentsFeed subscription error (${channelName}):`,
            err
          );
        }
      });

    commentsChannelRef.current = channel;

    return () => {
      if (commentsChannelRef.current && supabase) {
        supabase
          .removeChannel(commentsChannelRef.current)
          .then((status) =>
            console.log(
              `CommentsFeed channel ${channelName} removed, status:`,
              status
            )
          )
          .catch((error) =>
            console.error(
              `Error removing CommentsFeed channel ${channelName}:`,
              error
            )
          );
        commentsChannelRef.current = null;
      }
    };
  }, [supabase, viewType]);

  // Filter scans based on search query and filters
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Apply status filter
      if (statusFilter !== "all" && scan.scan_status !== statusFilter) {
        return false;
      }

      // Apply type filter
      if (actionFilter !== "all" && scan.scan_action !== actionFilter) {
        return false;
      }

      // Apply search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          scan.raw_barcode?.toLowerCase().includes(searchLower) ||
          scan.item_name?.toLowerCase().includes(searchLower) ||
          scan.user_email_name?.toLowerCase().includes(searchLower) ||
          scan.error_message?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [scans, searchQuery, statusFilter, actionFilter]);

  // Filter comments based on search query
  const filteredComments = useMemo(() => {
    if (!comments) return [];

    return comments.filter((comment) => {
      // Apply search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          comment.comment?.toLowerCase().includes(searchLower) ||
          comment.profiles?.email?.toLowerCase().includes(searchLower) ||
          comment.profiles?.username?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [comments, searchQuery]);

  // Calculate some stats
  const totalToday = useMemo(() => {
    const today = new Date().toDateString();
    return scans.filter(
      (scan) => new Date(scan.created_at).toDateString() === today
    ).length;
  }, [scans]);

  const successRate = useMemo(() => {
    if (scans.length === 0) return 100;
    const successCount = scans.filter(
      (scan) => scan.scan_status === "success"
    ).length;
    return Math.round((successCount / scans.length) * 100);
  }, [scans]);

  const errorCount = useMemo(() => {
    return scans.filter((scan) => scan.scan_status === "error").length;
  }, [scans]);

  const ignoredCount = useMemo(() => {
    return scans.filter((scan) => scan.scan_status === "ignored").length;
  }, [scans]);

  // Auto-scroll to top when new scan comes in, if desired
  useEffect(() => {
    if (scrollAreaRef.current && filteredScans.length > 0) {
      // Simple scroll to top, or implement more complex logic (e.g., scroll only if user is near the top)
      // scrollAreaRef.current.scrollTop = 0;
    }
  }, [filteredScans]);

  // --- UI Rendering based on scan-log-sidebar.tsx mockup ---
  return (
    <div className="relative w-full h-full flex flex-col p-4 font-sans overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Live Operations</h2>
          <p className="text-sidebar-muted-foreground text-sm mt-1">
            Real-time monitoring of operations & barcode scans
          </p>
        </div>
        <div className="flex items-center px-3 py-1.5 rounded-full bg-sidebar-muted border border-sidebar-border">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full mr-2",
              isConnected
                ? getStatusColor("success") // Green for connected
                : error
                  ? getStatusColor("error") // Red for error
                  : getStatusColor("ignored") // Gray for connecting/disconnected
            )}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Live" : error ? "Error" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Stats cards - only show for scans view */}
      {viewType === "scans" && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Total Scans Today */}
          <Card className="bg-sidebar-card text-sidebar-card-foreground border-l-4 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <p className="text-sm font-medium">Scans Today</p>
              </div>
              <p className="text-2xl font-bold">{totalToday}</p>
            </CardContent>
          </Card>
          {/* Success Rate */}
          <Card className="bg-sidebar-card text-sidebar-card-foreground border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm font-medium">Success Rate</p>
              </div>
              <p className="text-2xl font-bold">{successRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comments stats cards for comments view */}
      {viewType === "comments" && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Total Comments */}
          <Card className="bg-sidebar-card text-sidebar-card-foreground border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-medium">Comments</p>
              </div>
              <p className="text-2xl font-bold">{comments.length}</p>
            </CardContent>
          </Card>
          {/* Recent Period */}
          <Card className="bg-sidebar-card text-sidebar-card-foreground border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <p className="text-sm font-medium">Last 7 Days</p>
              </div>
              <p className="text-2xl font-bold">
                {
                  comments.filter(
                    (c) =>
                      new Date(c.created_at) >
                      new Date(new Date().setDate(new Date().getDate() - 7))
                  ).length
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search bar with dynamic placeholder */}
      <div className="mb-4 relative flex items-center">
        <Input
          className="pl-9 py-2 w-full bg-sidebar-muted text-sidebar-foreground border-sidebar-border"
          placeholder={
            viewType === "scans"
              ? "Search barcode, material, user..."
              : viewType === "comments"
                ? "Search comment text, user..."
                : "Search updates..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-muted-foreground" />
      </div>

      {/* Filter tabs */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-sidebar-muted-foreground" />
          <span className="text-xs font-medium text-sidebar-muted-foreground">
            View
          </span>
        </div>
        {/* Main view type selection */}
        <Tabs
          defaultValue="scans"
          value={viewType}
          onValueChange={(val) =>
            setViewType(val as "scans" | "comments" | "updates")
          }
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 bg-sidebar-muted">
            <TabsTrigger value="scans">Scans</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Only show these filters when in scans view */}
        {viewType === "scans" && (
          <>
            <div className="flex items-center mt-4">
              <Filter className="w-4 h-4 mr-2 text-sidebar-muted-foreground" />
              <span className="text-xs font-medium text-sidebar-muted-foreground">
                Status
              </span>
            </div>
            <Tabs
              defaultValue="success"
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as ScanStatus)}
              className="w-full border-border"
            >
              <TabsList className="grid grid-cols-3 bg-sidebar-muted">
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="error">Errors</TabsTrigger>
                <TabsTrigger value="ignored">Ignored</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center mt-4">
              <ScanBarcode className="w-4 h-4 mr-2 text-sidebar-muted-foreground" />
              <span className="text-xs font-medium text-sidebar-muted-foreground">
                Type
              </span>
            </div>
            <Tabs
              defaultValue="all"
              value={actionFilter}
              onValueChange={(val) => setActionFilter(val as ScanAction)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 bg-sidebar-muted">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="check_in">Check-in</TabsTrigger>
                <TabsTrigger value="transport">Transport</TabsTrigger>
                <TabsTrigger value="free_scan">Misc</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        )}
      </div>

      {error && (
        <Card className="mb-4 border-red-500/50 bg-red-900/20 text-red-200">
          <CardContent className="p-3">
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator for initial fetch */}
      {(isLoadingInitial && viewType === "scans") ||
      (isLoadingComments && viewType === "comments") ? (
        <Card className="border-dashed border-2 border-sidebar-border bg-sidebar-card/30">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="w-10 h-10 mb-3 rounded-full border-2 border-sidebar-muted-foreground/50 border-dashed animate-pulse"></div>
            <p className="text-md text-sidebar-muted-foreground">
              Loading {viewType}...
            </p>
          </CardContent>
        </Card>
      ) : null}

      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="space-y-2 w-full pr-2">
          {/* Show error and loading states */}
          {error && (
            <Card className="mb-4 border-red-500/50 bg-red-900/20 text-red-200">
              <CardContent className="p-3">
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty state for scans or comments */}
          {((viewType === "scans" &&
            filteredScans.length === 0 &&
            !error &&
            !isLoadingInitial) ||
            (viewType === "comments" &&
              filteredComments.length === 0 &&
              !error &&
              !isLoadingComments)) && (
            <Card className="border-dashed border-2 border-sidebar-border bg-sidebar-card/30">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-10 h-10 mb-3 rounded-full border-2 border-sidebar-muted-foreground/50 border-dashed animate-pulse"></div>
                <p className="text-md text-sidebar-muted-foreground">
                  {viewType === "scans"
                    ? searchQuery ||
                      statusFilter !== "all" ||
                      actionFilter !== "all"
                      ? "No matching scans found"
                      : "Waiting for scans..."
                    : viewType === "comments"
                      ? searchQuery
                        ? "No matching comments found"
                        : "No comments yet"
                      : "No updates yet"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Display scans when in scans view */}
          {viewType === "scans" &&
            filteredScans.map((scan) => (
              <Card
                key={scan.id}
                className={cn(
                  "w-full shadow-sm bg-sidebar-card border border-l-2 border-sidebar-border rounded-md",
                  getActionColor(scan.scan_action)
                )}
              >
                <div className="p-3">
                  <div className="flex justify-between items-center">
                    {/* Scan Content */}
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {/* Icon could be based on scan_action or scan_status */}
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getStatusColor(scan.scan_status)
                        )}
                      ></div>
                      <div className="font-mono text-sm truncate">
                        <span className="font-semibold capitalize">
                          {scan.scan_action.replace(/.*[_\s]/g, " ")}:
                        </span>{" "}
                        {scan.raw_barcode.slice(0, 10) +
                          (scan.raw_barcode.length > 10 ? "..." : "")}
                      </div>
                    </div>

                    {/* Time and Status Badge */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs text-sidebar-muted-foreground">
                        {new Date(scan.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit", // Optional: for more precision
                        })}
                      </span>
                      <Badge
                        variant={getStatusBadgeVariant(scan.scan_status)}
                        className="capitalize px-2 py-0.5 text-xs h-5"
                      >
                        {scan.scan_status}
                      </Badge>
                    </div>
                  </div>
                  {/* Additional Details */}
                  <div className="flex flex-row justify-end items-center mt-1">
                    {scan.item_name && scan.raw_barcode !== scan.item_name && (
                      <p className="text-sidebar-muted-foreground text-sm truncate pl-4 flex-1">
                        {scan.item_name}
                      </p>
                    )}
                    {scan.user_email_name && (
                      <p className="text-sidebar-muted-foreground text-xs flex items-center justify-end pl-2 flex-shrink-0">
                        <User className="w-3 h-3 mr-1 inline-block" />
                        {scan.user_email_name}
                      </p>
                    )}
                  </div>
                  {scan.scan_status === "error" && scan.error_message && (
                    <p className="text-red-400 text-xs mt-1 pl-4 truncate">
                      Error: {scan.error_message}
                    </p>
                  )}
                </div>
              </Card>
            ))}

          {/* Display comments when in comments view */}
          {viewType === "comments" &&
            filteredComments.map((comment) => (
              <Card
                key={comment.id}
                className="w-full shadow-sm bg-sidebar-card border border-sidebar-border rounded-md"
              >
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-sm font-medium">
                          {comment.username ||
                            comment.profiles?.email?.split("@")[0] ||
                            "Unknown User"}
                        </div>
                        {comment.profiles?.email && (
                          <div className="text-xs text-sidebar-muted-foreground">
                            {comment.profiles.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-sidebar-muted-foreground">
                      {new Date(comment.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">
                    {comment.comment}
                  </div>
                  <div className="mt-2 pt-2 border-t border-sidebar-border text-xs text-sidebar-muted-foreground">
                    {comment.pol_id ? (
                      <span>Task: Transport (PO Line)</span>
                    ) : comment.job_id ? (
                      <span>Task: Production Job</span>
                    ) : (
                      <span>Task: Unknown</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}

          {/* Update content for Updates view */}
          {viewType === "updates" && (
            <Card className="border-dashed border-2 border-sidebar-border bg-sidebar-card/30">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-10 h-10 mb-3 rounded-full border-2 border-sidebar-muted-foreground/50 border-dashed animate-pulse"></div>
                <p className="text-md text-sidebar-muted-foreground">
                  Updates feature coming soon
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RealtimeScanLogSidebar;

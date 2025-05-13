import { useEffect, useState } from "react";
import { supabase } from "@/core/lib/supabase/client";
import { useAuth } from "@/core/hooks/use-auth";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import TopNavbar from "@/components/navbar/top-navbar"; // Assuming a similar top navbar might be used

interface ScanHistoryItem {
  id: string;
  created_at: string;
  raw_barcode: string;
  scan_status: string;
  scan_action: string | null;
  error_message: string | null;
  item_name: string | null;
  po_number: string | null;
  session_id: string | null;
  pol_id: string | null;
  // For grouping, we'll get session details separately or infer
}

interface SessionDetails {
  id: string;
  name: string | null;
  started_at: string;
}

interface GroupedScanHistory {
  [sessionId: string]: {
    session_name: string | null;
    session_started_at: string;
    scans: ScanHistoryItem[];
  };
}

// Explicit type for the raw scan data from Supabase query
// This needs to match the structure returned by the Supabase client for the specific select query
interface PurchaseOrderLineWithOrder {
  po_id: string | null;
  purchase_orders: {
    po_number: string | null;
  } | null;
}

interface RawScanData {
  id: string;
  created_at: string;
  raw_barcode: string;
  scan_status: string;
  scan_action: string | null;
  error_message: string | null;
  item_name: string | null;
  session_id: string | null;
  pol_id: string | null;
  purchase_order_lines: PurchaseOrderLineWithOrder | null; // Adjusted to be an object or null for to-one relations
}

function formatScanTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSessionDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "ignored":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export function HistoryView() {
  const { user, loading: authLoading } = useAuth();
  const [groupedHistory, setGroupedHistory] = useState<GroupedScanHistory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory(user.id);
    } else if (!authLoading && !user) {
      setError("User not authenticated.");
      setIsLoading(false);
    }
  }, [user, authLoading]);

  async function fetchHistory(userId: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, name, started_at")
        .eq("created_by", userId)
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;
      const validSessions = (sessionsData || []).filter(
        (s) => s.id && s.started_at
      ) as SessionDetails[];

      const { data: scansData, error: scansError } = await supabase
        .from("session_scans")
        .select(
          `
          id,
          created_at,
          raw_barcode,
          scan_status,
          scan_action,
          error_message,
          item_name,
          session_id,
          pol_id,
          purchase_order_lines (
            po_id,
            purchase_orders (
              po_number
            )
          )
        `
        )
        .eq("user_id", userId)
        .order("session_id", { ascending: false })
        .order("created_at", { ascending: false });

      if (scansError) throw scansError;

      const typedScansData = (scansData || []) as unknown as RawScanData[]; // TODO: Fix this type error in Database
      const grouped: GroupedScanHistory = {};

      for (const session of validSessions) {
        grouped[session.id] = {
          session_name:
            session.name ||
            `Session at ${formatSessionDate(session.started_at)}`,
          session_started_at: session.started_at,
          scans: [],
        };
      }

      for (const scan of typedScansData) {
        // Ensure session_id is not null before trying to group
        if (!scan.session_id) {
          console.warn("Scan found without session_id:", scan.id);
          continue;
        }

        const poNumber =
          scan.purchase_order_lines?.purchase_orders?.po_number || null;

        const historyItem: ScanHistoryItem = {
          id: scan.id,
          created_at: scan.created_at,
          raw_barcode: scan.raw_barcode,
          scan_status: scan.scan_status,
          scan_action: scan.scan_action,
          error_message: scan.error_message,
          item_name: scan.item_name,
          session_id: scan.session_id, // session_id is now string | null, matching RawScanData
          pol_id: scan.pol_id,
          po_number:
            scan.scan_action === "check_in" && scan.pol_id ? poNumber : null,
        };

        if (grouped[scan.session_id]) {
          grouped[scan.session_id].scans.push(historyItem);
        } else {
          // This case implies a scan exists for a session not fetched or not in validSessions.
          // Could happen if a session was created by another user but scan linked to this user (unlikely)
          // or if a session was deleted after scans were made.
          // For robustness, we can create a group for it.
          grouped[scan.session_id] = {
            session_name: `Orphaned Session (${scan.session_id.substring(0, 8)})`,
            session_started_at: scan.created_at, // Best guess for start time
            scans: [historyItem],
          };
        }
      }

      const sortedGrouped: GroupedScanHistory = {};
      Object.keys(grouped)
        .sort(
          (a, b) =>
            new Date(grouped[b].session_started_at).getTime() -
            new Date(grouped[a].session_started_at).getTime()
        )
        .forEach((sessionId) => {
          sortedGrouped[sessionId] = grouped[sessionId];
          // Sort scans within each session
          sortedGrouped[sessionId].scans.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        });

      setGroupedHistory(sortedGrouped);
    } catch (err) {
      const typedError = err as Error; // This is fine
      console.error("Failed to fetch scan history:", typedError);
      setError(typedError.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  const toggleCollapsible = (sessionId: string) => {
    setOpenCollapsibles((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-lg mx-auto p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-600">
          Error Fetching History
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => user && fetchHistory(user.id)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const sessionIds = Object.keys(groupedHistory);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* 
        You might want a different TopNavbar or no navbar depending on how /history is integrated.
        If it's a view within Index.tsx, Index's TopNavbar would handle it.
        If it's a separate route, you might add a simple one here.
        For now, I'll comment it out.
        <TopNavbar navLinks={[{ name: "Scan History", value: "history", icon: Clock }]} activeView="history" onViewChange={() => {}} />
      */}
      <div className="p-4 flex-1 overflow-hidden">
        <h1 className="text-2xl font-semibold mb-4 px-1">Scan History</h1>
        {sessionIds.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No scan history found for your account.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-4">
              {sessionIds.map((sessionId) => {
                const session = groupedHistory[sessionId];
                if (!session) return null;
                return (
                  <Collapsible
                    key={sessionId}
                    open={openCollapsibles[sessionId] || false}
                    onOpenChange={() => toggleCollapsible(sessionId)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {session.session_name ||
                                `Session ID: ${sessionId.substring(0, 8)}...`}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Started:{" "}
                              {formatSessionDate(session.session_started_at)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="p-1">
                            <ChevronDown
                              className={`h-5 w-5 transition-transform ${openCollapsibles[sessionId] ? "rotate-180" : ""}`}
                            />
                          </Button>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="p-3 space-y-2 max-h-96 overflow-y-auto">
                          {session.scans.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No scans in this session.
                            </p>
                          ) : (
                            session.scans.map((scan) => (
                              <div
                                key={scan.id}
                                className="p-2 border rounded-md bg-background hover:bg-muted/30"
                              >
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-mono">
                                    {scan.raw_barcode}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatScanTimestamp(scan.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs">
                                  {getStatusIcon(scan.scan_status)}
                                  <span className="capitalize">
                                    {scan.scan_status}
                                  </span>
                                  {scan.scan_action === "check_in" &&
                                    scan.po_number && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        PO: {scan.po_number}
                                      </Badge>
                                    )}
                                  {scan.scan_action === "free_scan" && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Free Scan
                                    </Badge>
                                  )}
                                </div>
                                {scan.error_message &&
                                  scan.scan_status.toLowerCase() ===
                                    "error" && (
                                    <p className="text-xs text-red-600 mt-1">
                                      {scan.error_message}
                                    </p>
                                  )}
                                {scan.item_name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Item: {scan.item_name}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

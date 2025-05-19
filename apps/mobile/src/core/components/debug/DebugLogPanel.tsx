import { X, Trash2 } from "lucide-react";
import { useDebugLogStore } from "@/core/stores/debug-log-store";
import { Button } from "@/core/components/ui/button";

export function DebugLogPanel() {
  const { logs, isLogPanelVisible, toggleLogPanel, clearLogs } =
    useDebugLogStore();

  if (!isLogPanelVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "60px", // Adjusted to avoid overlapping with potential top bars
        left: "10px",
        right: "10px",
        bottom: "80px", // Adjusted to avoid overlapping with bottom nav
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "white",
        padding: "15px",
        zIndex: 10000,
        fontSize: "12px",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
      }}
      aria-live="polite"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
          Session Logs
        </h3>
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearLogs}
            title="Clear Logs"
            style={{ color: "white", marginRight: "5px" }}
          >
            <Trash2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLogPanel}
            title="Close Logs"
            style={{ color: "white" }}
          >
            <X size={20} />
          </Button>
        </div>
      </div>
      <ul
        style={{
          flexGrow: 1,
          overflowY: "auto",
          listStyleType: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {logs.length === 0 ? (
          <li
            style={{ textAlign: "center", color: "#aaa", paddingTop: "20px" }}
          >
            No logs yet.
          </li>
        ) : (
          logs.map((log, index) => (
            <li
              key={index}
              style={{
                borderBottom: "1px solid #444",
                padding: "5px 0",
                marginBottom: "3px",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              <span style={{ color: "#888", marginRight: "8px" }}>
                {log.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span>{log.message}</span>
              {log.data && (
                <pre
                  style={{
                    fontSize: "10px",
                    color: "#ccc",
                    marginLeft: "10px",
                    marginTop: "3px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

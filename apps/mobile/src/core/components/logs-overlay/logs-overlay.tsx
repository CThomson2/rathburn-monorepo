import React from "react";
import { X } from "lucide-react";
import { useLogs } from "@/core/contexts/logs-context";

export function LogsOverlay() {
  const { logMessages, isLogOverlayVisible, toggleLogOverlay, clearLogs } =
    useLogs();

  if (!isLogOverlayVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9998, // Below a potential modal, but above most content
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={toggleLogOverlay} // Close by clicking background
    >
      <div
        style={{
          position: "relative", // For positioning the close button
          width: "90%",
          maxWidth: "600px",
          height: "70%",
          maxHeight: "500px",
          backgroundColor: "rgba(30,30,30,0.9)",
          color: "white",
          padding: "20px",
          paddingTop: "40px", // Space for close button
          zIndex: 9999,
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the log box
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
            Debug Logs
          </h3>
          <div>
            <button
              onClick={clearLogs}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
                fontSize: "12px",
              }}
              aria-label="Clear logs"
            >
              Clear
            </button>
            <button
              onClick={toggleLogOverlay}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                position: "absolute",
                top: "10px",
                right: "10px",
              }}
              aria-label="Close logs"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <ul
          style={{
            flexGrow: 1,
            overflowY: "auto",
            listStyleType: "none",
            padding: 0,
            margin: 0,
            fontSize: "12px",
          }}
          aria-live="polite"
        >
          {logMessages.length === 0 && <li>No log messages yet.</li>}
          {logMessages.map((msg, index) => (
            <li
              key={index}
              style={{
                borderBottom: "1px solid #444",
                padding: "4px 2px",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import * as BrowserTools from "@/lib/browser-tools-mcp";

/**
 * This is a React functional component named `BrowserDebug`. It provides a set of tools for debugging a browser, including:
 *
 * - Buttons to retrieve console logs, console errors, network logs, and take a screenshot
 * - Display of retrieved logs and screenshot
 * - A button to wipe all logs
 *
 * The component uses the `useState` hook to store the retrieved logs and screenshot in state variables,
 *  and the `BrowserTools` library to perform the actual debugging actions.
 * The component renders a UI with buttons and displays the retrieved data in a readable format.
 */
export default function BrowserDebug() {
  const [consoleLogs, setConsoleLogs] = useState<any[]>([]);
  const [consoleErrors, setConsoleErrors] = useState<any[]>([]);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const handleGetConsoleLogs = async () => {
    const logs = await BrowserTools.getConsoleLogs();
    setConsoleLogs(logs);
  };

  const handleGetConsoleErrors = async () => {
    const errors = await BrowserTools.getConsoleErrors();
    setConsoleErrors(errors);
  };

  const handleGetNetworkLogs = async () => {
    const logs = await BrowserTools.getNetworkLogs();
    setNetworkLogs(logs);
  };

  const handleTakeScreenshot = async () => {
    const image = await BrowserTools.takeScreenshot();
    setScreenshot(image);
  };

  const handleRunAudit = async () => {
    await BrowserTools.runAuditMode();
  };

  const handleWipeLogs = async () => {
    await BrowserTools.wipeLogs();
    setConsoleLogs([]);
    setConsoleErrors([]);
    setNetworkLogs([]);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Browser Debug Tools</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleGetConsoleLogs}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Get Console Logs
        </button>

        <button
          onClick={handleGetConsoleErrors}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Get Console Errors
        </button>

        <button
          onClick={handleGetNetworkLogs}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Get Network Logs
        </button>

        <button
          onClick={handleTakeScreenshot}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Take Screenshot
        </button>

        <button
          onClick={handleRunAudit}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Run Audit
        </button>

        <button
          onClick={handleWipeLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Wipe Logs
        </button>
      </div>

      {consoleLogs.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Console Logs</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
            {JSON.stringify(consoleLogs, null, 2)}
          </pre>
        </div>
      )}

      {consoleErrors.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Console Errors</h2>
          <pre className="bg-red-100 p-4 rounded overflow-auto max-h-40">
            {JSON.stringify(consoleErrors, null, 2)}
          </pre>
        </div>
      )}

      {networkLogs.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Network Logs</h2>
          <pre className="bg-green-100 p-4 rounded overflow-auto max-h-40">
            {JSON.stringify(networkLogs, null, 2)}
          </pre>
        </div>
      )}

      {screenshot && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Screenshot</h2>
          {/* ignore - development only, ignore type error */}
          {/* eslint @next/next/no-img-element: off */}
          <img
            src={screenshot}
            alt="Page Screenshot"
            className="border rounded max-w-full"
          />
        </div>
      )}
    </div>
  );
}

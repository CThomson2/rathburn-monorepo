import { useEffect, useState } from "react";

/**
 * A custom hook for handling Server-Sent Events (SSE) in React components.
 *
 * This hook sets up an EventSource connection to a specified endpoint, listens for
 * events, and handles cleanup when the component unmounts. It also provides a
 * way to handle reconnection attempts and connection state.
 *
 * @param url The URL of the SSE endpoint
 * @param eventTypes An array of event types to listen for
 * @param options Configuration options for the SSE connection
 * @returns An object containing the connection state, last event data, and any error
 */
export function useServerSentEvents<T = unknown>(
  url: string,
  eventTypes: string[],
  options: {
    onMessage?: (event: MessageEvent) => void;
    onEvent?: (type: string, data: T) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
    reconnectTime?: number;
    enabled?: boolean;
  } = {}
) {
  const {
    onMessage,
    onEvent,
    onError,
    onOpen,
    reconnectTime = 3000,
    enabled = true,
  } = options;

  const [connectionState, setConnectionState] = useState<
    "connecting" | "open" | "closed" | "error"
  >("closed");
  const [lastEventData, setLastEventData] = useState<Record<string, T>>({});
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't connect if the hook is disabled
    if (!enabled) {
      setConnectionState("closed");
      return;
    }

    // Initialize connection state
    setConnectionState("connecting");
    setError(null);

    // Create the EventSource connection
    const eventSource = new EventSource(url);

    // Set up event listeners
    eventSource.onopen = () => {
      setConnectionState("open");
      onOpen?.();
    };

    eventSource.onerror = (event) => {
      setConnectionState("error");
      setError(new Error("EventSource connection error"));
      onError?.(event);
    };

    eventSource.onmessage = (event) => {
      onMessage?.(event);
    };

    // Set up listeners for each event type
    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as T;
          setLastEventData((prev) => ({ ...prev, [type]: data }));
          onEvent?.(type, data);
        } catch (err) {
          console.error(`Error parsing ${type} event data:`, err);
        }
      });
    });

    // Clean up function
    return () => {
      eventSource.close();
      setConnectionState("closed");
    };
  }, [
    url,
    enabled,
    onMessage,
    onEvent,
    onError,
    onOpen,
    reconnectTime,
    eventTypes,
  ]);

  return {
    connectionState,
    lastEventData,
    error,
    isConnected: connectionState === "open",
  };
}

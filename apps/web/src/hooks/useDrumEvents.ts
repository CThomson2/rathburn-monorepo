import { useServerSentEvents } from "./useServerSentEvents";

/**
 * DrumStatusEvent represents the data structure for drum status updates
 */
interface DrumStatusEvent {
  drumId: number;
  newStatus: string;
}

/**
 * A specialized hook for subscribing to drum status events via SSE
 *
 * This hook connects to the drums SSE endpoint and provides real-time
 * drum status updates to React components. It's built on top of the
 * generic useServerSentEvents hook with specific typing for drum events.
 *
 * @param options Configuration options for the SSE connection
 * @returns An object containing the connection state, last event data, and callbacks
 */
export function useDrumEvents(
  options: {
    onDrumStatusChange?: (drumId: number, newStatus: string) => void;
    onConnectionOpen?: () => void;
    onConnectionError?: (error: Event) => void;
    enabled?: boolean;
  } = {}
) {
  const {
    onDrumStatusChange,
    onConnectionOpen,
    onConnectionError,
    enabled = true,
  } = options;

  const eventTypes = ["connected", "drumStatus"];

  const { connectionState, lastEventData, error, isConnected } =
    useServerSentEvents<DrumStatusEvent>(
      "/api/scanners/sse/drums",
      eventTypes,
      {
        onOpen: onConnectionOpen,
        onError: onConnectionError,
        onEvent: (type, data) => {
          if (type === "drumStatus" && onDrumStatusChange) {
            onDrumStatusChange(data.drumId, data.newStatus);
          }
        },
        enabled,
      }
    );

  return {
    connectionState,
    lastDrumEvent: lastEventData["drumStatus"] as DrumStatusEvent | undefined,
    error,
    isConnected,
  };
}

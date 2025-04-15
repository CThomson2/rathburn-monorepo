import { useServerSentEvents } from "./useServerSentEvents";

/**
 * OrderUpdateEvent represents the data structure for order quantity updates
 */
interface OrderUpdateEvent {
  orderId: number;
  drumId: number;
  newQuantityReceived: number;
}

/**
 * A specialized hook for subscribing to order update events via SSE
 *
 * This hook connects to the orders SSE endpoint and provides real-time
 * order quantity updates to React components. It's built on top of the
 * generic useServerSentEvents hook with specific typing for order events.
 *
 * @param options Configuration options for the SSE connection
 * @returns An object containing the connection state, last event data, and callbacks
 */
export function useOrderEvents(
  options: {
    onOrderUpdate?: (
      orderId: number,
      drumId: number,
      newQuantityReceived: number
    ) => void;
    onConnectionOpen?: () => void;
    onConnectionError?: (error: Event) => void;
    enabled?: boolean;
  } = {}
) {
  const {
    onOrderUpdate,
    onConnectionOpen,
    onConnectionError,
    enabled = true,
  } = options;

  const eventTypes = ["connected", "orderUpdate"];

  const { connectionState, lastEventData, error, isConnected } =
    useServerSentEvents<OrderUpdateEvent>(
      "/api/barcodes/sse/orders",
      eventTypes,
      {
        onOpen: onConnectionOpen,
        onError: onConnectionError,
        onEvent: (type, data) => {
          if (type === "orderUpdate" && onOrderUpdate) {
            onOrderUpdate(data.orderId, data.drumId, data.newQuantityReceived);
          }
        },
        enabled,
      }
    );

  return {
    connectionState,
    lastOrderEvent: lastEventData["orderUpdate"] as
      | OrderUpdateEvent
      | undefined,
    error,
    isConnected,
  };
}

# Barcode Scanning Flow Tests

This directory contains tests for the barcode scanning functionality in the Rathburn mobile app. The tests cover the entire flow from user input to database insertion and real-time updates.

## Test Structure

The tests are organized into the following folders:

- `components/`: Tests for UI components like StocktakeButton and ScanInput
- `hooks/`: Tests for React hooks like useStockTake
- `services/`: Tests for service functions like handleStockTakeScan

## Setting Up

Before running tests, make sure you have installed all the dependencies:

```bash
cd apps/mobile
pnpm install
```

## Running Tests

To run all tests once:

```bash
pnpm test:run
```

To run tests in watch mode during development:

```bash
pnpm test:watch
```

To generate a coverage report:

```bash
pnpm test:coverage
```

To debug tests with the Vitest UI:

```bash
pnpm test:ui
```

## Adding New Tests

When adding new tests:

1. Create your test file with the `.test.ts` or `.test.tsx` extension
2. Import the component/function you want to test
3. Use describe/it blocks to structure your tests
4. Use the Testing Library's utilities for component tests
5. Mock external dependencies as needed

## Testing Patterns

### Component Testing

For component tests, use the React Testing Library to render the component and interact with it:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

it("should render correctly", () => {
  render(<MyComponent />);
  expect(screen.getByText("Some Text")).toBeInTheDocument();
});
```

### Hook Testing

For hook tests, use the renderHook utility:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "@/core/hooks/useMyHook";

it("should update state correctly", () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.someFunction();
  });

  expect(result.current.someState).toBe(expectedValue);
});
```

### API/Service Testing

For API service tests, mock the fetch API and test the service function:

```tsx
import { vi } from "vitest";
import { myService } from "@/core/services/myService";

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

it("should call the correct endpoint", async () => {
  await myService({ param: "value" });

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining("/my-endpoint"),
    expect.objectContaining({ method: "POST" })
  );
});
```

## Database Testing

For testing database functionality, you should:

1. Use Supabase migrations to apply schema changes
2. Create triggers and functions via migrations
3. Test the API endpoints that interact with the database
4. Mock the Supabase client in your tests

## Integration Testing

Integration tests verify that multiple components work together correctly. They focus on testing the interactions between components and ensuring the entire feature works as expected.

### Naming Convention

Integration tests should be named with the `.integration.test.tsx` extension to distinguish them from unit tests. For example:

- `Index.integration.test.tsx` - Tests the complete functionality of the Index page

### Example Usage

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Index } from "@/pages/Index";
import { ScanContextProvider } from "@/contexts/scan-context";

// Mock the hooks and services that would be used in the Index page
vi.mock("@/core/hooks/use-stock-take", () => ({
  useStockTake: () => ({
    startStockTake: vi.fn().mockResolvedValue({ id: "test-session-id" }),
    isActive: true,
    sessionId: "test-session-id",
  }),
}));

vi.mock("@/core/services/handle-scan", () => ({
  handleScan: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Index Page Integration", () => {
  it("should handle complete scan workflow", async () => {
    const user = userEvent.setup();

    render(
      <ScanContextProvider>
        <Index />
      </ScanContextProvider>
    );

    // Find and interact with the scan input
    const scanInput = screen.getByPlaceholderText("Scan barcode...");
    await user.type(scanInput, "ITEM001{Enter}");

    // Verify the scan was processed and UI updated appropriately
    await waitFor(() => {
      expect(screen.getByText("Scan successful")).toBeInTheDocument();
    });

    // Verify other components have updated accordingly
    expect(screen.getByText("Recent scans")).toBeInTheDocument();
    expect(screen.getByText("ITEM001")).toBeInTheDocument();
  });
});
```

### Best Practices for Integration Tests

1. **Test complete workflows** - Follow user journeys from start to finish
2. **Mock external dependencies** - Mock API calls, databases, and other external services
3. **Minimize mocking of internal components** - The goal is to test real interactions between components
4. **Focus on user interactions** - Test from the user's perspective using userEvent for interactions
5. **Verify the correct state changes** - Check that components update their state correctly
6. **Test error handling** - Verify that errors are handled gracefully
7. **Keep tests independent** - Each test should be able to run independently of others

## Common Issues and Solutions

- **Authentication Issues**: Make sure your tests properly mock the authentication flow
- **Timing Problems**: Use `act()` for async state updates and `waitFor()` for async assertions
- **Event Bubbling**: When testing events, make sure to account for event bubbling and propagation

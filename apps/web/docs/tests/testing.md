# Testing Guide for Next.js Application

This guide explains how to write and run tests for your Next.js application, particularly focusing on testing middleware, API routes, and React components.

## Test Setup

This project uses Jest as the test runner along with the following libraries:

- `jest`: Test runner
- `ts-jest`: TypeScript support for Jest
- `jest-environment-jsdom`: DOM environment for testing client components
- `@testing-library/react`: Testing React components
- `@testing-library/jest-dom`: DOM testing utilities

## Running Tests

### Running All Tests

```bash
pnpm test
```

### Running Specific Tests

```bash
# Run a specific test file
pnpm test src/tests/middleware.test.ts

# Run tests matching a pattern
pnpm test -- -t "authentication"
```

### Watch Mode

```bash
pnpm test -- --watch
```

## Test Structure

Tests are organized in the `src/tests` directory with a structure mirroring the source code.

### Directory Structure

```
src/
├── tests/
│   ├── components/    # Component tests
│   ├── api/           # API route tests
│   ├── middleware.test.ts # Middleware tests
│   ├── mocks/         # Test mocks
│   └── helpers.ts     # Test helpers
```

## Testing Middleware

Testing Next.js middleware requires mocking the `Request`, `Response`, and Next.js APIs. Here's how to test middleware:

```typescript
import { middleware } from "../middleware";
import { createMockRequest, expectRedirectTo } from "./helpers";
import { updateSession } from "@/lib/supabase/middleware";

// Mock the updateSession function
jest.mock("@/lib/supabase/middleware", () => ({
  updateSession: jest.fn(),
}));

describe("Auth Middleware", () => {
  test("Protected routes redirect to sign-in when not authenticated", async () => {
    const request = createMockRequest("/dashboard");

    // Mock no session
    (updateSession as jest.Mock).mockResolvedValue({
      response: NextResponse.next(),
      session: null,
    });

    const response = await middleware(request);

    // Check it redirects to sign-in
    const redirectUrl = expectRedirectTo(response, "/sign-in");
    expect(redirectUrl.searchParams.get("redirectedFrom")).toBe("/dashboard");
  });
});
```

## Testing API Routes

Testing API routes requires mocking the Next.js request and response objects:

```typescript
import { GET, POST } from "@/app/api/example/route";
import { createMockRequest } from "../helpers";

describe("Example API", () => {
  test("GET returns data", async () => {
    const request = createMockRequest("/api/example");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(
      expect.objectContaining({
        success: true,
      })
    );
  });
});
```

## Testing Components

Use React Testing Library to test React components:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/auth/login-form';

describe('LoginForm', () => {
  test('submits with email and password', async () => {
    const mockOnSubmit = jest.fn();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check the onSubmit was called with correct values
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

## Mock Files

The `src/tests/mocks` directory contains mock implementations used across tests:

- `next-server.ts`: Mocks for Next.js server components
- Add more mock files as needed for other dependencies

## Test Helpers

The `src/tests/helpers.ts` file contains utility functions to simplify test setup:

- `createMockRequest`: Creates a mocked NextRequest
- `expectRedirectTo`: Checks if a response is a redirect to a specific path
- `createMockSession`: Creates a mock Supabase session object

## Best Practices

1. **Test in isolation**: Mock dependencies to test only the functionality of the specific component or function.
2. **Test behavior, not implementation**: Focus on what the code does, not how it does it.
3. **Use descriptive test names**: Tests should describe the expected behavior.
4. **Keep tests simple**: Each test should verify one specific behavior.
5. **Avoid testing third-party code**: Focus on testing your own code.

## Troubleshooting

### Common Issues

1. **"Request is not defined"**: Make sure your Jest setup includes mocks for global browser APIs.
2. **NextRequest/NextResponse errors**: Ensure you have proper mocks for Next.js server components.
3. **Module import errors**: Check that Jest moduleNameMapper is configured correctly for your aliases.

### Running Tests in Different Environments

Some tests may need a different environment:

```typescript
// In jest.config.ts
export default {
  projects: [
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      testMatch: ["**/components/**/*.test.tsx"],
    },
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: ["**/api/**/*.test.ts", "**/middleware.test.ts"],
    },
  ],
};
```

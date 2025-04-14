/**
 * Test Helpers
 * Utility functions for testing Next.js applications
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a mocked NextRequest for testing middleware
 * @param path The URL path (e.g., '/dashboard')
 * @param options Additional request options
 */
export function createMockRequest(
  path: string,
  options: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    method?: string;
  } = {}
) {
  // Create a simplified request manually instead of using the real NextRequest
  // This avoids issues with the NextRequest implementation
  const url = `https://example.com${path}`;

  // Create a request with minimal properties needed for tests
  const request = {
    url,
    nextUrl: {
      pathname: path,
      searchParams: new URLSearchParams(),
      toString: () => url,
    },
    cookies: {
      getAll: jest.fn().mockReturnValue(
        options.cookies
          ? Object.entries(options.cookies).map(([name, value]) => ({
              name,
              value,
            }))
          : []
      ),
      set: jest.fn(),
    },
    headers: new Map(options.headers ? Object.entries(options.headers) : []),
  } as unknown as NextRequest;

  return request;
}

/**
 * Checks if a response is a redirect to a specific path
 * @param response The NextResponse to check
 * @param expectedPath The expected redirect path
 */
export function expectRedirectTo(
  response: Response | NextResponse,
  expectedPath: string
) {
  expect(response.status).toBe(307); // Temporary redirect
  const locationHeader = response.headers.get("location");
  expect(locationHeader).toBeDefined();

  const redirectUrl = new URL(locationHeader || "");
  expect(redirectUrl.pathname).toBe(expectedPath);

  return redirectUrl; // Return the URL for further assertions if needed
}

/**
 * Creates a mock session object for testing
 * @param userId Optional user ID
 */
export function createMockSession(userId = "12345") {
  return {
    user: {
      id: userId,
      email: "test@example.com",
      role: "authenticated",
    },
    expires_at: Date.now() + 3600,
  };
}

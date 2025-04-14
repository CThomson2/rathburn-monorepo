/**
 * Middleware Authentication Tests
 *
 * These tests check that the authentication middleware is working correctly.
 * They verify that:
 * 1. Public routes are accessible without authentication
 * 2. Protected routes redirect to sign-in when not authenticated
 * 3. Auth routes redirect to dashboard when already authenticated
 */

import { NextRequest, NextResponse } from "next/server";
import { middleware } from "../middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { createMockRequest } from "./helpers";

// Mock the updateSession function from lib/supabase
jest.mock("@/lib/supabase/middleware", () => ({
  updateSession: jest.fn(),
}));

// Mock next/server
jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  // Create the mock function for redirect
  const mockRedirectFn = jest.fn().mockImplementation((url) => ({
    status: 307,
    headers: new Headers({ location: url.toString() }),
  }));

  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      redirect: mockRedirectFn,
      next: jest.fn().mockReturnValue({
        cookies: {
          set: jest.fn(),
          setAll: jest.fn(),
          getAll: jest.fn().mockReturnValue([]),
        },
      }),
    },
  };
});

// Get a reference to the mocked redirect function for assertions
const mockRedirect = NextResponse.redirect as jest.Mock;

describe("Middleware Authentication", () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.resetAllMocks();
    mockRedirect.mockClear();
  });

  test("Public routes should be accessible without authentication", async () => {
    // Mock a request to a public route
    const request = createMockRequest("/sign-in");

    // Mock the updateSession function to return no session
    const mockResponse = NextResponse.next();
    (updateSession as jest.Mock).mockResolvedValue({
      response: mockResponse,
      session: null,
    });

    // Call the middleware
    const result = await middleware(request);

    // Verify the middleware just returns the original response
    expect(result).toBe(mockResponse);
    expect(updateSession).toHaveBeenCalledWith(request);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  test("Protected routes should redirect to sign-in when not authenticated", async () => {
    // Mock a request to a protected route
    const request = createMockRequest("/dashboard");

    // Mock the updateSession function to return no session
    const mockResponse = NextResponse.next();
    (updateSession as jest.Mock).mockResolvedValue({
      response: mockResponse,
      session: null,
    });

    // Call the middleware
    await middleware(request);

    // Verify NextResponse.redirect was called with the correct URL
    expect(mockRedirect).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/sign-in",
        searchParams: expect.any(URLSearchParams),
      })
    );
  });

  test("Auth routes should redirect to dashboard when authenticated", async () => {
    // Mock a request to an auth route
    const request = createMockRequest("/sign-in");

    // Mock the updateSession function to return a session
    const mockResponse = NextResponse.next();
    (updateSession as jest.Mock).mockResolvedValue({
      response: mockResponse,
      session: { user: { id: "123" } },
    });

    // Call the middleware
    await middleware(request);

    // Verify NextResponse.redirect was called with the correct URL
    expect(mockRedirect).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/dashboard",
      })
    );
  });
});

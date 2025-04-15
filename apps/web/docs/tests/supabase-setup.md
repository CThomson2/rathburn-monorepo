# Supabase Authentication Setup and Testing Guide

This document outlines the standardized Supabase configuration for authentication in the application, explaining how to test that it's working correctly.

## Directory Structure

All Supabase configuration files are standardized in the `src/lib/supabase` directory:

- `client.ts` - Browser client for client components
- `server.ts` - Server client for server components
- `middleware.ts` - Session handling for Next.js middleware
- `client-auth.ts` - React hooks for auth state and operations

## Authentication Flow

1. Users sign in through the login page (`/sign-in`)
2. Supabase authenticates and creates a session
3. Middleware checks this session on each request
4. Protected routes redirect to sign-in if no session exists
5. Auth routes redirect to dashboard if already signed in

## Testing the Middleware Authentication

### Automated Testing

Run the middleware tests with:

```bash
npm test src/tests/middleware.test.ts
```

The tests verify:

- Public routes are accessible without authentication
- Protected routes redirect to sign-in when not authenticated
- Auth routes redirect to dashboard when already authenticated

### Manual Testing

To manually test the authentication flow:

1. **Test Unauthenticated Access**:

   - Open an incognito/private browser window
   - Try accessing a protected route (e.g., `/dashboard`)
   - Verify you're redirected to `/sign-in` with a `redirectedFrom` query parameter

2. **Test Authentication**:

   - Sign in with valid credentials
   - Verify you're redirected to the dashboard
   - Try accessing an auth route (e.g., `/sign-in`)
   - Verify you're redirected back to the dashboard

3. **Test Session Persistence**:

   - After signing in, close and reopen the browser
   - Try accessing a protected route
   - Verify you still have access without needing to sign in again

4. **Test Sign Out**:
   - Sign out of the application
   - Try accessing a protected route
   - Verify you're redirected to sign-in

## Debugging Authentication Issues

If authentication isn't working as expected:

1. **Check Browser Console**:

   - Look for any errors related to Supabase or auth

2. **Check Network Requests**:

   - Examine auth-related API calls in the Network tab
   - Verify the responses from Supabase auth endpoints

3. **Check Cookies**:

   - Examine the `sb-` cookies in the browser's Application tab
   - Verify the access token is being set correctly

4. **Enable Debug Logs**:
   Add this to the middleware to debug the auth flow:

   ```typescript
   console.log({
     path: request.nextUrl.pathname,
     hasSession: !!session,
     isAuthRoute,
     action:
       !session && !isAuthRoute
         ? "redirect-to-login"
         : session && isAuthRoute
           ? "redirect-to-dashboard"
           : "proceed",
   });
   ```

## Environment Variables

Ensure these environment variables are set:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without these, authentication will fail.

## Common Issues and Solutions

1. **"No session found" errors**:

   - Check that cookies are being properly set and not blocked
   - Verify the auth redirect URL is configured correctly in Supabase

2. **Middleware not running**:

   - Check the matcher configuration in `middleware.ts`
   - Ensure the path you're testing is included in the matcher

3. **Auth state mismatch**:
   - Clear browser cookies and local storage
   - Sign out and sign in again to reset the auth state

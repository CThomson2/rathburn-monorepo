/**
 * DEPRECATED: This file contains legacy user authentication code that used Prisma.
 * 
 * The application now uses Supabase authentication.
 * 
 * For auth functionality, use:
 * - Server-side: Import createClient from "@/lib/supabase/server"
 * - Client-side: Import useAuth from "@/hooks/use-auth"
 * 
 * @see /src/lib/supabase/client-auth.ts - Core client auth functionality
 * @see /src/hooks/use-auth.ts - React hook for authentication
 * @see /src/app/actions.ts - Server actions for auth flows
 */

// This file is kept as a placeholder to document the migration
// and prevent import errors in case there are references we missed.
export type UserInput = {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role?: string;
};

// Empty implementation to avoid runtime errors if this is still referenced
export const queries = {
  getUser: async () => null,
  findUserByEmail: async () => null,
  findUserById: async () => null,
  findUserWithPasswordByEmail: async () => null,
  createUser: async () => ({ 
    id: "", 
    email: "", 
    firstName: "", 
    lastName: "", 
    role: "USER", 
    createdAt: Date.now() 
  }),
  getUserCount: async () => 0,
  createSession: async () => {},
  invalidateSession: async () => {},
  findSessionByToken: async () => null,
  cleanupExpiredSessions: async () => 0,
};

// Export empty functions that use the queries
export async function findUserByEmail() {
  return null;
}

export async function findUserById() {
  return null;
}

export async function findUserWithPasswordByEmail() {
  return null;
}

export async function createUser() {
  return { 
    id: "", 
    email: "", 
    firstName: "", 
    lastName: "", 
    role: "USER", 
    createdAt: Date.now() 
  };
}

export async function getUserCount() {
  return 0;
}

export async function createSession() {
  return;
}

export async function invalidateSession() {
  return;
}

export async function findSessionByToken() {
  return null;
}

export async function cleanupExpiredSessions() {
  return 0;
}
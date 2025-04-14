/**
 * Prisma client singleton and helper functions
 *
 * This file provides a consistent pattern for using the Prisma client
 * across the application.
 */

import { PrismaClient } from "@prisma/client";

// Create a singleton instance of PrismaClient
// This avoids creating too many connections in development
let prisma: PrismaClient;

// Instantiate PrismaClient if it doesn't exist already
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to avoid creating multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

/**
 * Type definition for a database operation callback function
 */
export type DatabaseOperationCallback<T> = (db: PrismaClient) => Promise<T>;

/**
 * Executes a database operation with proper connection handling.
 * This provides a consistent pattern for Prisma client usage and error handling.
 *
 * @example
 * const users = await withDatabase(async (prisma) => {
 *   return await prisma.user.findMany();
 * });
 */
export const withDatabase = async <T>(
  operation: DatabaseOperationCallback<T>
): Promise<T> => {
  try {
    // Execute the provided operation with the PrismaClient instance
    return await operation(prisma);
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
};

// Export the PrismaClient for direct use
export { prisma, PrismaClient };

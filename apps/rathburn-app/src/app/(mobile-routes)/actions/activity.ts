"use server";

import { queries as q } from "@/database/models/activity/queries";

/**
 * Server action to fetch recent activity/transactions
 * Used in the mobile dashboard to display recent activity
 */
export async function getRecentActivity(limit: number = 3) {
  try {
    // Fetch transactions from the database using the repository function
    const result = await q.getTransactions(1, limit);

    return {
      success: true,
      data: result.rows,
      total: result.total,
    };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return {
      success: false,
      error: "Failed to fetch activity data",
    };
  }
}

/**
 * Server action to fetch paginated transactions for infinite scrolling
 * Used in the full activity view
 */
export async function getMoreActivity(page: number = 1, limit: number = 10) {
  try {
    // Fetch transactions from the database
    const result = await q.getTransactions(page, limit);

    return {
      success: true,
      data: result.rows,
      total: result.total,
      hasMore: page * limit < result.total,
    };
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return {
      success: false,
      error: "Failed to fetch activity data",
    };
  }
}

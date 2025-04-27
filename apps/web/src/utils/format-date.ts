/**
 * Formats a date string into a more readable format
 *
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "25 Nov, 2024")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "-";

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month}, ${year}`;
}

/**
 * Formats a date object into a more readable format
 *
 * @param date - The date object to format
 * @returns Formatted date string (e.g., "25 Nov, 2024 12:00 AM")
 */
export function formatDateTime(date: Date): string {
  // Use Intl.DateTimeFormat for consistent formatting across server/client
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Explicitly set hour12 to ensure consistency
  }).format(date);
}

/**
 * Formats a date object consistently between server and client
 * to avoid hydration errors
 *
 * @param date - Date object or string to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateForTable(date: Date | string | null): string {
  if (!date) return "-";

  // Convert to Date object if it's a string
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "-";
  }

  // Use the Intl.DateTimeFormat for consistent formatting
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

/**
 * Formats a date object into a more readable format for purchase orders
 * PO Numbers use the format YYYYMMDD$1$2, where $1 is the letter representing
 *  the N'th order made today, and $2 is the two letter initials of the manager
 *  placing the order.
 * E.g. 20250101ARS for the first order made by Roddy Stuart on 2025-01-01
 * @param date - The date object to format
 * @returns Formatted date string in DD-MM-YY format
 */
export function formatDateYYYYMMDD(date: Date = new Date()): string {

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and resolves Tailwind conflicts.
 * Used by every component instead of raw template strings.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a timestamp into a human-readable relative date string.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago", "Jan 15"
 */
export function formatRelativeDate(timestamp) {
  if (!timestamp) return "";

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // For older dates, show actual date
  const date = new Date(timestamp);
  const nowDate = new Date(now);

  if (date.getFullYear() === nowDate.getFullYear()) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

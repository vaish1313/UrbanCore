/**
 * Status color & category utility for Citizen Complaints in the Municipal Dashboard.
 *
 * Requirements:
 * - New / Submitted / Mark for Review: AMBER (#F59E0B)
 * - Under Review: BLUE (#3B82F6)
 * - Action Taken: PURPLE (#8B5CF6)
 * - Closed / Resolved / Completed: GREEN (#16A34A)
 * - Unexpected / unknown statuses: Neutral fallback slate (#94A3B8)
 */

export type ComplaintCategory = "new" | "under_review" | "action_taken" | "closed" | "unknown";

export interface ComplaintStatusMeta {
  category: ComplaintCategory;
  label: string;
  color: string;
  dotColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export function getComplaintStatusMeta(rawStatus: string | null | undefined): ComplaintStatusMeta {
  const s = (rawStatus || "").trim().toLowerCase();

  // AMBER: New / Submitted / Mark for Review
  if (
    s === "new" ||
    s === "submitted" ||
    s === "mark for review" ||
    s === "pending" ||
    s === "pending review"
  ) {
    return {
      category: "new",
      label: rawStatus || "New",
      color: "#F59E0B",
      dotColor: "#F59E0B",
      badgeBg: "rgba(245, 158, 11, 0.12)",
      badgeBorder: "rgba(245, 158, 11, 0.35)",
    };
  }

  // BLUE: Under Review
  if (s === "under review" || s === "under_review" || s === "reviewed") {
    return {
      category: "under_review",
      label: rawStatus || "Under Review",
      color: "#3B82F6",
      dotColor: "#3B82F6",
      badgeBg: "rgba(59, 130, 246, 0.12)",
      badgeBorder: "rgba(59, 130, 246, 0.35)",
    };
  }

  // PURPLE: Action Taken
  if (s === "action taken" || s === "action_taken" || s === "notice_issued" || s === "notice issued") {
    return {
      category: "action_taken",
      label: rawStatus || "Action Taken",
      color: "#8B5CF6",
      dotColor: "#8B5CF6",
      badgeBg: "rgba(139, 92, 246, 0.12)",
      badgeBorder: "rgba(139, 92, 246, 0.35)",
    };
  }

  // GREEN: Closed / Resolved / Completed
  if (
    s === "closed" ||
    s === "resolved" ||
    s === "completed"
  ) {
    return {
      category: "closed",
      label: rawStatus || "Closed",
      color: "#16A34A",
      dotColor: "#16A34A",
      badgeBg: "rgba(22, 163, 74, 0.12)",
      badgeBorder: "rgba(22, 163, 74, 0.35)",
    };
  }

  // Fallback: Neutral
  return {
    category: "unknown",
    label: rawStatus || "Unknown",
    color: "#94A3B8",
    dotColor: "#94A3B8",
    badgeBg: "rgba(148, 163, 184, 0.12)",
    badgeBorder: "rgba(148, 163, 184, 0.35)",
  };
}

/**
 * Coordinate validation:
 * - Must be valid numbers and finite
 * - Must adhere to WGS84 bounds (lat: [-90, 90], lng: [-180, 180])
 * - Must not be zero/zero default
 */
export function isValidComplaintCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined,
): lat is number {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return false;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  // Reject 0, 0
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
    return false;
  }
  return true;
}

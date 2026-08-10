export function ticketCode(id: number): string {
  return `RDB-${id}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3.6e6) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 8.64e7) return `${Math.floor(diff / 3.6e6)}h ago`;
  if (diff < 6.048e8) return `${Math.floor(diff / 8.64e7)}d ago`;
  // Locale-independent so server and client render identically (avoids hydration mismatch).
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Duration in hours between two ISO timestamps, or null. */
export function hoursBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3.6e6;
}

import type { Status, Priority } from "./types";

export const STATUS: Record<Status, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  in_progress: { label: "In Progress (WIP)", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  on_hold: { label: "On Hold", cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  resolved: { label: "Resolved", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  closed: { label: "Closed", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
};

export const PRIORITY: Record<Priority, { label: string; cls: string; dot: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-500/15 text-red-300 border-red-500/30", dot: "bg-red-400" },
  high: { label: "High", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
  medium: { label: "Medium", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", dot: "bg-yellow-400" },
  low: { label: "Low", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", dot: "bg-slate-400" },
};

export const CATEGORIES = [
  "Managed IT",
  "Surveillance / Cameras",
  "Access Control & Alarms",
  "Network / Cabling",
  "Audio / AV",
  "Other",
];

export const STATUS_KEYS = Object.keys(STATUS) as Status[];
export const PRIORITY_KEYS = Object.keys(PRIORITY) as Priority[];

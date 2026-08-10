import type { Status, Priority } from "./types";

export const STATUS: Record<Status, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-[#e8f0fe] text-vibrant-blue border-[#d2e3fc]" },
  in_progress: { label: "In Progress", cls: "bg-[#fef7e0] text-[#b06000] border-[#fce8b2]" },
  on_hold: { label: "On Hold", cls: "bg-[#f3e8fd] text-[#7e22ce] border-[#e9d5ff]" },
  resolved: { label: "Resolved", cls: "bg-[#e6f4ea] text-[#137333] border-[#ceead6]" },
  closed: { label: "Closed", cls: "bg-surface-container-high text-slate-gray border-outline-variant" },
};

export const PRIORITY: Record<Priority, { label: string; cls: string; dot: string }> = {
  urgent: { label: "Urgent", cls: "bg-[#fce8e6] text-[#c5221f] border-[#f5c6c2]", dot: "bg-[#c5221f]" },
  high: { label: "High", cls: "bg-[#fef0e6] text-[#b45309] border-[#fcd9b6]", dot: "bg-[#b45309]" },
  medium: { label: "Medium", cls: "bg-[#fef7e0] text-[#b06000] border-[#fce8b2]", dot: "bg-[#b06000]" },
  low: { label: "Low", cls: "bg-surface-container-high text-slate-gray border-outline-variant", dot: "bg-slate-gray" },
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

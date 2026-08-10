import type { Profile, Role } from "./types";

type StaffRow = { id: string; full_name: string | null; role: Role };

/**
 * Merges full profile rows (which clients only receive for themselves) with the
 * names-only staff_directory (visible to everyone). Result: names always
 * resolve, but clients never receive staff emails/phones.
 */
export function mergeDirectory(profiles: Profile[] | null, staff: StaffRow[] | null): Profile[] {
  const byId: Record<string, Profile> = {};
  (staff ?? []).forEach((s) => {
    byId[s.id] = {
      id: s.id,
      full_name: s.full_name,
      role: s.role,
      email: null,
      company_id: null,
      phone: null,
    };
  });
  // Full rows overwrite the name-only stubs where the viewer is allowed to see them.
  (profiles ?? []).forEach((p) => {
    byId[p.id] = p;
  });
  return Object.values(byId);
}

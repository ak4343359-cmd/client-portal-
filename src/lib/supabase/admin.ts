import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. NEVER import this into a client component.
 * Only used inside admin-guarded server actions (see team/actions.ts).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

type Result = { error?: string; message?: string } | null;

/** Throws unless the caller is a signed-in admin. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();
  if (me?.role !== "admin") throw new Error("Admins only.");
  return user.id;
}

export async function addEmployee(_prev: unknown, formData: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "agent") as Role;

    if (!email) return { error: "Email is required." };
    if (password.length < 6) return { error: "Temporary password must be at least 6 characters." };
    if (role !== "agent" && role !== "admin") return { error: "Role must be agent or admin." };

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) return { error: error.message };

    // Ensure the profile exists with the chosen staff role (trigger defaults to 'client').
    const { error: e2 } = await admin
      .from("profiles")
      .upsert({ id: data.user!.id, email, full_name: fullName || email, role });
    if (e2) return { error: e2.message };

    revalidatePath("/team");
    return { message: `Added ${email} as ${role}. Share the temporary password so they can sign in.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function setRole(userId: string, role: Role) {
  await requireAdmin();
  // Without the service role key, role changes are disabled (the Team page shows a warning).
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/team");
}

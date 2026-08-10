"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; message?: string } | null;

async function roleOf(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<{ role: string }>();
  return data?.role ?? null;
}

/** Client sign-in. Rejects staff accounts (they must use the Employee tab). */
export async function signInClient(_prev: unknown, formData: FormData): Promise<Result> {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const role = await roleOf(data.user!.id);
  if (role === "agent" || role === "admin") {
    await supabase.auth.signOut();
    return { error: "This is a staff account. Please use the Employee sign-in." };
  }
  redirect("/tickets");
}

/** Client self-registration. Always creates a plain client account. */
export async function signUpClient(_prev: unknown, formData: FormData): Promise<Result> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, a session is returned → go straight in.
  if (data.session) redirect("/tickets");
  return { message: "Account created! Check your email to confirm, then sign in." };
}

/**
 * Employee/admin sign-in. No sign-up path exists — accounts are provisioned by
 * RDB IT directly in the database. Any account that is not agent/admin is rejected.
 */
export async function signInEmployee(_prev: unknown, formData: FormData): Promise<Result> {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const role = await roleOf(data.user!.id);
  if (role !== "agent" && role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Not an employee account. If you're a client, use the Client sign-in." };
  }
  redirect("/tickets");
}

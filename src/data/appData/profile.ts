import { supabase } from "../../lib/supabase";
import type { AppUser, ProfileRow } from "../types";

export async function ensureProfileRow(user: {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string; role?: string };
  created_at?: string;
}) {
  const fallbackName =
    user.user_metadata?.name || user.email?.split("@")[0] || "Student";

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle<Pick<ProfileRow, "id" | "role">>();

  if (existingError) {
    return existingError;
  }

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      name: fallbackName,
      email: user.email ?? null,
      bio: null,
      has_tutorial: false,
      role: (user.user_metadata?.role as AppUser["role"]) ?? "student",
      active: true,
      created_at: user.created_at ?? new Date().toISOString(),
    });
    return error;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: fallbackName, email: user.email ?? null, active: true })
    .eq("id", user.id);

  return error;
}

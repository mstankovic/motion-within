import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

export const admin = createClient<Database>(url, secretKey, { auth: { persistSession: false } });

export type UserClient = SupabaseClient<Database> & { userId: string };

/** Creates a confirmed user through the Auth admin API and returns a signed-in client. */
export async function createUser(meta: Record<string, unknown> = {}): Promise<UserClient> {
  const email = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  const password = "password123";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw error;
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return Object.assign(client, { userId: data.user.id });
}

/** A user with the starter program activated and one scheduled workout for Day A. */
export async function userWithScheduledWorkout() {
  const user = await createUser();
  const { data: programId, error } = await user.rpc("create_starter_program", {
    p_weekdays: [1, 3, 5],
    p_activate: true,
  });
  if (error) throw error;
  const { data: dayA } = await user
    .from("program_days")
    .select("id, title")
    .eq("program_id", programId!)
    .eq("day_index", 0)
    .single();
  const { data: scheduled, error: sErr } = await user
    .from("scheduled_workouts")
    .insert({
      owner_id: user.userId,
      program_day_id: dayA!.id,
      planned_date: "2026-09-28",
      title: dayA!.title,
    })
    .select("id")
    .single();
  if (sErr) throw sErr;
  return { user, programId: programId!, dayId: dayA!.id, scheduledId: scheduled.id };
}

import { describe, expect, it } from "vitest";
import { admin, createUser, userWithScheduledWorkout } from "./utils";
import { regenerateSuggestions } from "@/features/progression/generate";

describe("registration", () => {
  it("creates a profile and notification preferences from the trusted auth row", async () => {
    const user = await createUser({ display_name: "Ana", locale: "en" });
    const { data: profile } = await user.from("profiles").select("*").single();
    expect(profile).toMatchObject({
      id: user.userId,
      display_name: "Ana",
      locale: "en",
      timezone: "Europe/Podgorica",
    });
    const { data: prefs } = await user.from("notification_preferences").select("*").single();
    expect(prefs).toMatchObject({
      owner_id: user.userId,
      workout_reminders_enabled: false,
      default_reminder_minutes_before: 60,
    });
  });

  it("falls back to Serbian for unsupported locales", async () => {
    const user = await createUser({ locale: "de" });
    const { data } = await user.from("profiles").select("locale").single();
    expect(data?.locale).toBe("sr");
  });
});

describe("row level security", () => {
  it("isolates every private table between users", async () => {
    const { user: a, scheduledId } = await userWithScheduledWorkout();
    const { data: sessionId } = await a.rpc("start_session", {
      p_scheduled_workout_id: scheduledId,
    });
    await a
      .from("body_measurements")
      .insert({ owner_id: a.userId, measured_on: "2026-09-28", weight_kg: 80 });

    const b = await createUser();
    for (const table of [
      "programs",
      "program_days",
      "workout_blocks",
      "block_exercises",
      "scheduled_workouts",
      "workout_sessions",
      "session_exercises",
      "session_sets",
      "body_measurements",
      "notification_preferences",
    ] as const) {
      const { data, error } = await b.from(table).select("*");
      expect(error, table).toBeNull();
      expect(data, table).toHaveLength(table === "notification_preferences" ? 1 : 0);
    }

    const { data: aProfile } = await b.from("profiles").select("*").eq("id", a.userId);
    expect(aProfile).toHaveLength(0);

    // Writes into A's data are rejected or affect nothing.
    const { data: aExercise } = await admin
      .from("session_exercises")
      .select("id")
      .eq("session_id", sessionId!)
      .limit(1)
      .single();
    const insert = await b
      .from("session_sets")
      .insert({ session_exercise_id: aExercise!.id, set_number: 99 });
    expect(insert.error).not.toBeNull();

    const update = await b
      .from("workout_sessions")
      .update({ notes: "hacked" })
      .eq("id", sessionId!)
      .select();
    expect(update.data).toHaveLength(0);

    const start = await b.rpc("start_session", { p_scheduled_workout_id: scheduledId });
    expect(start.error?.message).toContain("scheduled_workout_not_found");

    const { data: session } = await admin
      .from("workout_sessions")
      .select("notes")
      .eq("id", sessionId!)
      .single();
    expect(session?.notes).toBeNull();
  });

  it("keeps system exercises read-only", async () => {
    const user = await createUser();
    const { data: system } = await user
      .from("exercises")
      .select("id")
      .eq("source", "system")
      .limit(1)
      .single();
    expect(system).toBeTruthy();

    const update = await user
      .from("exercises")
      .update({ name_en: "x" })
      .eq("id", system!.id)
      .select();
    expect(update.data).toHaveLength(0);

    const insert = await user.from("exercises").insert({
      source: "system",
      slug: "evil",
      name_sr: "x",
      name_en: "x",
      tracking_mode: "reps",
    });
    expect(insert.error).not.toBeNull();

    const del = await user.from("exercises").delete().eq("id", system!.id).select();
    expect(del.data).toHaveLength(0);

    const { data: copyId, error } = await user.rpc("copy_exercise", {
      p_exercise_id: system!.id,
      p_locale: "sr",
    });
    expect(error).toBeNull();
    const { data: copy } = await user
      .from("exercises")
      .select("owner_id, source, custom_name")
      .eq("id", copyId!)
      .single();
    expect(copy).toMatchObject({ owner_id: user.userId, source: "user" });
  });

  it("does not let a user schedule someone else's program day", async () => {
    const { dayId } = await userWithScheduledWorkout();
    const b = await createUser();
    const { error } = await b.from("scheduled_workouts").insert({
      owner_id: b.userId,
      program_day_id: dayId,
      planned_date: "2026-09-29",
      title: "x",
    });
    expect(error).not.toBeNull();
  });
});

describe("programs", () => {
  it("activating a program deactivates the previous one", async () => {
    const { user, programId } = await userWithScheduledWorkout();
    const { data: copyId } = await user.rpc("copy_program", {
      p_program_id: programId,
      p_name: "Copy",
    });
    expect(
      (await user.from("programs").select("is_active").eq("id", copyId!).single()).data?.is_active,
    ).toBe(false);

    await user.rpc("activate_program", { p_program_id: copyId! });
    const { data } = await user.from("programs").select("id, is_active");
    expect(data!.filter((p) => p.is_active).map((p) => p.id)).toEqual([copyId]);
  });

  it("rejects an inverted rep range", async () => {
    const { user, dayId } = await userWithScheduledWorkout();
    const { data: block } = await user
      .from("workout_blocks")
      .select("id")
      .eq("program_day_id", dayId)
      .limit(1)
      .single();
    const { data: ex } = await user.from("exercises").select("id").eq("slug", "push_up").single();
    const { error } = await user.from("block_exercises").insert({
      workout_block_id: block!.id,
      exercise_id: ex!.id,
      sort_order: 9,
      target_reps_min: 12,
      target_reps_max: 8,
    });
    expect(error?.message).toContain("block_exercises_reps_range");
  });
});

describe("sessions", () => {
  it("snapshots the plan when starting and is idempotent", async () => {
    const { user, scheduledId, dayId } = await userWithScheduledWorkout();
    const { data: id1 } = await user.rpc("start_session", { p_scheduled_workout_id: scheduledId });
    const { data: id2 } = await user.rpc("start_session", { p_scheduled_workout_id: scheduledId });
    expect(id2).toBe(id1);

    const { data: planned } = await user
      .from("block_exercises")
      .select("id, target_sets, workout_blocks!inner(program_day_id, block_type, rounds)")
      .eq("workout_blocks.program_day_id", dayId);
    const { data: snap } = await user
      .from("session_exercises")
      .select("*, session_sets(count)")
      .eq("session_id", id1!);
    expect(snap).toHaveLength(planned!.length);
    for (const p of planned!) {
      const s = snap!.find((x) => x.source_block_exercise_id === p.id)!;
      const expected =
        p.workout_blocks.block_type === "circuit" ? p.workout_blocks.rounds : p.target_sets;
      expect(s.session_sets[0].count).toBe(expected);
      expect(s.exercise_name_snapshot).toBeTruthy();
    }
    expect(
      (await user.from("scheduled_workouts").select("status").eq("id", scheduledId).single()).data
        ?.status,
    ).toBe("in_progress");
  });

  it("completing updates the calendar, and later program edits do not change history", async () => {
    const { user, scheduledId } = await userWithScheduledWorkout();
    const { data: sessionId } = await user.rpc("start_session", {
      p_scheduled_workout_id: scheduledId,
    });
    await user
      .from("workout_sessions")
      .update({ status: "completed", session_rpe: 6 })
      .eq("id", sessionId!);

    const { data: sched } = await user
      .from("scheduled_workouts")
      .select("status")
      .eq("id", scheduledId)
      .single();
    expect(sched?.status).toBe("completed");
    const { data: s } = await user
      .from("workout_sessions")
      .select("completed_at")
      .eq("id", sessionId!)
      .single();
    expect(s?.completed_at).toBeTruthy();

    const { data: before } = await user
      .from("session_exercises")
      .select("id, source_block_exercise_id, target_sets_snapshot, exercise_name_snapshot")
      .eq("session_id", sessionId!);
    const target = before!.find((x) => x.source_block_exercise_id)!;
    await user
      .from("block_exercises")
      .update({ target_sets: 9 })
      .eq("id", target.source_block_exercise_id!);
    const { data: after } = await user
      .from("session_exercises")
      .select("target_sets_snapshot")
      .eq("id", target.id)
      .single();
    expect(after?.target_sets_snapshot).toBe(target.target_sets_snapshot);

    // A stale offline write can't reopen a completed session.
    const reopen = await user
      .from("workout_sessions")
      .update({ status: "in_progress" })
      .eq("id", sessionId!);
    expect(reopen.error?.message).toContain("session_already_completed");
  });
});

describe("progression suggestions", () => {
  async function completeTwice(painOnLatest: boolean) {
    const { user, programId } = await userWithScheduledWorkout();
    const { data: dayB } = await user
      .from("program_days")
      .select("id, title")
      .eq("program_id", programId)
      .eq("day_index", 1)
      .single();
    // Band row is in day A; use it: 3 sets, 10–12 reps.
    let lastSession = "";
    for (const [i, date] of ["2026-09-21", "2026-09-24"].entries()) {
      const { data: sw } = await user
        .from("scheduled_workouts")
        .insert({
          owner_id: user.userId,
          program_day_id: dayB!.id,
          planned_date: date,
          title: dayB!.title,
        })
        .select("id")
        .single();
      const { data: sid } = await user.rpc("start_session", { p_scheduled_workout_id: sw!.id });
      await admin
        .from("workout_sessions")
        .update({ started_at: `${date}T10:00:00Z` })
        .eq("id", sid!);
      const { data: row } = await user
        .from("session_exercises")
        .select("id")
        .eq("session_id", sid!)
        .eq("exercise_name_snapshot", "Iskorak unazad")
        .single();
      await user
        .from("session_sets")
        .update({ reps: 10, rpe: 6, completed: true })
        .eq("session_exercise_id", row!.id);
      await user
        .from("session_exercises")
        .update({ status: "completed", pain_flag: painOnLatest && i === 1 })
        .eq("id", row!.id);
      await user.from("workout_sessions").update({ status: "completed" }).eq("id", sid!);
      lastSession = sid!;
    }
    await regenerateSuggestions(user, user.userId, lastSession);
    const { data } = await user
      .from("progression_suggestions")
      .select("suggestion_type, reason_code, status");
    return data!;
  }

  it("suggests more reps after two sessions at the top of the range", async () => {
    const suggestions = await completeTwice(false);
    expect(suggestions).toContainEqual(
      expect.objectContaining({
        suggestion_type: "increase_reps",
        reason_code: "double_progression",
        status: "pending",
      }),
    );
  });

  it("does not generate a suggestion when pain was reported", async () => {
    const suggestions = await completeTwice(true);
    expect(suggestions.filter((s) => s.suggestion_type === "increase_reps")).toHaveLength(0);
  });
});

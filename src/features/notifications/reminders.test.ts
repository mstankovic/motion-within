import { describe, expect, it } from "vitest";
import {
  dueAt,
  inQuietHours,
  shouldSend,
  type ReminderPrefs,
} from "../../../supabase/functions/_shared/reminders";

const prefs: ReminderPrefs = {
  timeZone: "Europe/Podgorica",
  minutesBefore: 60,
  defaultWorkoutTime: "18:00",
  quietStart: null,
  quietEnd: null,
};
const workout = {
  scheduledWorkoutId: "w",
  plannedDate: "2026-09-28",
  plannedTime: null,
  reminderAt: null,
};

describe("reminder rules", () => {
  it("is due N minutes before the workout time in the user's zone", () => {
    expect(dueAt(workout, prefs).toISOString()).toBe("2026-09-28T15:00:00.000Z");
    expect(dueAt({ ...workout, plannedTime: "07:30:00" }, prefs).toISOString()).toBe(
      "2026-09-28T04:30:00.000Z",
    );
  });

  it("sends only inside the window after the due time", () => {
    expect(shouldSend(workout, prefs, new Date("2026-09-28T14:59:00Z")).send).toBe(false);
    expect(shouldSend(workout, prefs, new Date("2026-09-28T15:05:00Z")).send).toBe(true);
    expect(shouldSend(workout, prefs, new Date("2026-09-28T17:30:00Z")).send).toBe(false);
  });

  it("respects quiet hours, including ranges across midnight", () => {
    const quiet = { ...prefs, quietStart: "22:00", quietEnd: "07:00" };
    expect(inQuietHours(new Date("2026-09-28T21:30:00Z"), quiet)).toBe(true); // 23:30 local
    expect(inQuietHours(new Date("2026-09-28T04:30:00Z"), quiet)).toBe(true); // 06:30 local
    expect(inQuietHours(new Date("2026-09-28T10:00:00Z"), quiet)).toBe(false);
  });
});

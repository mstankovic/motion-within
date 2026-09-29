import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  formatIsoDate,
  formatNumber,
  isIsoDate,
  isoWeekday,
  startOfWeek,
  todayInTimeZone,
  weekDates,
  zonedDateTimeToUtc,
} from ".";

describe("dates", () => {
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-09-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("28.09.2026")).toBe(false);
  });

  it("uses Monday as the first day of the week", () => {
    expect(isoWeekday("2026-09-28")).toBe(1);
    expect(isoWeekday("2026-10-04")).toBe(7);
    expect(startOfWeek("2026-10-04")).toBe("2026-09-28");
    expect(weekDates("2026-09-28")).toHaveLength(7);
    expect(weekDates("2026-09-28").at(-1)).toBe("2026-10-04");
  });

  it("adds days across month and DST boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(daysBetween("2026-09-01", "2026-09-15")).toBe(14);
  });

  it("computes today in a time zone", () => {
    const instant = new Date("2026-09-27T22:30:00Z");
    expect(todayInTimeZone("Europe/Podgorica", instant)).toBe("2026-09-28");
    expect(todayInTimeZone("America/New_York", instant)).toBe("2026-09-27");
  });

  it("converts a wall-clock time in a zone to UTC (summer and winter)", () => {
    expect(zonedDateTimeToUtc("2026-07-01", "18:00", "Europe/Podgorica").toISOString()).toBe(
      "2026-07-01T16:00:00.000Z",
    );
    expect(zonedDateTimeToUtc("2026-12-01", "18:00", "Europe/Podgorica").toISOString()).toBe(
      "2026-12-01T17:00:00.000Z",
    );
  });

  it("formats dates and numbers per locale (Serbian in Latin script)", () => {
    expect(formatIsoDate("2026-09-28", "sr", { day: "numeric", month: "long" })).toBe(
      "28. septembar",
    );
    expect(formatIsoDate("2026-09-28", "en", { day: "numeric", month: "long" })).toBe(
      "28 September",
    );
    expect(formatNumber(12.5, "sr")).toBe("12,5");
    expect(formatNumber(12.5, "en")).toBe("12.5");
  });
});

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  format,
  formatISO,
} from "date-fns";

export type DateRange = { from: Date; to: Date };
export type Granularity = "day" | "week" | "month" | "year";

export function presetRange(
  preset:
    | "today"
    | "yesterday"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "lastMonth"
    | "thisYear"
    | "last7"
    | "last30"
    | "last90"
): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "thisWeek":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "lastWeek": {
      const w = subWeeks(now, 1);
      return {
        from: startOfWeek(w, { weekStartsOn: 1 }),
        to: endOfWeek(w, { weekStartsOn: 1 }),
      };
    }
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastMonth": {
      const m = subMonths(now, 1);
      return { from: startOfMonth(m), to: endOfMonth(m) };
    }
    case "thisYear":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "last30":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "last90":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
  }
}

export const fmtDate = (d: Date | string) =>
  format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy");
export const fmtDateTime = (d: Date | string) =>
  format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy · HH:mm");
export const fmtShort = (d: Date | string) =>
  format(typeof d === "string" ? new Date(d) : d, "MMM d");
export const toISODate = (d: Date) => formatISO(d, { representation: "date" });

export function bucketKey(d: Date, g: Granularity): string {
  switch (g) {
    case "day":
      return format(d, "yyyy-MM-dd");
    case "week":
      return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-'W'II");
    case "month":
      return format(d, "yyyy-MM");
    case "year":
      return format(d, "yyyy");
  }
}

export function bucketLabel(key: string, g: Granularity): string {
  switch (g) {
    case "day":
      return format(new Date(key), "MMM d");
    case "week":
      return key;
    case "month":
      return format(new Date(`${key}-01`), "MMM yyyy");
    case "year":
      return key;
  }
}

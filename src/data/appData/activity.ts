import { formatShortDate, startOfDay } from "../../lib/format";
import type { ActivityPoint } from "../types";

export function buildEmptyActivity(): ActivityPoint[] {
  const start = startOfDay(new Date());
  return Array.from({ length: 30 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() - (29 - index));
    return { date: formatShortDate(day), reviews: 0 };
  });
}

export function addDaysISO(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

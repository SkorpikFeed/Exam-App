import { State } from "ts-fsrs";

import { addDays, formatShortDate, startOfDay } from "../lib/format";
import type { ActivityPoint, CardItem, ReviewLog } from "./types";

const DAY_MS = 86400000;

export function getCardsByDeck(deckId: string, cards: CardItem[]): CardItem[] {
  return cards.filter((card) => card.deckId === deckId);
}

export function getDueCards(cards: CardItem[], now = new Date()): CardItem[] {
  return cards.filter((card) => card.fsrs.due.getTime() <= now.getTime());
}

export function getUpcomingSchedule(
  cards: CardItem[],
  days = 7,
  now = new Date(),
) {
  const start = startOfDay(now);
  return Array.from({ length: days + 1 }).map((_, index) => {
    const day = addDays(start, index);
    const count = cards.filter(
      (card) => startOfDay(card.fsrs.due).getTime() === day.getTime(),
    ).length;
    return {
      date: formatShortDate(day),
      count,
      day,
    };
  });
}

export function getDeckStats(
  deckId: string,
  cards: CardItem[],
  now = new Date(),
) {
  const deckCards = cards.filter((card) => card.deckId === deckId);
  const dueToday = deckCards.filter(
    (card) => card.fsrs.due.getTime() <= now.getTime(),
  ).length;
  const newCount = deckCards.filter(
    (card) => card.fsrs.state === State.New,
  ).length;
  const learningCount = deckCards.filter(
    (card) =>
      card.fsrs.state === State.Learning ||
      card.fsrs.state === State.Relearning,
  ).length;
  const reviewCount = deckCards.filter(
    (card) => card.fsrs.state === State.Review,
  ).length;

  return {
    deckId,
    total: deckCards.length,
    dueToday,
    newCount,
    learningCount,
    reviewCount,
  };
}

export function getWeakCards(cards: CardItem[], limit = 5): CardItem[] {
  return [...cards]
    .sort((a, b) => {
      if (b.lapses === a.lapses) {
        return b.reps - a.reps;
      }
      return b.lapses - a.lapses;
    })
    .slice(0, limit);
}

export function buildActivitySeries(
  logs: ReviewLog[],
  days = 30,
): ActivityPoint[] {
  const start = addDays(startOfDay(new Date()), -(days - 1));
  const bucket = new Map<string, number>();

  for (const log of logs) {
    const dayKey = startOfDay(log.reviewedAt).toISOString();
    bucket.set(dayKey, (bucket.get(dayKey) ?? 0) + 1);
  }

  return Array.from({ length: days }).map((_, index) => {
    const day = addDays(start, index);
    const dayKey = startOfDay(day).toISOString();
    return {
      date: formatShortDate(day),
      reviews: bucket.get(dayKey) ?? 0,
    };
  });
}

export function buildRetentionSeries(logs: ReviewLog[], weeks = 12) {
  const start = addDays(startOfDay(new Date()), -(weeks * 7 - 1));
  const buckets = Array.from({ length: weeks }, () => ({ total: 0, good: 0 }));

  for (const log of logs) {
    const diff = Math.floor(
      (startOfDay(log.reviewedAt).getTime() - start.getTime()) / DAY_MS,
    );
    if (diff < 0 || diff >= weeks * 7) {
      continue;
    }
    const index = Math.floor(diff / 7);
    buckets[index].total += 1;
    if (log.rating === "good" || log.rating === "easy") {
      buckets[index].good += 1;
    }
  }

  return buckets.map((bucket, index) => {
    const retention = bucket.total
      ? Math.round((bucket.good / bucket.total) * 100)
      : 0;
    return {
      week: `W${index + 1}`,
      retention,
    };
  });
}

export function computeRetentionRate(logs: ReviewLog[], days = 30): number {
  const start = addDays(startOfDay(new Date()), -(days - 1));
  const recent = logs.filter((log) => log.reviewedAt >= start);
  const good = recent.filter(
    (log) => log.rating === "good" || log.rating === "easy",
  ).length;
  return recent.length ? good / recent.length : 0;
}

export function computeStreak(logs: ReviewLog[]): number {
  const reviewedDays = new Set(
    logs.map((log) => startOfDay(log.reviewedAt).toISOString()),
  );
  let streak = 0;
  while (true) {
    const day = addDays(startOfDay(new Date()), -streak).toISOString();
    if (!reviewedDays.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

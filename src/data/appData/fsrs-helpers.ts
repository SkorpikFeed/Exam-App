import type { Card } from "ts-fsrs";

import { createFsrsCard } from "../../lib/fsrs";

export function mapFsrsSnapshot(snapshot: Record<string, unknown> | null): Card {
  const fallback = createFsrsCard(new Date());
  if (!snapshot) {
    return fallback;
  }
  const dueRaw = snapshot.due;
  const lastRaw = snapshot.last_review;
  return {
    ...fallback,
    ...snapshot,
    due: dueRaw ? new Date(String(dueRaw)) : fallback.due,
    last_review: lastRaw ? new Date(String(lastRaw)) : undefined,
    stability: Number(snapshot.stability ?? fallback.stability),
    difficulty: Number(snapshot.difficulty ?? fallback.difficulty),
    elapsed_days: Number(snapshot.elapsed_days ?? fallback.elapsed_days),
    scheduled_days: Number(snapshot.scheduled_days ?? fallback.scheduled_days),
    learning_steps: Number(snapshot.learning_steps ?? fallback.learning_steps),
    reps: Number(snapshot.reps ?? fallback.reps),
    lapses: Number(snapshot.lapses ?? fallback.lapses),
    state: Number(snapshot.state ?? fallback.state),
  } as Card;
}

export function serializeFsrs(card: Card) {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

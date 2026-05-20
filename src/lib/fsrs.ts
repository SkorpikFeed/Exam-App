import {
  fsrs,
  createEmptyCard,
  type Card,
  type Grade,
  Rating,
  State,
} from "ts-fsrs";

const fsrsInstance = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
});

export type GradeKey = "again" | "hard" | "good" | "easy";

export const gradeMap: Record<GradeKey, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export const gradeLabels: Record<GradeKey, string> = {
  again: "Знову",
  hard: "Важко",
  good: "Добре",
  easy: "Легко",
};

export function createFsrsCard(now = new Date()): Card {
  return createEmptyCard(now);
}

export function applyReview(card: Card, grade: Grade, now = new Date()) {
  return fsrsInstance.next(card, now, grade);
}

export function getRetrievability(card: Card, now = new Date()): number {
  return fsrsInstance.get_retrievability(card, now, false);
}

export function getStateLabel(state: State): string {
  switch (state) {
    case State.New:
      return "Нова";
    case State.Learning:
      return "Вивчення";
    case State.Review:
      return "Повторення";
    case State.Relearning:
      return "Повторне вивчення";
    default:
      return "Повторення";
  }
}

export function isDue(card: Card, now = new Date()): boolean {
  return card.due.getTime() <= now.getTime();
}

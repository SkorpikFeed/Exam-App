import type { Card } from "ts-fsrs";

import type { GradeKey } from "../lib/fsrs";

export type UserRole = "student" | "admin";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  bio?: string;
  hasTutorial?: boolean;
  createdAt: Date;
};

export type DataStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "unauthenticated"
  | "misconfigured";

export type Deck = {
  id: string;
  title: string;
  description: string;
  subject: string;
  newLimit: number;
  createdAt?: Date;
};

export type CardItem = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  fsrs: Card;
  createdAt: Date;
  lastReview?: Date;
  reps: number;
  lapses: number;
};

export type ReviewLog = {
  id: string;
  cardId: string;
  deckId: string;
  rating: GradeKey;
  reviewedAt: Date;
};

export type ActivityPoint = {
  date: string;
  reviews: number;
};

export type RetentionPoint = {
  week: string;
  retention: number;
};

export type SystemStats = {
  totalUsers: number;
  active7d: number;
  active30d: number;
  sessions: number;
};

export type AppDataContextValue = {
  status: DataStatus;
  error: string | null;
  profile: AppUser | null;
  decks: Deck[];
  cards: CardItem[];
  activity: ActivityPoint[];
  retentionSeries: RetentionPoint[];
  retentionRate: number;
  streak: number;
  systemStats: SystemStats | null;
  users: AppUser[];
  refresh: () => Promise<void>;
  submitReview: (card: CardItem, grade: GradeKey) => Promise<CardItem | null>;
  signOut: () => Promise<void>;
  createDeck: (deck: Omit<Deck, "id" | "createdAt">) => Promise<Deck | null>;
  updateDeck: (
    id: string,
    deck: Partial<Omit<Deck, "id">>,
  ) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<boolean>;
  createCard: (
    card: Omit<
      CardItem,
      "id" | "createdAt" | "fsrs" | "lastReview" | "reps" | "lapses"
    >,
  ) => Promise<CardItem | null>;
  updateCard: (
    id: string,
    card: Partial<Omit<CardItem, "id" | "fsrs">>,
  ) => Promise<CardItem | null>;
  deleteCard: (id: string) => Promise<boolean>;
  toggleUserActive: (id: string, active: boolean) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  updateProfile: (profile: { name: string; bio: string }) => Promise<boolean>;
};

export type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  has_tutorial: boolean | null;
  role: string | null;
  active: boolean | null;
  created_at: string | null;
};

export type DeckRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  new_limit: number | null;
  created_at: string | null;
};

export type CardRow = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  tags: string[] | null;
  fsrs: Record<string, unknown> | null;
  created_at: string | null;
  last_review: string | null;
  reps: number | null;
  lapses: number | null;
};

export type ReviewLogRow = {
  id: string;
  card_id: string;
  deck_id: string;
  rating: GradeKey;
  reviewed_at: string;
};

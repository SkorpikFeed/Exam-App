import * as React from "react";
import { type Card } from "ts-fsrs";

import {
  applyReview,
  createFsrsCard,
  gradeMap,
  type GradeKey,
} from "../lib/fsrs";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { formatShortDate, startOfDay } from "../lib/format";
import {
  buildActivitySeries,
  buildRetentionSeries,
  computeRetentionRate,
  computeStreak,
} from "./derived";
import type {
  ActivityPoint,
  AppUser,
  CardItem,
  Deck,
  RetentionPoint,
  ReviewLog,
  SystemStats,
  DataStatus,
  AppDataContextValue,
  ProfileRow,
  DeckRow,
  CardRow,
  ReviewLogRow,
} from "./types";

const AppDataContext = React.createContext<AppDataContextValue | null>(null);

function mapFsrsSnapshot(snapshot: Record<string, unknown> | null): Card {
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

function serializeFsrs(card: Card) {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

function buildEmptyActivity(): ActivityPoint[] {
  const start = startOfDay(new Date());
  return Array.from({ length: 30 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() - (29 - index));
    return { date: formatShortDate(day), reviews: 0 };
  });
}

type TutorialDeckSeed = {
  title: string;
  description: string;
  subject: string;
  newLimit: number;
  cards: Array<{ front: string; back: string; tags: string[] }>;
};

const tutorialDecks: TutorialDeckSeed[] = [
  {
    title: "Навiгацiя",
    description: "Швидкий гайд по сторiнках та дiях.",
    subject: "Туторiал",
    newLimit: 6,
    cards: [
      {
        front: "Де знайти колоди та картки?",
        back: 'Вiдкрийте вкладку "Колоди" - там створення, редагування та видалення.',
        tags: ["tutorial", "navigation"],
      },
      {
        front: "Як створити нову колоду?",
        back: 'На сторiнцi "Колоди" натиснiть "Нова колода" i заповнiть форму.',
        tags: ["tutorial", "decks"],
      },
      {
        front: "Як додати картку в колоду?",
        back: 'Вiдкрийте "Картки" у деталях колоди та натиснiть "Додати картку".',
        tags: ["tutorial", "cards"],
      },
      {
        front: "Як видалити колоду?",
        back: 'У списку колод натиснiть кнопку "Видалити" i пiдтвердiть.',
        tags: ["tutorial", "cleanup"],
      },
      {
        front: "Як видалити картку?",
        back: 'У списку карток натиснiть три кнопки і оберіть опцію "Видалити".',
        tags: ["tutorial", "cleanup"],
      },
    ],
  },
  {
    title: "Аналiтика",
    description: "Як читати метрики та графiки.",
    subject: "Туторiал",
    newLimit: 6,
    cards: [
      {
        front: "Де дивитись аналiтику навчання?",
        back: 'Вiдкрийте вкладку "Аналітика" - там показники повторень та прогресу.',
        tags: ["tutorial", "analytics"],
      },
      {
        front: "Що таке активнiсть?",
        back: "Графiк активностi показує, скiльки повторень було щодня.",
        tags: ["tutorial", "analytics"],
      },
      {
        front: "Що показує пригадування?",
        back: "Це iмовiрнiсть пригадування - чим вище, тим краще закрiплено знання.",
        tags: ["tutorial", "analytics"],
      },
    ],
  },
  {
    title: "Як працює алгоритм",
    description: "Коротко про iнтервальне повторення.",
    subject: "Туторiал",
    newLimit: 6,
    cards: [
      {
        front: "Що робить алгоритм повторень?",
        back: "Вiн планує iнтервали на основi ваших оцiнок, щоб вчитись ефективнiше.",
        tags: ["tutorial", "fsrs"],
      },
      {
        front: "Чому оцiнки важливi?",
        back: 'Оцiнки "Знову/Важко/Добре/Легко" допомагають алгоритму пiдiбрати темп.',
        tags: ["tutorial", "fsrs"],
      },
      {
        front: "Як покращити результати?",
        back: "Регулярно повторюйте i чесно оцiнюйте картки - так iнтервали стануть точнiшими.",
        tags: ["tutorial", "fsrs"],
      },
    ],
  },
];

async function seedTutorialDecks(userId: string) {
  const titles = tutorialDecks.map((deck) => deck.title);
  const { data: existing, error: existingError } = await supabase
    .from("decks")
    .select("id, title")
    .eq("user_id", userId)
    .in("title", titles)
    .returns<Pick<DeckRow, "id" | "title">[]>();

  if (existingError) {
    return existingError;
  }

  const existingTitles = new Set((existing ?? []).map((deck) => deck.title));
  const missingDecks = tutorialDecks.filter(
    (deck) => !existingTitles.has(deck.title),
  );

  if (missingDecks.length === 0) {
    return null;
  }

  const { data: decksData, error: deckError } = await supabase
    .from("decks")
    .insert(
      missingDecks.map((deck) => ({
        user_id: userId,
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        new_limit: deck.newLimit,
      })),
    )
    .select()
    .returns<DeckRow[]>();

  if (deckError || !decksData) {
    return deckError;
  }

  const cardsPayload = decksData.flatMap((deckRow) => {
    const seed = tutorialDecks.find((deck) => deck.title === deckRow.title);
    if (!seed) {
      return [];
    }
    return seed.cards.map((card) => ({
      deck_id: deckRow.id,
      front: card.front,
      back: card.back,
      tags: card.tags,
      fsrs: serializeFsrs(createFsrsCard(new Date())),
      reps: 0,
      lapses: 0,
    }));
  });

  if (cardsPayload.length === 0) {
    return null;
  }

  const { error: cardsError } = await supabase
    .from("cards")
    .insert(cardsPayload);
  return cardsError;
}

async function ensureProfileRow(user: {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string; role?: string };
  created_at?: string;
}) {
  const fallbackName =
    user.user_metadata?.name || user.email?.split("@")[0] || "Student";

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle<Pick<ProfileRow, "id" | "role">>();

  if (existingError) {
    return existingError;
  }

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      name: fallbackName,
      email: user.email ?? null,
      bio: null,
      has_tutorial: false,
      role: (user.user_metadata?.role as AppUser["role"]) ?? "student",
      active: true,
      created_at: user.created_at ?? new Date().toISOString(),
    });
    return error;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: fallbackName, email: user.email ?? null, active: true })
    .eq("id", user.id);

  return error;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<DataStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<AppUser | null>(null);
  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [cards, setCards] = React.useState<CardItem[]>([]);
  const [activity, setActivity] =
    React.useState<ActivityPoint[]>(buildEmptyActivity());
  const [retentionSeries, setRetentionSeries] = React.useState<
    RetentionPoint[]
  >([]);
  const [retentionRate, setRetentionRate] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [systemStats, setSystemStats] = React.useState<SystemStats | null>(
    null,
  );
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus("misconfigured");
      setError("Missing Supabase environment variables.");
      return;
    }

    setStatus((prev) => (prev === "ready" ? "ready" : "loading"));
    setError(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      setStatus("error");
      setError(sessionError.message);
      return;
    }

    const session = sessionData.session;
    let currentUser = session?.user ?? null;

    if (!currentUser) {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        setStatus("error");
        setError(userError.message);
        return;
      }
      currentUser = userData.user ?? null;
    }

    if (!currentUser) {
      setStatus("unauthenticated");
      setProfile(null);
      setDecks([]);
      setCards([]);
      setActivity(buildEmptyActivity());
      setRetentionSeries([]);
      setRetentionRate(0);
      setStreak(0);
      setSystemStats(null);
      setUsers([]);
      setUserId(null);
      return;
    }

    setUserId(currentUser.id);

    await ensureProfileRow(currentUser);

    const fallbackName =
      currentUser.user_metadata?.name ||
      currentUser.email?.split("@")?.[0] ||
      "Student";

    const profileResult = await supabase
      .from("profiles")
      .select("id, name, email, bio, has_tutorial, role, active, created_at")
      .eq("id", currentUser.id)
      .single<ProfileRow>();

    const roleRaw =
      profileResult.data?.role ??
      (currentUser.user_metadata?.role as AppUser["role"] | undefined);
    const normalizedRole =
      String(roleRaw ?? "student").toLowerCase() === "admin"
        ? "admin"
        : "student";

    const resolvedProfile: AppUser = {
      id: currentUser.id,
      name: profileResult.data?.name ?? fallbackName,
      email: currentUser.email ?? "",
      bio: profileResult.data?.bio ?? "",
      hasTutorial: profileResult.data?.has_tutorial ?? false,
      role: normalizedRole,
      active: profileResult.data?.active ?? true,
      createdAt: profileResult.data?.created_at
        ? new Date(profileResult.data.created_at)
        : new Date(currentUser.created_at ?? Date.now()),
    };

    setProfile(resolvedProfile);

    if (profileResult.data && !profileResult.data.has_tutorial) {
      const { data: claimed, error: claimError } = await supabase
        .from("profiles")
        .update({ has_tutorial: true })
        .eq("id", currentUser.id)
        .eq("has_tutorial", false)
        .select("id");

      if (!claimError && claimed && claimed.length > 0) {
        const seedError = await seedTutorialDecks(currentUser.id);
        if (seedError) {
          await supabase
            .from("profiles")
            .update({ has_tutorial: false })
            .eq("id", currentUser.id);
        } else {
          setProfile((prev) => (prev ? { ...prev, hasTutorial: true } : prev));
        }
      }
    }

    const deckResult = await supabase
      .from("decks")
      .select("id, user_id, title, description, subject, new_limit, created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .returns<DeckRow[]>();

    if (deckResult.error) {
      setStatus("error");
      setError(deckResult.error.message);
      return;
    }

    let deckRows = deckResult.data ?? [];

    if (deckRows.length === 0) {
      const refreshedDecks = await supabase
        .from("decks")
        .select(
          "id, user_id, title, description, subject, new_limit, created_at",
        )
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .returns<DeckRow[]>();
      if (!refreshedDecks.error) {
        deckRows = refreshedDecks.data ?? [];
      }
    }

    const mappedDecks = deckRows.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description ?? "",
      subject: deck.subject ?? "General",
      newLimit: deck.new_limit ?? 8,
      createdAt: deck.created_at ? new Date(deck.created_at) : undefined,
    }));

    setDecks(mappedDecks);

    const deckIds = mappedDecks.map((deck) => deck.id);
    const cardResult = deckIds.length
      ? await supabase
          .from("cards")
          .select(
            "id, deck_id, front, back, tags, fsrs, created_at, last_review, reps, lapses",
          )
          .in("deck_id", deckIds)
          .returns<CardRow[]>()
      : { data: [], error: null };

    if (cardResult.error) {
      setStatus("error");
      setError(cardResult.error.message);
      return;
    }

    const mappedCards = (cardResult.data ?? []).map((card) => {
      const fsrs = mapFsrsSnapshot(card.fsrs ?? null);
      return {
        id: card.id,
        deckId: card.deck_id,
        front: card.front,
        back: card.back,
        tags: card.tags ?? [],
        fsrs,
        createdAt: card.created_at ? new Date(card.created_at) : new Date(),
        lastReview: card.last_review
          ? new Date(card.last_review)
          : fsrs.last_review,
        reps: card.reps ?? fsrs.reps,
        lapses: card.lapses ?? fsrs.lapses,
      } satisfies CardItem;
    });

    setCards(mappedCards);

    const logsResult = await supabase
      .from("review_logs")
      .select("id, card_id, deck_id, rating, reviewed_at")
      .eq("user_id", currentUser.id)
      .gte("reviewed_at", addDaysISO(startOfDay(new Date()), -90))
      .returns<ReviewLogRow[]>();

    const reviewLogs: ReviewLog[] = (logsResult.data ?? []).map((log) => ({
      id: log.id,
      cardId: log.card_id,
      deckId: log.deck_id,
      rating: log.rating,
      reviewedAt: new Date(log.reviewed_at),
    }));

    setActivity(buildActivitySeries(reviewLogs));
    setRetentionSeries(buildRetentionSeries(reviewLogs));
    setRetentionRate(computeRetentionRate(reviewLogs));
    setStreak(computeStreak(reviewLogs));

    if (logsResult.error) {
      setActivity(buildEmptyActivity());
      setRetentionSeries([]);
      setRetentionRate(0);
      setStreak(0);
    }

    const usersResult = await supabase
      .from("profiles")
      .select("id, name, email, role, active, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<ProfileRow[]>();

    if (!usersResult.error) {
      setUsers(
        (usersResult.data ?? []).map((user) => ({
          id: user.id,
          name: user.name ?? "User",
          email: user.email ?? "",
          role: (user.role as AppUser["role"]) ?? "student",
          active: user.active ?? true,
          createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        })),
      );
    }

    if (!usersResult.error) {
      const totalUsers = usersResult.data?.length ?? 0;
      setSystemStats({
        totalUsers,
        active7d: Math.max(0, Math.round(totalUsers * 0.6)),
        active30d: Math.max(0, Math.round(totalUsers * 0.75)),
        sessions: Math.max(0, Math.round(totalUsers * 6)),
      });
    }

    setStatus("ready");
  }, []);

  React.useEffect(() => {
    refresh();
    if (!isSupabaseConfigured) {
      return;
    }
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, [refresh]);

  const submitReview = React.useCallback(
    async (card: CardItem, grade: GradeKey) => {
      const now = new Date();
      const record = applyReview(card.fsrs, gradeMap[grade], now);
      const nextLapses = Math.max(
        record.card.lapses,
        card.lapses + (grade === "again" ? 1 : 0),
      );
      const updated: CardItem = {
        ...card,
        fsrs: record.card,
        lastReview: now,
        reps: record.card.reps,
        lapses: nextLapses,
      };

      setCards((prev) =>
        prev.map((item) => (item.id === card.id ? updated : item)),
      );

      if (!isSupabaseConfigured || !userId) {
        return updated;
      }

      await supabase
        .from("cards")
        .update({
          fsrs: serializeFsrs(record.card),
          last_review: record.card.last_review
            ? record.card.last_review.toISOString()
            : now.toISOString(),
          reps: record.card.reps,
          lapses: nextLapses,
        })
        .eq("id", card.id);

      await supabase.from("review_logs").insert({
        card_id: card.id,
        deck_id: card.deckId,
        user_id: userId,
        rating: grade,
        reviewed_at: now.toISOString(),
      });

      return updated;
    },
    [userId],
  );

  const signOut = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const createDeck = React.useCallback(
    async (deck: Omit<Deck, "id" | "createdAt">) => {
      if (!isSupabaseConfigured || !userId) {
        return null;
      }

      const { data: currentUserData } = await supabase.auth.getUser();
      if (currentUserData.user) {
        await ensureProfileRow(currentUserData.user);
      }

      const { data, error } = await supabase
        .from("decks")
        .insert({
          user_id: userId,
          title: deck.title,
          description: deck.description,
          subject: deck.subject,
          new_limit: deck.newLimit,
        })
        .select()
        .single<DeckRow>();

      if (error || !data) {
        return null;
      }

      const newDeck: Deck = {
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        subject: data.subject ?? "General",
        newLimit: data.new_limit ?? 8,
        createdAt: data.created_at ? new Date(data.created_at) : undefined,
      };

      setDecks((prev) => [...prev, newDeck]);
      return newDeck;
    },
    [userId],
  );

  const updateDeck = React.useCallback(
    async (id: string, deck: Partial<Omit<Deck, "id">>) => {
      if (!isSupabaseConfigured || !userId) {
        return null;
      }

      const updates: Record<string, unknown> = {};
      if (deck.title !== undefined) updates.title = deck.title;
      if (deck.description !== undefined)
        updates.description = deck.description;
      if (deck.subject !== undefined) updates.subject = deck.subject;
      if (deck.newLimit !== undefined) updates.new_limit = deck.newLimit;

      const { data, error } = await supabase
        .from("decks")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single<DeckRow>();

      if (error || !data) {
        return null;
      }

      const updated: Deck = {
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        subject: data.subject ?? "General",
        newLimit: data.new_limit ?? 8,
        createdAt: data.created_at ? new Date(data.created_at) : undefined,
      };

      setDecks((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    [userId],
  );

  const deleteDeck = React.useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured || !userId) {
        return false;
      }

      const { error } = await supabase
        .from("decks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return false;
      }

      setDecks((prev) => prev.filter((d) => d.id !== id));
      setCards((prev) => prev.filter((c) => c.deckId !== id));
      return true;
    },
    [userId],
  );

  const createCard = React.useCallback(
    async (
      card: Omit<
        CardItem,
        "id" | "createdAt" | "fsrs" | "lastReview" | "reps" | "lapses"
      >,
    ) => {
      if (!isSupabaseConfigured) {
        return null;
      }

      const fsrs = createFsrsCard(new Date());
      const { data, error } = await supabase
        .from("cards")
        .insert({
          deck_id: card.deckId,
          front: card.front,
          back: card.back,
          tags: card.tags,
          fsrs: serializeFsrs(fsrs),
          reps: 0,
          lapses: 0,
        })
        .select()
        .single<CardRow>();

      if (error || !data) {
        return null;
      }

      const newCard: CardItem = {
        id: data.id,
        deckId: data.deck_id,
        front: data.front,
        back: data.back,
        tags: data.tags ?? [],
        fsrs: mapFsrsSnapshot(data.fsrs ?? null),
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        lastReview: undefined,
        reps: data.reps ?? 0,
        lapses: data.lapses ?? 0,
      };

      setCards((prev) => [...prev, newCard]);
      return newCard;
    },
    [],
  );

  const updateCard = React.useCallback(
    async (id: string, card: Partial<Omit<CardItem, "id" | "fsrs">>) => {
      if (!isSupabaseConfigured) {
        return null;
      }

      const updates: Record<string, unknown> = {};
      if (card.front !== undefined) updates.front = card.front;
      if (card.back !== undefined) updates.back = card.back;
      if (card.tags !== undefined) updates.tags = card.tags;

      const { data, error } = await supabase
        .from("cards")
        .update(updates)
        .eq("id", id)
        .select()
        .single<CardRow>();

      if (error || !data) {
        return null;
      }

      const updated: CardItem = {
        id: data.id,
        deckId: data.deck_id,
        front: data.front,
        back: data.back,
        tags: data.tags ?? [],
        fsrs: mapFsrsSnapshot(data.fsrs ?? null),
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        lastReview: data.last_review ? new Date(data.last_review) : undefined,
        reps: data.reps ?? 0,
        lapses: data.lapses ?? 0,
      };

      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    },
    [],
  );

  const deleteCard = React.useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabase.from("cards").delete().eq("id", id);

    if (error) {
      return false;
    }

    setCards((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  const updateProfile = React.useCallback(
    async (nextProfile: { name: string; bio: string }) => {
      if (!isSupabaseConfigured || !userId) {
        return false;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ name: nextProfile.name, bio: nextProfile.bio })
        .eq("id", userId);

      if (error) {
        return false;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: nextProfile.name,
              bio: nextProfile.bio,
            }
          : prev,
      );

      return true;
    },
    [userId],
  );

  const toggleUserActive = React.useCallback(
    async (id: string, active: boolean) => {
      if (!isSupabaseConfigured) {
        return false;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ active })
        .eq("id", id);

      if (error) {
        return false;
      }

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
      return true;
    },
    [],
  );

  const deleteUser = React.useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      return false;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  }, []);

  const value = React.useMemo(
    () => ({
      status,
      error,
      profile,
      decks,
      cards,
      activity,
      retentionSeries,
      retentionRate,
      streak,
      systemStats,
      users,
      refresh,
      submitReview,
      signOut,
      createDeck,
      updateDeck,
      deleteDeck,
      createCard,
      updateCard,
      deleteCard,
      toggleUserActive,
      deleteUser,
      updateProfile,
    }),
    [
      status,
      error,
      profile,
      decks,
      cards,
      activity,
      retentionSeries,
      retentionRate,
      streak,
      systemStats,
      users,
      refresh,
      submitReview,
      signOut,
      createDeck,
      updateDeck,
      deleteDeck,
      createCard,
      updateCard,
      deleteCard,
      toggleUserActive,
      deleteUser,
      updateProfile,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = React.useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}

function addDaysISO(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

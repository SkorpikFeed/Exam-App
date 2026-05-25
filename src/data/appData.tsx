import * as React from "react";

import {
  applyReview,
  createFsrsCard,
  gradeMap,
  type GradeKey,
} from "../lib/fsrs";
import { isSupabaseConfigured } from "../lib/supabase";
import { startOfDay } from "../lib/format";
import {
  buildActivitySeries,
  buildRetentionSeries,
  computeRetentionRate,
  computeStreak,
} from "./derived";
import { buildEmptyActivity, addDaysISO } from "./appData/activity";
import { mapFsrsSnapshot, serializeFsrs } from "./appData/fsrs-helpers";
import { ensureProfileRow } from "./appData/profile";
import { seedTutorialDecks } from "./appData/seed";
import {
  claimTutorial,
  createCardRow,
  createDeckRow,
  deleteCardRow,
  deleteDeckRow,
  deleteUserRow,
  fetchCardRows,
  fetchDeckRows,
  fetchProfile,
  fetchRecentUsers,
  fetchReviewLogRows,
  getSession,
  getUser,
  insertReviewLog,
  onAuthStateChange,
  revertTutorial,
  signOutUser,
  updateCardById,
  updateCardRow,
  updateDeckRow,
  updateProfileRow,
  updateUserActiveRow,
} from "./appData/supabase";
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
} from "./types";

const AppDataContext = React.createContext<AppDataContextValue | null>(null);

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

    const { data: sessionData, error: sessionError } = await getSession();

    // Якщо це помилка відсутності сесії, просто ігноруємо її (користувач гість)
    if (sessionError) {
      const msg = sessionError.message.toLowerCase();
      if (!msg.includes("session missing") && !msg.includes("refresh token")) {
        setStatus("error");
        setError(sessionError.message);
        return;
      }
    }

    let currentUser = sessionData?.session?.user ?? null;

    if (!currentUser) {
      const { data: userData, error: userError } = await getUser();

      if (userError) {
        const msg = userError.message.toLowerCase();
        if (!msg.includes("session missing") && !msg.includes("auth")) {
          setStatus("error");
          setError(userError.message);
          return;
        }
      }
      currentUser = userData?.user ?? null;
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

    const profileResult = await fetchProfile(currentUser.id);

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
      const { data: claimed, error: claimError } = await claimTutorial(
        currentUser.id,
      );

      if (!claimError && claimed && claimed.length > 0) {
        const seedError = await seedTutorialDecks(currentUser.id);
        if (seedError) {
          await revertTutorial(currentUser.id);
        } else {
          setProfile((prev) => (prev ? { ...prev, hasTutorial: true } : prev));
        }
      }
    }

    const deckResult = await fetchDeckRows(currentUser.id);

    if (deckResult.error) {
      setStatus("error");
      setError(deckResult.error.message);
      return;
    }

    let deckRows = deckResult.data ?? [];

    if (deckRows.length === 0) {
      const refreshedDecks = await fetchDeckRows(currentUser.id);
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
      ? await fetchCardRows(deckIds)
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

    const logsResult = await fetchReviewLogRows(
      currentUser.id,
      addDaysISO(startOfDay(new Date()), -90),
    );

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

    const usersResult = await fetchRecentUsers();

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
    const { data: subscription } = onAuthStateChange(async () => {
      await refresh();
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

      await updateCardById(card.id, {
        fsrs: serializeFsrs(record.card),
        last_review: record.card.last_review
          ? record.card.last_review.toISOString()
          : now.toISOString(),
        reps: record.card.reps,
        lapses: nextLapses,
      });

      await insertReviewLog({
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
    await signOutUser();
  }, []);

  const createDeck = React.useCallback(
    async (deck: Omit<Deck, "id" | "createdAt">) => {
      if (!isSupabaseConfigured || !userId) {
        return null;
      }

      const { data: currentUserData } = await getUser();
      if (currentUserData.user) {
        await ensureProfileRow(currentUserData.user);
      }

      const { data, error } = await createDeckRow({
        user_id: userId,
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        new_limit: deck.newLimit,
      });

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

      const { data, error } = await updateDeckRow(id, userId, updates);

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

      const { error } = await deleteDeckRow(id, userId);

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
      const { data, error } = await createCardRow({
        deck_id: card.deckId,
        front: card.front,
        back: card.back,
        tags: card.tags,
        fsrs: serializeFsrs(fsrs),
        reps: 0,
        lapses: 0,
      });

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

      const { data, error } = await updateCardRow(id, updates);

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

    const { error } = await deleteCardRow(id);

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

      const { error } = await updateProfileRow(userId, {
        name: nextProfile.name,
        bio: nextProfile.bio,
      });

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

      const { error } = await updateUserActiveRow(id, active);

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

    const { error } = await deleteUserRow(id);

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

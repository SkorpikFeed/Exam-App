import { supabase } from "../../lib/supabase";
import type { CardRow, DeckRow, ProfileRow, ReviewLogRow } from "../types";

export function onAuthStateChange(
  handler: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  // Підписка на зміни стану автентифікації.
  return supabase.auth.onAuthStateChange(handler);
}

export async function getSession() {
  // Поточна сесія користувача.
  return supabase.auth.getSession();
}

export async function getUser() {
  // Поточний користувач.
  return supabase.auth.getUser();
}

export async function signOutUser() {
  // Вихід з облікового запису.
  return supabase.auth.signOut();
}

export async function fetchProfile(userId: string) {
  // Завантажити профіль за id користувача.
  return supabase
    .from("profiles")
    .select("id, name, email, bio, has_tutorial, role, active, created_at")
    .eq("id", userId)
    .single<ProfileRow>();
}

export async function claimTutorial(userId: string) {
  // Позначити проходження туторіалу (одноразова операція).
  return supabase
    .from("profiles")
    .update({ has_tutorial: true })
    .eq("id", userId)
    .eq("has_tutorial", false)
    .select("id");
}

export async function revertTutorial(userId: string) {
  // Скинути прапорець туторіалу.
  return supabase
    .from("profiles")
    .update({ has_tutorial: false })
    .eq("id", userId);
}

export async function fetchDeckRows(userId: string) {
  // Отримати колоди користувача, найновіші першими.
  return supabase
    .from("decks")
    .select("id, user_id, title, description, subject, new_limit, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<DeckRow[]>();
}

export async function fetchCardRows(deckIds: string[]) {
  // Отримати картки для набору колод.
  return supabase
    .from("cards")
    .select(
      "id, deck_id, front, back, tags, fsrs, created_at, last_review, reps, lapses",
    )
    .in("deck_id", deckIds)
    .returns<CardRow[]>();
}

export async function fetchReviewLogRows(userId: string, sinceISO: string) {
  // Логи повторень користувача починаючи з дати.
  return supabase
    .from("review_logs")
    .select("id, card_id, deck_id, rating, reviewed_at")
    .eq("user_id", userId)
    .gte("reviewed_at", sinceISO)
    .returns<ReviewLogRow[]>();
}

export async function fetchRecentUsers() {
  // Нещодавно створені користувачі (для адмінки).
  return supabase
    .from("profiles")
    .select("id, name, email, role, active, created_at")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ProfileRow[]>();
}

export async function updateCardById(
  id: string,
  updates: Record<string, unknown>,
) {
  // Часткове оновлення картки за id.
  return supabase.from("cards").update(updates).eq("id", id);
}

export async function insertReviewLog(payload: {
  card_id: string;
  deck_id: string;
  user_id: string;
  rating: string;
  reviewed_at: string;
}) {
  // Записати лог повторення.
  return supabase.from("review_logs").insert(payload);
}

export async function createDeckRow(payload: {
  user_id: string;
  title: string;
  description: string;
  subject: string;
  new_limit: number;
}) {
  // Створити нову колоду та повернути рядок.
  return supabase.from("decks").insert(payload).select().single<DeckRow>();
}

export async function updateDeckRow(
  id: string,
  userId: string,
  updates: Record<string, unknown>,
) {
  // Оновити колоду користувача з поверненням даних.
  return supabase
    .from("decks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single<DeckRow>();
}

export async function deleteDeckRow(id: string, userId: string) {
  // Видалити колоду користувача.
  return supabase.from("decks").delete().eq("id", id).eq("user_id", userId);
}

export async function createCardRow(payload: {
  deck_id: string;
  front: string;
  back: string;
  tags: string[];
  fsrs: unknown;
  reps: number;
  lapses: number;
}) {
  // Створити нову картку та повернути рядок.
  return supabase.from("cards").insert(payload).select().single<CardRow>();
}

export async function updateCardRow(
  id: string,
  updates: Record<string, unknown>,
) {
  // Оновити картку з поверненням даних.
  return supabase
    .from("cards")
    .update(updates)
    .eq("id", id)
    .select()
    .single<CardRow>();
}

export async function deleteCardRow(id: string) {
  // Видалити картку за id.
  return supabase.from("cards").delete().eq("id", id);
}

export async function updateProfileRow(
  userId: string,
  payload: {
    name: string;
    bio: string;
  },
) {
  // Оновити публічні поля профілю.
  return supabase.from("profiles").update(payload).eq("id", userId);
}

export async function updateUserActiveRow(id: string, active: boolean) {
  // Активувати/деактивувати користувача.
  return supabase.from("profiles").update({ active }).eq("id", id);
}

export async function deleteUserRow(id: string) {
  // Видалити профіль користувача.
  return supabase.from("profiles").delete().eq("id", id);
}

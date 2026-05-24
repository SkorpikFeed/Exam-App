import { createFsrsCard } from "../../lib/fsrs";
import { supabase } from "../../lib/supabase";
import type { DeckRow } from "../types";
import { serializeFsrs } from "./fsrs-helpers";

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

export async function seedTutorialDecks(userId: string) {
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

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCcw, Timer } from "lucide-react";

import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useAppData } from "../data/appData";
import { buildReviewQueue } from "../data/derived";
import type { CardItem } from "../data/types";
import { gradeLabels, type GradeKey } from "../lib/fsrs";
import {
  formatDurationMinutes,
  formatNumber,
  formatRelativeDay,
} from "../lib/format";

const gradeOrder: GradeKey[] = ["again", "hard", "good", "easy"];

export default function ReviewPage() {
  const { status, error, cards, decks, submitReview } = useAppData();
  const [queue, setQueue] = useState<CardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [log, setLog] = useState<Record<GradeKey, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    if (status === "ready" && queue.length === 0) {
      setQueue(buildReviewQueue(cards, decks));
    }
  }, [status, cards, decks, queue.length]);

  const deckMap = useMemo(
    () => new Map(decks.map((deck) => [deck.id, deck.title])),
    [decks],
  );

  const current = queue[index];
  const total = queue.length;
  const progress = total ? Math.round((index / total) * 100) : 0;
  const isComplete = total > 0 && index >= total;
  const duration = formatDurationMinutes((Date.now() - startedAt) / 60000);

  const resetSession = () => {
    setQueue(buildReviewQueue(cards, decks));
    setIndex(0);
    setFlipped(false);
    setLog({ again: 0, hard: 0, good: 0, easy: 0 });
    setStartedAt(Date.now());
  };

  const handleGrade = async (gradeKey: GradeKey) => {
    if (!current) {
      return;
    }
    const updated = await submitReview(current, gradeKey);
    if (!updated) {
      return;
    }

    setQueue((prev) =>
      prev.map((card, idx) => (idx === index ? updated : card)),
    );
    setLog((prev) => ({ ...prev, [gradeKey]: prev[gradeKey] + 1 }));
    setFlipped(false);
    setIndex((prev) => prev + 1);
  };

  if (status !== "ready") {
    const message =
      status === "misconfigured"
        ? "Додайте змінні Supabase, щоб завантажити живі дані."
        : status === "unauthenticated"
          ? "Увійдіть, щоб повторювати картки."
          : status === "error"
            ? (error ?? "Не вдалося завантажити дані.")
            : "Завантажуємо сесію повторення...";

    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Повторення недоступне</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/auth">Перейти до входу</Link>
        </Button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">
          Зараз немає карток до повторення
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Додайте ще картки або зачекайте до наступного запланованого
          повторення.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/decks">Керувати колодами</Link>
          </Button>
          <Button asChild>
            <Link to="/">Повернутися на головну</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Сесію завершено
            </p>
            <h2 className="text-xl font-semibold">Чудова робота</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Тривалість</p>
            <p className="text-lg font-semibold">{duration}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Карток повторено</p>
            <p className="text-lg font-semibold">{formatNumber(total)}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Знову</p>
            <p className="text-lg font-semibold">{formatNumber(log.again)}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Легко</p>
            <p className="text-lg font-semibold">{formatNumber(log.easy)}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={resetSession} className="gap-2">
            <RefreshCcw className="size-4" />
            Розпочати нову сесію
          </Button>
          <Button asChild variant="outline">
            <Link to="/analytics">Переглянути аналітику</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Картка {index + 1} з {total}
          </span>
          <span className="flex items-center gap-2">
            <Timer className="size-3.5" />
            {duration}
          </span>
        </div>
        <div className="mt-4">
          <Progress value={progress} />
        </div>
        <div className="mt-6 rounded-3xl border border-border/60 bg-background/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {flipped ? "Відповідь" : "Питання"}
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {flipped ? current?.back : current?.front}
          </h2>
          <p className="mt-3 text-xs text-muted-foreground">
            Колода: {current ? deckMap.get(current.deckId) : ""} - До
            повторення:
            {current ? ` ${formatRelativeDay(current.fsrs.due)}` : ""}
          </p>
        </div>

        <div className="mt-6">
          {!flipped ? (
            <Button onClick={() => setFlipped(true)} className="w-full">
              Показати відповідь
            </Button>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              {gradeOrder.map((gradeKey) => (
                <Button
                  key={gradeKey}
                  variant={
                    gradeKey === "again"
                      ? "destructive"
                      : gradeKey === "hard"
                        ? "outline"
                        : gradeKey === "good"
                          ? "secondary"
                          : "default"
                  }
                  onClick={() => handleGrade(gradeKey)}
                >
                  {gradeLabels[gradeKey]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Підсумок сесії
          </p>
          <h3 className="text-lg font-semibold">Огляд оцінок</h3>
          <div className="mt-4 space-y-2 text-sm">
            {gradeOrder.map((gradeKey) => (
              <div key={gradeKey} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {gradeLabels[gradeKey]}
                </span>
                <span className="font-semibold">
                  {formatNumber(log[gradeKey])}
                </span>
              </div>
            ))}
          </div>
          <Button
            onClick={resetSession}
            variant="outline"
            className="mt-4 w-full"
          >
            Скинути сесію
          </Button>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Далі
          </p>
          <h3 className="text-lg font-semibold">Попередній перегляд черги</h3>
          <div className="mt-4 space-y-3">
            {queue.slice(index + 1, index + 4).map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-3 text-sm"
              >
                <div className="font-semibold">{card.front}</div>
                <div className="text-xs text-muted-foreground">
                  {deckMap.get(card.deckId)} -{" "}
                  {formatRelativeDay(card.fsrs.due)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

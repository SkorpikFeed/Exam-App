import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Clock,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { CardDialog } from "../components/ui/card-dialog";
import { DeckDialog } from "../components/ui/deck-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "../components/ui/tabs";
// import { Textarea } from "../components/ui/textarea";
import { useAppData } from "../data/appData";
import { getCardsByDeck, getDeckStats } from "../data/derived";
import { formatNumber, formatRelativeDay } from "../lib/format";
import { getStateLabel, isDue } from "../lib/fsrs";

// const inputClassName =
//   "h-10 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export default function DecksPage() {
  const {
    status,
    error,
    decks,
    cards,
    createDeck,
    updateDeck,
    deleteDeck,
    createCard,
    updateCard,
    deleteCard,
  } = useAppData();
  const [activeDeckId, setActiveDeckId] = useState("");

  useEffect(() => {
    if (!activeDeckId && decks.length > 0) {
      setActiveDeckId(decks[0].id);
    }
  }, [activeDeckId, decks]);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? decks[0],
    [activeDeckId, decks],
  );

  const activeCards = activeDeck ? getCardsByDeck(activeDeck.id, cards) : [];
  // const activeStats = activeDeck ? getDeckStats(activeDeck.id, cards) : null;

  if (status !== "ready") {
    const message =
      status === "misconfigured"
        ? "Додайте змінні Supabase, щоб завантажити живі дані."
        : status === "unauthenticated"
          ? "Увійдіть, щоб керувати колодами."
          : status === "error"
            ? (error ?? "Не вдалося завантажити дані.")
            : "Завантажуємо колоди...";

    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Колоди недоступні</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/auth">Перейти до входу</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 mt-3 mx-5">
        <div>
          <h2 className="text-2xl font-semibold">
            Створюйте та впорядковуйте колоди
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* <Button asChild variant="outline">
            <Link to="/review">Черга повторення</Link>
          </Button> */}
          <DeckDialog
            mode="create"
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Нова колода
              </Button>
            }
            onSubmit={async (deck) => {
              await createDeck(deck);
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {decks.map((deck) => {
          const stats = getDeckStats(deck.id, cards);
          const progress = stats.total
            ? (stats.reviewCount / stats.total) * 100
            : 0;

          return (
            <div
              key={deck.id}
              className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {deck.subject}
                  </p>
                  <h3 className="text-lg font-semibold">{deck.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {deck.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DeckDialog
                      mode="edit"
                      deck={deck}
                      trigger={
                        <div className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
                          <Pencil className="size-4" />
                          Редагувати
                        </div>
                      }
                      onSubmit={async (updated) => {
                        await updateDeck(deck.id, updated);
                      }}
                    />
                    {/* <DropdownMenuItem>
                      <BookOpen className="size-4" />
                      Відкрити колоду
                    </DropdownMenuItem> */}
                    {/* <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="size-4" />
                          Видалити
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Видалити цю колоду?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {deck.title} буде видалено назавжди. Цю дію не можна
                            скасувати.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDeck(deck.id)}
                          >
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-3.5" />
                    Картки
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {formatNumber(stats.total)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="size-3.5" />
                    Повторити
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {formatNumber(stats.dueToday)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5" />
                    Ліміт нових
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {deck.newLimit}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={progress} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {/* <Button asChild size="sm" variant="outline">
                  <Link to="/review">Повторення</Link>
                </Button> */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      Видалити колоду
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Видалити цю колоду?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {deck.title} має {stats.total} карток. Цю дію не можна
                        скасувати.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteDeck(deck.id)}>
                        Видалити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Деталі колоди
            </p>
            <h2 className="text-lg font-semibold">
              Перегляд і редагування карток
            </h2>
          </div>
          <Select value={activeDeckId} onValueChange={setActiveDeckId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Оберіть колоду" />
            </SelectTrigger>
            <SelectContent>
              {decks.map((deck) => (
                <SelectItem key={deck.id} value={deck.id}>
                  {deck.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* <Tabs defaultValue="cards" className="mt-6"> */}
        {/* <TabsList>
            <TabsTrigger value="overview">Огляд</TabsTrigger>
            <TabsTrigger value="cards">Картки</TabsTrigger>
          </TabsList> */}

        {/* <TabsContent value="overview" className="mt-6 space-y-6">
            {activeDeck && activeStats ? (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                  <h3 className="text-base font-semibold">Огляд колоди</h3>
                  <p className="text-xs text-muted-foreground">
                    Оновіть назву колоди, опис і ліміти.
                  </p>
                  <div className="mt-4 space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Назва колоди
                    </label>
                    <input
                      className={inputClassName}
                      defaultValue={activeDeck.title}
                    />
                    <label className="text-xs font-semibold text-muted-foreground">
                      Опис
                    </label>
                    <Textarea defaultValue={activeDeck.description} />
                    <label className="text-xs font-semibold text-muted-foreground">
                      Нових карток за сесію
                    </label>
                    <input
                      className={inputClassName}
                      defaultValue={activeDeck.newLimit}
                    />
                    <Button className="w-full">Зберегти зміни</Button>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                  <h3 className="text-base font-semibold">Статистика колоди</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Усього карток
                      </span>
                      <span className="font-semibold">
                        {formatNumber(activeStats.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Сьогодні до повторення
                      </span>
                      <span className="font-semibold">
                        {formatNumber(activeStats.dueToday)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Нові</span>
                      <span className="font-semibold">
                        {formatNumber(activeStats.newCount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">На вивченні</span>
                      <span className="font-semibold">
                        {formatNumber(activeStats.learningCount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Повторити</span>
                      <span className="font-semibold">
                        {formatNumber(activeStats.reviewCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Оберіть колоду, щоб переглянути деталі.
              </p>
            )}
          </TabsContent> */}

        {/* <TabsContent value="cards" className="mt-6"> */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {activeCards.length} карток в колоді
            </p>
          </div>
          {activeDeck && (
            <CardDialog
              mode="create"
              trigger={
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Додати картку
                </Button>
              }
              onSubmit={async (card) => {
                await createCard({
                  deckId: activeDeck.id,
                  ...card,
                });
              }}
            />
          )}
        </div>
        <div className="mt-4 space-y-3">
          {activeCards.map((card) => {
            const stateLabel = getStateLabel(card.fsrs.state);
            const dueLabel = isDue(card.fsrs)
              ? "Потрібно зараз"
              : formatRelativeDay(card.fsrs.due);
            return (
              <div
                key={card.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{card.front}</div>
                    <div className="text-xs text-muted-foreground">
                      {card.back}
                    </div>
                    {card.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border/60 px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full border border-border/60 px-2 py-0.5">
                        {stateLabel}
                      </span>
                      <span className="rounded-full border border-border/60 px-2 py-0.5">
                        {dueLabel}
                      </span>
                      <span className="rounded-full border border-border/60 px-2 py-0.5">
                        {card.reps} повторень
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <CardDialog
                        mode="edit"
                        card={card}
                        trigger={
                          <div className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
                            <Pencil className="size-4" />
                            Редагувати
                          </div>
                        }
                        onSubmit={async (updated) => {
                          await updateCard(card.id, updated);
                        }}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="size-4" />
                            Видалити
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Видалити цю картку?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Цю дію не можна скасувати.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Скасувати</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCard(card.id)}
                            >
                              Видалити
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
        {/* </TabsContent>
        </Tabs> */}
      </section>
    </div>
  );
}

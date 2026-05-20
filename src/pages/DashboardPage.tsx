import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  Layers3,
  Sparkles,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "../components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";
import { Progress } from "../components/ui/progress";
import {
  getDeckStats,
  getDueCards,
  getUpcomingSchedule,
  getWeakCards,
} from "../data/derived";
import { useAppData } from "../data/appData";
import { formatNumber, formatPercent, formatRelativeDay } from "../lib/format";

const activityConfig: ChartConfig = {
  reviews: { label: "Повторення", color: "var(--color-chart-3)" },
};

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
};

function StatCard({ title, value, helper, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { status, error, cards, decks, activity, retentionRate, streak } =
    useAppData();

  if (status !== "ready") {
    const message =
      status === "misconfigured"
        ? "Додайте змінні Supabase, щоб завантажити живі дані."
        : status === "unauthenticated"
          ? "Увійдіть, щоб завантажити ваші колоди та картки."
          : status === "error"
            ? (error ?? "Не вдалося завантажити дані.")
            : "Завантажуємо навчальні дані...";

    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Дані недоступні</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/auth">Перейти до входу</Link>
        </Button>
      </div>
    );
  }

  const totalCards = cards.length;
  const dueToday = getDueCards(cards).length;
  const totalReviews = cards.reduce((sum, card) => sum + card.reps, 0);
  const schedule = getUpcomingSchedule(cards, 7);
  const maxSchedule = Math.max(...schedule.map((item) => item.count), 1);
  const deckStats = decks.map((deck) => ({
    deck,
    stats: getDeckStats(deck.id, cards),
  }));
  const weakCards = getWeakCards(cards, 5);
  const deckMap = new Map(decks.map((deck) => [deck.id, deck.title]));

  const statCards: StatCardProps[] = [
    {
      title: "Карток",
      value: formatNumber(totalCards),
      helper: "У всіх колодах",
      icon: Layers3,
    },
    {
      title: "На сьогодні",
      value: formatNumber(dueToday),
      helper: "Готові до повторення",
      icon: CalendarClock,
    },
    {
      title: "Ефективність",
      value: formatPercent(retentionRate),
      helper: "Середнє запам’ятовування",
      icon: Activity,
    },
    {
      title: "Серія",
      value: `${streak} днів`,
      helper: "Щоденна серія практики",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Активність
              </p>
              <h2 className="text-lg font-semibold">
                Графік повторення за 30 днів
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/analytics" className="inline-flex items-center gap-2">
                Переглянути аналітику
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6">
            <ChartContainer className="h-full w-full" config={activityConfig}>
              <AreaChart
                data={activity}
                margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="activityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="10%"
                      stopColor="var(--color-reviews)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="90%"
                      stopColor="var(--color-reviews)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={32}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  stroke="var(--color-reviews)"
                  fill="url(#activityGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Усього повторень</span>
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(totalReviews)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Прогноз
            </p>
            <h2 className="text-lg font-semibold">Майбутнє навантаження</h2>
          </div>
          <div className="mt-4 space-y-3">
            {schedule.map((item) => (
              <div key={item.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.date}</span>
                  <span>{formatNumber(item.count)} карток</span>
                </div>
                <Progress value={(item.count / maxSchedule) * 100} />
              </div>
            ))}
          </div>
          {/* <Button asChild className="mt-5 w-full">
            <Link to="/review">Планувати наступну сесію</Link>
          </Button> */}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Колоди
              </p>
              <h2 className="text-lg font-semibold">Прогрес за колодами</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/decks">Керувати колодами</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {deckStats.map(({ deck, stats }) => {
              const progress =
                stats.total === 0 ? 0 : (stats.reviewCount / stats.total) * 100;
              return (
                <div
                  key={deck.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{deck.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {deck.description}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{formatNumber(stats.dueToday)} до повторення</div>
                      <div>{formatNumber(stats.total)} усього</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={progress} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Список повторень
            </p>
            <h2 className="text-lg font-semibold">Картки для закріплення</h2>
          </div>
          <div className="mt-4 space-y-3">
            {weakCards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{card.front}</p>
                    <p className="text-xs text-muted-foreground">
                      {deckMap.get(card.deckId)} - {card.lapses} разів невдало
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{formatRelativeDay(card.fsrs.due)}</div>
                    <div>{formatNumber(card.reps)} пройдено разів</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-5 w-full" variant="secondary">
            <Link to="/review">Почати повторення</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

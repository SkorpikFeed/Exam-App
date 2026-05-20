import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3, Target, TrendingUp } from "lucide-react";

// import { Button } from "../components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAppData } from "../data/appData";
import { getCardsByDeck, getDeckStats, getWeakCards } from "../data/derived";
import { formatNumber, formatPercent, formatRelativeDay } from "../lib/format";

const retentionConfig: ChartConfig = {
  retention: { label: "Ефектинвість", color: "var(--color-chart-2)" },
};

export default function AnalyticsPage() {
  const { status, error, cards, decks, retentionSeries, retentionRate } =
    useAppData();

  if (status !== "ready") {
    const message =
      status === "misconfigured"
        ? "Додайте змінні Supabase, щоб завантажити живі дані."
        : status === "unauthenticated"
          ? "Увійдіть, щоб переглянути аналітику."
          : status === "error"
            ? (error ?? "Не вдалося завантажити дані.")
            : "Завантажуємо аналітику...";

    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Аналітика недоступна</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  const weakCards = getWeakCards(cards, 4);

  const deckInsights = decks.map((deck) => {
    const deckCards = getCardsByDeck(deck.id, cards);
    const stats = getDeckStats(deck.id, cards);
    const avgInterval = deckCards.length
      ? Math.round(
          deckCards.reduce((sum, card) => sum + card.fsrs.scheduled_days, 0) /
            deckCards.length,
        )
      : 0;
    const matureRate = stats.total
      ? (stats.reviewCount / stats.total) * 100
      : 0;

    return { deck, stats, avgInterval, matureRate };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Аналітика
            </p>
            <h2 className="text-2xl font-semibold">
              Аналітика ефективності пригадування
            </h2>
          </div>
          {/* <Button variant="outline">Експортувати звіт</Button> */}
        </div>
      </section>

      <Tabs defaultValue="retention">
        <TabsList>
          <TabsTrigger value="retention">Пригадування</TabsTrigger>
          <TabsTrigger value="decks">Аналітика колод</TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Тренд пригадування
                  </p>
                  <h3 className="text-lg font-semibold">
                    Графік приросту ефективності пригадування
                  </h3>
                </div>
                <BarChart3 className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-5">
                <ChartContainer className="h-full" config={retentionConfig}>
                  <LineChart
                    data={retentionSeries}
                    margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
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
                    <Line
                      type="monotone"
                      dataKey="retention"
                      stroke="var(--color-retention)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Середнє пригадування
                  </p>
                  <h3 className="text-lg font-semibold mt-3">
                    {formatPercent(retentionRate)}
                  </h3>
                </div>
                <Target className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <Progress value={retentionRate * 100} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Повторюйте щодня, щоб досягти 90% пригадування.
              </p>
              <div className="mt-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Слабкі картки
                </p>
                {weakCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-3"
                  >
                    <div className="text-sm font-semibold">{card.front}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeDay(card.fsrs.due)} - {card.lapses} разів
                      невдало
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="decks" className="mt-6 space-y-4">
          {deckInsights.map((entry) => (
            <div
              key={entry.deck.id}
              className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {entry.deck.subject}
                  </p>
                  <h3 className="text-lg font-semibold">{entry.deck.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {entry.deck.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="size-4" />
                  Середній інтервал {entry.avgInterval} дн.
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Усього</div>
                  <div className="text-lg font-semibold">
                    {formatNumber(entry.stats.total)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Сьогодні</div>
                  <div className="text-lg font-semibold">
                    {formatNumber(entry.stats.dueToday)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">
                    До вивчення
                  </div>
                  <div className="text-lg font-semibold">
                    {formatNumber(entry.stats.learningCount)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Вивчено</div>
                  <div className="text-lg font-semibold">
                    {formatPercent(entry.matureRate / 100)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={entry.matureRate} />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

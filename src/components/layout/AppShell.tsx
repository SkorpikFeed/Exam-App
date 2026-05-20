import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  BookOpen,
  LayoutDashboard,
  Layers3,
  LineChart,
  ShieldCheck,
  UserCircle,
  Flame,
  CalendarCheck,
  MoonStar,
  SunMedium,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useAppData } from "../../data/appData";
import { getDueCards } from "../../data/derived";
import { formatNumber } from "../../lib/format";
import { cn } from "../../lib/utils";

const navItems = [
  { label: "Дашборд", to: "/", icon: LayoutDashboard },
  { label: "Колоди", to: "/decks", icon: Layers3 },
  { label: "Повторення", to: "/review", icon: BookOpen },
  { label: "Аналітика", to: "/analytics", icon: LineChart },
  { label: "Профіль", to: "/profile", icon: UserCircle },
  { label: "Адмін", to: "/admin", icon: ShieldCheck },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { profile, decks, cards, signOut } = useAppData();
  const dueToday = getDueCards(cards).length;
  const badgeLabel = "MVP";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,_#d7e9ff,_transparent),radial-gradient(1200px_600px_at_90%_-10%,_#ffe3cf,_transparent)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="flex flex-col gap-6 rounded-[32px] border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <BookOpen className="size-4" />
                </span>
                ExamDeck
              </div>
              <p className="text-xs text-muted-foreground">Вивчай ефективно</p>
            </div>
            <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {badgeLabel}
            </span>
          </div>

          <div className="grid gap-3 rounded-3xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarCheck className="size-3.5" />
                На сьогодні
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatNumber(dueToday)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Flame className="size-3.5" />
                Активні колоди
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatNumber(decks.length)}
              </span>
            </div>
            <Button asChild size="sm" className="w-full">
              <NavLink to="/review">Почати повторення</NavLink>
            </Button>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {navItems
              .filter(
                (item) => item.label !== "Адмін" || profile?.role === "admin",
              )
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex min-w-[140px] items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-muted/70 hover:text-foreground lg:min-w-0",
                        isActive
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-foreground/70",
                      )
                    }
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </NavLink>
                );
              })}
          </nav>

          <div className="mt-auto flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold">
                {(profile?.name ?? "Гість").slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-medium leading-none">
                  {profile?.name ?? "Гість"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {profile?.email ?? "Не зареєстрований"}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <span className="sr-only">Меню акаунта</span>
                  <UserCircle className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Акаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile">Налаштування</NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Вийти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card/70 px-5 py-4 shadow-sm backdrop-blur">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Навчальна панель
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                Почни повторення прямо зараз
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* <input
                className="h-10 w-56 rounded-3xl border border-border/60 bg-background/70 px-4 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                placeholder="Пошук карток, колод"
              /> */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 rounded-3xl border border-border/60 bg-background/70 px-3 py-2 text-xs">
                    <SunMedium className="size-3.5 text-muted-foreground" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) =>
                        setTheme(checked ? "dark" : "light")
                      }
                      size="sm"
                    />
                    <MoonStar className="size-3.5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Перемкнути тему</TooltipContent>
              </Tooltip>
              {/* <Button asChild variant="outline">
                <NavLink to="/decks">Нова колода</NavLink>
              </Button>
              <Button asChild>
                <NavLink to="/review">Повторити зараз</NavLink>
              </Button> */}
            </div>
          </header>

          <main className="min-w-0 flex-1 animate-in fade-in-0 slide-in-from-bottom-2">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

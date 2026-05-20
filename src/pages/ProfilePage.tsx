import { BookOpen, Mail, UserCircle } from "lucide-react";

import { useEffect, useState } from "react";

import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { useAppData } from "../data/appData";
import { formatLongDate } from "../lib/format";

const inputClassName =
  "h-10 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export default function ProfilePage() {
  const { status, error, profile, decks, updateProfile } = useAppData();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  if (status !== "ready") {
    const message =
      status === "misconfigured"
        ? "Додайте змінні Supabase, щоб завантажити живі дані."
        : status === "unauthenticated"
          ? "Увійдіть, щоб переглянути профіль."
          : status === "error"
            ? (error ?? "Не вдалося завантажити дані.")
            : "Завантажуємо профіль...";

    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Профіль недоступний</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Профіль
            </p>
            <h2 className="text-2xl font-semibold">Налаштування акаунта</h2>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              setBusy(true);
              setStatusMessage(null);
              setErrorMessage(null);
              const ok = await updateProfile({
                name: name.trim(),
                bio: bio.trim(),
              });
              if (ok) {
                setStatusMessage("Профіль збережено.");
              } else {
                setErrorMessage("Не вдалося зберегти профіль.");
              }
              setBusy(false);
            }}
            disabled={busy}
          >
            Зберегти профіль
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <UserCircle className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Основна інформація
              </p>
              <h3 className="text-lg font-semibold">Особисті дані</h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Ваше ім'я
              </label>
              <input
                className={inputClassName}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-3xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                {profile?.email ?? ""}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Про ваш напрям навчання
              </label>
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Опишіть свій навчальний фокус"
              />
            </div>
            {errorMessage ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </p>
            ) : null}
            {statusMessage ? (
              <p className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <BookOpen className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Налаштування
                </p>
                <h3 className="text-lg font-semibold">Керування навчанням</h3>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Щоденний ліміт нових карток
                </label>
                <Select defaultValue="8" disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Оберіть ліміт" />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 6, 8, 10, 12].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} карток
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-sm">
                <div>
                  <p className="font-semibold">Щоденне нагадування</p>
                  <p className="text-xs text-muted-foreground">
                    Нагадувати, коли повторення вже заплановані
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              {/* <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-sm">
                <div>
                  <p className="font-semibold">Автоматично переходити далі</p>
                  <p className="text-xs text-muted-foreground">
                    Переходити до наступної картки після оцінки
                  </p>
                </div>
                <Switch />
              </div> */}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Статус акаунта
            </p>
            <h3 className="text-lg font-semibold">Підсумок підписки</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              У системі з {formatLongDate(profile?.createdAt ?? new Date())} -{" "}
              {decks.length} колод
            </p>
            {/* <Button variant="outline" className="mt-4 w-full">
              Керувати підпискою
            </Button> */}
          </div>
        </div>
      </section>
    </div>
  );
}

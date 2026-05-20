import { type ComponentType } from "react";
import { ShieldCheck, Trash2, UserCircle } from "lucide-react";

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
import { Switch } from "../components/ui/switch";
import { useAppData } from "../data/appData";
import { formatLongDate, formatNumber } from "../lib/format";

type StatCardProps = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
};

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { status, error, users, toggleUserActive, deleteUser } = useAppData();

  const handleToggleActive = async (id: string, active: boolean) => {
    await toggleUserActive(id, active);
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
  };

  if (status !== "ready") {
    const message =
      status === "misconfigured"
        ? "Додайте змінні Supabase, щоб завантажити реальні дані."
        : status === "unauthenticated"
          ? "Увійдіть з акаунтом адміністратора, щоб переглянути користувачів."
          : status === "error"
            ? (error ?? "Не вдалося завантажити дані.")
            : "Завантажуємо адмін-панель...";

    return (
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Адмін-дані недоступні</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Адмін-панель
            </p>
            <h2 className="text-2xl font-semibold">Системні операції</h2>
          </div>
          {/* <Button variant="outline">Згенерувати звіт</Button> */}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <StatCard
          label="Користувачів"
          value={formatNumber(totalUsers)}
          icon={UserCircle}
        />
        <StatCard
          label="Активні користувачі"
          value={formatNumber(activeUsers)}
          icon={ShieldCheck}
        />
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Користувачі
            </p>
            <h3 className="text-lg font-semibold">Керувати акаунтами</h3>
          </div>
          {/* <Button size="sm">Запросити користувача</Button> */}
        </div>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.email} - {user.role}
                </p>
                <p className="text-xs text-muted-foreground">
                  У системі з {formatLongDate(user.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Активний</span>
                  <Switch
                    checked={user.active}
                    onCheckedChange={(checked) =>
                      handleToggleActive(user.id, checked)
                    }
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg">
                      <Trash2 className="size-4" />
                      Видалити користувача
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Видалити цього користувача?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {user.name} втратить доступ. Цю дію не можна скасувати.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Видалити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

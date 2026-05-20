import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Textarea } from "./textarea";
import type { Deck } from "../../data/types";

const inputClassName =
  "h-10 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

type DeckDialogProps = {
  mode: "create" | "edit";
  deck?: Deck;
  trigger: React.ReactNode;
  onSubmit: (deck: Omit<Deck, "id" | "createdAt">) => Promise<void>;
};

export function DeckDialog({ mode, deck, trigger, onSubmit }: DeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(deck?.title ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [subject, setSubject] = useState(deck?.subject ?? "");
  const [newLimit, setNewLimit] = useState(String(deck?.newLimit ?? 8));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Deck name is required");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim() || "General",
        newLimit: Math.max(1, Math.min(20, parseInt(newLimit) || 8)),
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save deck");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "create" ? "Створити нову колоду" : "Редагувати колоду"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Назва колоди
            </label>
            <input
              className={inputClassName}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="напр., Алгоритми"
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Опис
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Що буде вивчатися?"
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Предмет
            </label>
            <input
              className={inputClassName}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="напр., Математика"
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Нових карт на сесію
            </label>
            <input
              className={inputClassName}
              type="number"
              min="1"
              max="20"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              disabled={busy}
            />
          </div>
          {error && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Збереження...
              </>
            ) : (
              "Зберегти"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
import type { CardItem } from "../../data/types";

const inputClassName =
  "h-10 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

type CardDialogProps = {
  mode: "create" | "edit";
  card?: CardItem;
  trigger: React.ReactNode;
  onSubmit: (card: {
    front: string;
    back: string;
    tags: string[];
  }) => Promise<void>;
};

export function CardDialog({ mode, card, trigger, onSubmit }: CardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [tags, setTags] = useState(card?.tags.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!front.trim()) {
      setError("Card prompt is required");
      return;
    }
    if (!back.trim()) {
      setError("Card answer is required");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        front: front.trim(),
        back: back.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save card");
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
            {mode === "create" ? "Створити нову картку" : "Редагувати картку"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Питання
            </label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Яке питання ви хочете поставити?"
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Відповідь
            </label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Якою є відповідь?"
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Теги (через кому)
            </label>
            <input
              className={inputClassName}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="напр., розділ-1, важливо"
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

import { Link } from "react-router-dom";
import { Ghost } from "lucide-react";

import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Ghost className="size-6" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold">Сторінку не знайдено</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Сторінка, яку ви шукаєте, не існує або була переміщена.
        </p>
      </div>
      <Button asChild>
        <Link to="/">На головну</Link>
      </Button>
    </div>
  );
}

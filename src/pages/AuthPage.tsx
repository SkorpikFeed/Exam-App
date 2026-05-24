import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp } from "lucide-react";

import { Button } from "../components/ui/button";
// import { Checkbox } from "../components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAppData } from "../data/appData";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const inputClassName =
  "h-10 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export default function AuthPage() {
  const navigate = useNavigate();
  const { refresh } = useAppData();
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase ще не налаштовано.");
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });
    if (error) {
      setErrorMessage(error.message);
    } else {
      await refresh();
      navigate("/");
    }
    setBusy(false);
  };

  const handleSignUp = async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase ще не налаштовано.");
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: {
          name: signUpName,
        },
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setBusy(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: signUpEmail,
      password: signUpPassword,
    });

    if (signInError) {
      setStatusMessage(
        data.user?.identities?.length
          ? "Перевірте пошту, щоб підтвердити акаунт."
          : "Акаунт створено. Тепер можна увійти.",
      );
    } else {
      await refresh();
      navigate("/");
    }
    setBusy(false);
  };

  // const handleResetPassword = async () => {
  //   if (!isSupabaseConfigured) {
  //     setErrorMessage("Supabase ще не налаштовано.");
  //     return;
  //   }
  //   if (!signInEmail) {
  //     setErrorMessage("Введіть email, щоб скинути пароль.");
  //     return;
  //   }
  //   setBusy(true);
  //   setErrorMessage(null);
  //   setStatusMessage(null);
  //   const { error } = await supabase.auth.resetPasswordForEmail(signInEmail);
  //   if (error) {
  //     setErrorMessage(error.message);
  //   } else {
  //     setStatusMessage("Лист для скидання пароля надіслано.");
  //   }
  //   setBusy(false);
  // };

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm my-5">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Чому ExamDeck
        </p>
        <h2 className="mt-2 text-xl font-semibold">Вивчайте ефектино</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Відстежуйте прогрес, створюйте колоди та картки та дозвольте алгоритму
          FSRS керувати повтореннями за вас.
        </p>
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Розумне планування</p>
              <p className="text-xs text-muted-foreground">
                Адаптивні інтервали, налаштовані для кожної картки.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <TrendingUp className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Аналітика результативності
              </p>
              <p className="text-xs text-muted-foreground">
                Швидко знаходьте слабкі місця.
              </p>
            </div>
          </div>
        </div>
        {/* <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/">
            Подивитися гостем
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button> */}
      </div>
      <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Ласкаво просимо
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          Увійдіть у свій навчальний простір
        </h1>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList>
            <TabsTrigger value="signin">Увійти</TabsTrigger>
            <TabsTrigger value="signup">Створити акаунт</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Email
              </label>
              <input
                className={inputClassName}
                placeholder="you@example.com"
                value={signInEmail}
                onChange={(event) => setSignInEmail(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Пароль
              </label>
              <input
                className={inputClassName}
                placeholder="********"
                type="password"
                value={signInPassword}
                onChange={(event) => setSignInPassword(event.target.value)}
              />
            </div>
            {/* <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label className="flex items-center gap-2">
                <Checkbox />
                Запам’ятати мене
              </label>
              <Button variant="link" size="sm" onClick={handleResetPassword}>
                Скинути пароль
              </Button>
            </div> */}
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
            <Button className="w-full" onClick={handleSignIn} disabled={busy}>
              Увійти
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Продовжити як демо</Link>
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Ім’я та прізвище
              </label>
              <input
                className={inputClassName}
                placeholder="Ваше ім’я"
                value={signUpName}
                onChange={(event) => setSignUpName(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Email
              </label>
              <input
                className={inputClassName}
                placeholder="you@example.com"
                value={signUpEmail}
                onChange={(event) => setSignUpEmail(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Пароль
              </label>
              <input
                className={inputClassName}
                placeholder="Створіть пароль"
                type="password"
                value={signUpPassword}
                onChange={(event) => setSignUpPassword(event.target.value)}
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
            <Button className="w-full" onClick={handleSignUp} disabled={busy}>
              Створити акаунт
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

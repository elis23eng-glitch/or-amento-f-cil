import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/orcai/brand";
import { Field } from "@/components/orcai/field";

const searchSchema = z.object({
  modo: z.enum(["entrar", "cadastro", "recuperar"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Orçai" },
      {
        name: "description",
        content: "Acesse o Orçai ou crie sua conta para testar 7 dias grátis, sem cartão.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Orçai" },
      {
        property: "og:description",
        content: "Acesse sua conta do Orçai ou comece o teste gratuito de 7 dias.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres").max(72),
});

function AuthPage() {
  const { modo = "entrar" } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    setError(null);
    setInfo(null);
  }, [modo]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (modo === "recuperar") {
      const parsed = z.string().trim().email().safeParse(email);
      if (!parsed.success) return setError("Informe um e-mail válido.");
      setLoading(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (err) return setError("Não foi possível enviar o e-mail agora. Tente novamente.");
      setInfo("Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.");
      return;
    }

    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");

    setLoading(true);
    if (modo === "cadastro") {
      if (fullName.trim().length < 2) {
        setLoading(false);
        return setError("Informe seu nome.");
      }
      const { data, error: err } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/painel`,
          data: { full_name: fullName.trim().slice(0, 120) },
        },
      });
      setLoading(false);
      if (err) {
        return setError(
          err.message.includes("registered")
            ? "Já existe uma conta com esse e-mail. Tente entrar."
            : "Não foi possível criar a conta. Verifique os dados e tente novamente.",
        );
      }
      if (data.session) {
        navigate({ to: "/painel/empresa", replace: true });
      } else {
        setInfo(
          "Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme para entrar e começar o teste.",
        );
      }
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (err) {
      return setError(
        err.message.toLowerCase().includes("confirm")
          ? "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."
          : "E-mail ou senha incorretos.",
      );
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/painel", replace: true });
  }

  const titles = {
    entrar: "Entrar no Orçai",
    cadastro: "Criar conta — 7 dias grátis",
    recuperar: "Recuperar senha",
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-block">
          <BrandMark />
        </Link>
        <form onSubmit={handleSubmit} className="surface grid gap-4 p-6" noValidate>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand">{titles[modo]}</h1>
            {modo === "cadastro" ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Sem cartão de crédito. O teste começa assim que a conta é criada.
              </p>
            ) : null}
          </div>

          {modo === "cadastro" ? (
            <Field label="Seu nome" required>
              {(p) => (
                <Input
                  {...p}
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}
            </Field>
          ) : null}

          <Field label="E-mail" required>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>

          {modo !== "recuperar" ? (
            <Field
              label="Senha"
              hint={modo === "cadastro" ? "Mínimo de 8 caracteres." : undefined}
              required
            >
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={password}
                  autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          {info ? (
            <p role="status" className="rounded-lg bg-success/12 p-3 text-sm text-success">
              {info}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="h-12 bg-accent text-base font-bold text-accent-foreground hover:brightness-95"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : null}
            {modo === "entrar" ? "Entrar" : modo === "cadastro" ? "Criar conta" : "Enviar link"}
          </Button>

          <div className="grid gap-2 text-center text-sm">
            {modo !== "entrar" ? (
              <Link to="/auth" search={{ modo: "entrar" }} className="font-semibold text-brand">
                Já tenho conta — entrar
              </Link>
            ) : null}
            {modo !== "cadastro" ? (
              <Link to="/auth" search={{ modo: "cadastro" }} className="font-semibold text-brand">
                Criar conta grátis
              </Link>
            ) : null}
            {modo !== "recuperar" ? (
              <Link
                to="/auth"
                search={{ modo: "recuperar" }}
                className="text-muted-foreground underline"
              >
                Esqueci minha senha
              </Link>
            ) : null}
          </div>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com a{" "}
          <Link to="/privacidade" className="underline">
            política de privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

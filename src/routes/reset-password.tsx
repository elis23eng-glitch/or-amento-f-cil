import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/orcai/brand";
import { Field } from "@/components/orcai/field";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Orçai" },
      { name: "description", content: "Defina uma nova senha para sua conta do Orçai." },
      { property: "og:title", content: "Criar nova senha — Orçai" },
      { property: "og:description", content: "Defina uma nova senha para sua conta do Orçai." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return void setError("A senha precisa ter ao menos 8 caracteres.");
    if (password !== confirm) return void setError("As senhas não conferem.");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return void setError("Não foi possível alterar a senha. Abra o link do e-mail novamente.");
    toast.success("Senha alterada.");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-block">
          <BrandMark />
        </Link>
        <form onSubmit={handleSubmit} className="surface grid gap-4 p-6">
          <h1 className="font-display text-2xl font-extrabold text-brand">Criar nova senha</h1>
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Abra esta página pelo link enviado ao seu e-mail. Se o link expirou,{" "}
              <Link to="/auth" search={{ modo: "recuperar" }} className="underline">
                peça um novo
              </Link>
              .
            </p>
          ) : (
            <>
              <Field label="Nova senha" required>
                {(p) => (
                  <Input
                    {...p}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Repita a nova senha" required>
                {(p) => (
                  <Input
                    {...p}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                )}
              </Field>
              {error ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 bg-accent font-bold text-accent-foreground"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                Salvar nova senha
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

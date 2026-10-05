import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, STATUS_LABELS } from "@/components/orcai/status-badge";
import { getDashboard } from "@/lib/quotes.functions";
import { formatCents, formatDateBR } from "@/lib/money";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel/")({
  component: Overview,
});

function Overview() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
  });
  const [note, setNote] = useState("");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return void toast.error("Escreva o lembrete.");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error: err } = await supabase
      .from("reminders")
      .insert({ owner_id: u.user!.id, note: note.trim().slice(0, 300), due_on: due });
    setSaving(false);
    if (err) return void toast.error("Não foi possível salvar o lembrete.");
    setNote("");
    toast.success("Lembrete salvo.");
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function done(id: string) {
    await supabase.from("reminders").update({ done: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  if (isLoading) return <Loader2 className="mx-auto size-6 animate-spin text-brand" />;
  if (error || !data) return <p className="text-destructive">Não foi possível carregar o painel.</p>;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate font-display text-2xl font-extrabold text-brand">Visão geral</h1>
        {data.access.can_create ? (
          <Button asChild className="h-11 shrink-0 bg-accent font-bold text-accent-foreground">
            <Link to="/painel/orcamentos/$id" params={{ id: "novo" }}>
              <Plus className="size-4" /> Novo orçamento
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.keys(STATUS_LABELS).map((s) => (
          <div key={s} className="surface p-3">
            <StatusBadge status={s} />
            <p className="mt-2 font-display text-2xl font-extrabold">{data.byStatus[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="surface p-4">
        <p className="text-sm text-muted-foreground">Valor total de propostas aprovadas manualmente</p>
        <p className="font-display text-2xl font-extrabold text-brand">
          {formatCents(data.approvedTotalCents)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Soma das propostas que você marcou como aprovadas. Não representa valores recebidos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-4">
          <h2 className="font-display text-lg font-bold">Propostas recentes</h2>
          <ul className="mt-3 divide-y divide-border">
            {data.recent.map((q) => (
              <li key={q.id}>
                <Link
                  to="/painel/orcamentos/$id"
                  params={{ id: q.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      nº {q.number} · {q.client_name || "Sem cliente"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateBR(q.quote_date)} · {formatCents(q.total_cents)}
                    </span>
                  </span>
                  <StatusBadge status={q.status} />
                </Link>
              </li>
            ))}
            {data.recent.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">
                Nenhum orçamento ainda. Comece cadastrando sua empresa e crie o primeiro.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="surface p-4">
          <h2 className="font-display text-lg font-bold">Lembretes de retorno</h2>
          <form onSubmit={addReminder} className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Input
              aria-label="Lembrete"
              placeholder="Ex.: ligar para a Maria sobre a reforma"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Input aria-label="Data" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Adicionar
            </Button>
          </form>
          <ul className="mt-3 divide-y divide-border">
            {data.reminders.map((r) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2">
                <span className="min-w-0 text-sm">
                  <span className="font-semibold">{formatDateBR(r.due_on)}</span> — {r.note}
                </span>
                <Button size="sm" variant="outline" onClick={() => done(r.id)}>
                  <Check className="size-4" /> Feito
                </Button>
              </li>
            ))}
            {data.reminders.length === 0 ? (
              <li className="py-2 text-sm text-muted-foreground">Nenhum lembrete pendente.</li>
            ) : null}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Lembretes aparecem só aqui; nenhuma mensagem é enviada automaticamente.
          </p>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/orcai/brand";
import { adminAudit, adminConfirmPayment, adminOverview, adminSetSetting, adminSetSubscription, adminUpdateLead, amIAdmin } from "@/lib/admin.functions";
import { formatCents, formatDateBR, parseMoneyToCents } from "@/lib/money";
import { formatBRPhone } from "@/lib/phone";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — Orçai" }, { name: "description", content: "Área restrita da administração do Orçai." }, { property: "og:title", content: "Administração — Orçai" }, { property: "og:description", content: "Área restrita." }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const LEAD_STATUS = { novo: "Novo", contatado: "Contatado", em_teste: "Em teste", pagante: "Pagante", inativo: "Inativo" } as const;

function AdminPage() {
  const me = useQuery({ queryKey: ["am-i-admin"], queryFn: () => amIAdmin() });
  if (me.isLoading) return <Loader2 className="mx-auto mt-10 size-6 animate-spin" />;
  if (!me.data?.admin)
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="surface max-w-md p-6 text-center">
          <h1 className="font-display text-xl font-extrabold text-brand">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta área é exclusiva da administração do Orçai.</p>
          <Button asChild className="mt-4"><Link to="/painel">Voltar ao painel</Link></Button>
        </div>
      </div>
    );
  return <AdminContent />;
}

function AdminContent() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin"], queryFn: () => adminOverview() });
  const audit = useQuery({ queryKey: ["admin-audit"], queryFn: () => adminAudit() });
  const [wa, setWa] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { setWa(q.data?.settings.admin_whatsapp ? formatBRPhone(q.data.settings.admin_whatsapp) : ""); }, [q.data]);

  async function run(label: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(label);
    try { await fn(); toast.success(ok); qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["admin-audit"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro."); }
    finally { setBusy(null); }
  }

  if (q.isLoading || !q.data) return <Loader2 className="mx-auto mt-10 size-6 animate-spin" />;
  const d = q.data;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="flex min-w-0 items-center gap-2"><BrandMark /><span className="truncate text-sm font-bold text-accent">Administração</span></span>
          <Button asChild variant="ghost" size="sm"><Link to="/painel">Meu painel</Link></Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Leads", d.metrics.leads], ["Cadastros", d.metrics.signups], ["Publicaram 1º orçamento", d.metrics.published_first], ["Assinantes ativos", d.metrics.active_subscribers], ["Pagamentos confirmados", d.metrics.confirmed_payments]].map(([l, v]) => (
            <div key={l} className="surface p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-2xl font-extrabold text-brand">{v}</p></div>
          ))}
        </div>

        <section className="surface grid gap-2 p-4">
          <h2 className="font-display text-lg font-bold">WhatsApp da administradora</h2>
          <div className="flex flex-wrap gap-2">
            <Input aria-label="WhatsApp da administradora" className="max-w-xs" inputMode="tel" placeholder="(DDD) número" value={wa} onChange={(e) => setWa(e.target.value)} />
            <Button disabled={!!busy} onClick={() => run("wa", () => adminSetSetting({ data: { key: "admin_whatsapp", value: wa || null } }), "WhatsApp salvo.")}>Salvar</Button>
          </div>
          {!d.settings.admin_whatsapp ? <p className="text-xs text-warning-foreground">Não configurado: pedidos são salvos com contato pendente.</p> : null}
        </section>

        <section className="surface grid gap-3 p-4">
          <h2 className="font-display text-lg font-bold">Leads e contatos</h2>
          <ul className="grid gap-2">
            {d.leads.map((l) => (
              <li key={l.id} className="grid gap-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span className="min-w-0">
                  <span className="block font-semibold">{l.name} · {formatBRPhone(l.whatsapp)}</span>
                  <span className="text-xs text-muted-foreground">{l.profession} · {l.city} · {l.monthly_quotes}/mês · {l.interest === "contratar" ? "quer contratar" : "quer testar"} · marketing: {l.marketing_consent ? "sim" : "não"} · {formatDateBR(l.created_at.slice(0, 10))}</span>
                </span>
                <select aria-label="Status do lead" className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={l.status} disabled={!!busy}
                  onChange={(e) => run("lead", () => adminUpdateLead({ data: { id: l.id, status: e.target.value as keyof typeof LEAD_STATUS, admin_notes: l.admin_notes } }), "Lead atualizado.")}>
                  {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </li>
            ))}
            {d.leads.length === 0 ? <li className="text-sm text-muted-foreground">Nenhum lead ainda.</li> : null}
          </ul>
        </section>

        <section className="surface grid gap-3 p-4">
          <h2 className="font-display text-lg font-bold">Usuários, testes e assinaturas</h2>
          <ul className="grid gap-3">
            {d.users.map((u) => <UserRow key={u.id} u={u} today={today} busy={!!busy} run={run} />)}
          </ul>
        </section>

        <section className="surface grid gap-2 p-4 text-sm">
          <h2 className="font-display text-lg font-bold">Pagamentos confirmados</h2>
          {d.payments.map((p) => {
            const user = d.users.find((u) => u.id === p.user_id);
            const by = d.users.find((u) => u.id === p.confirmed_by);
            return <p key={p.id}>{formatDateBR(p.paid_on)} · {user?.email ?? p.user_id} · {formatCents(p.amount_cents)} · {p.method ?? "—"} · confirmado por {by?.email ?? p.confirmed_by} em {formatDateBR(p.confirmed_at.slice(0, 10))}</p>;
          })}
          {d.payments.length === 0 ? <p className="text-muted-foreground">Nenhum pagamento confirmado.</p> : null}
        </section>

        <section className="surface grid gap-1 p-4 text-xs">
          <h2 className="font-display text-lg font-bold">Registro administrativo</h2>
          {(audit.data ?? []).map((a) => (
            <p key={a.id}>{new Date(a.created_at).toLocaleString("pt-BR")} · {d.users.find((u) => u.id === a.actor_id)?.email ?? a.actor_id} · {a.action} · {a.target}</p>
          ))}
        </section>
      </main>
    </div>
  );
}

type AdminUser = Awaited<ReturnType<typeof adminOverview>>["users"][number];

function UserRow({ u, today, busy, run }: { u: AdminUser; today: string; busy: boolean; run: (l: string, fn: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const plus30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [amount, setAmount] = useState("29,90");
  const [paidOn, setPaidOn] = useState(today);
  const [method, setMethod] = useState("Pix");
  const [starts, setStarts] = useState(today);
  const [ends, setEnds] = useState(plus30);
  const trialActive = new Date(u.trial_ends_at).getTime() > Date.now();
  const sub = u.subscription;
  return (
    <li className="grid gap-2 rounded-lg border border-border p-3 text-sm">
      <p className="font-semibold">{u.email ?? u.id} {u.full_name ? `· ${u.full_name}` : ""}</p>
      <p className="text-xs text-muted-foreground">
        Teste: {formatDateBR(u.trial_started_at.slice(0, 10))} → {formatDateBR(u.trial_ends_at.slice(0, 10))} ({trialActive ? "ativo" : "vencido"}) · Publicou orçamento: {u.published_first ? "sim" : "não"} · Assinatura: {sub ? `${sub.status}${sub.ends_on ? ` até ${formatDateBR(sub.ends_on)}` : ""}` : "nenhuma"}
        {sub?.ends_on && sub.ends_on < today ? " — renovação pendente" : ""}
      </p>
      <details>
        <summary className="cursor-pointer text-xs font-bold text-brand">Confirmar pagamento / vigência</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <Input aria-label="Valor" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input aria-label="Pago em" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          <Input aria-label="Forma" value={method} onChange={(e) => setMethod(e.target.value)} />
          <Input aria-label="Início" type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
          <Input aria-label="Fim" type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => {
            const cents = parseMoneyToCents(amount);
            if (cents === null) return toast.error("Valor inválido.");
            run("pay", () => adminConfirmPayment({ data: { user_id: u.id, amount_cents: cents, paid_on: paidOn, method, note: null, starts_on: starts, ends_on: ends } }), "Pagamento confirmado.");
          }}>Confirmar pagamento</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("sub", () => adminSetSubscription({ data: { user_id: u.id, status: "encerrada", starts_on: sub?.starts_on ?? null, ends_on: today } }), "Assinatura encerrada.")}>Encerrar assinatura</Button>
        </div>
      </details>
    </li>
  );
}

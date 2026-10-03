import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, STATUS_LABELS } from "@/components/orcai/status-badge";
import { listQuotes } from "@/lib/quotes.functions";
import { formatCents, formatDateBR } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/painel/orcamentos/")({
  component: QuotesList,
});

type StatusFilter = "todos" | "rascunho" | "publicado" | "aprovado" | "recusado" | "vencido";

function QuotesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filters = { search: search || undefined, status, from: from || undefined, to: to || undefined };
  const { data, isLoading } = useQuery({
    queryKey: ["quotes", filters],
    queryFn: () => listQuotes({ data: filters }),
  });

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate font-display text-2xl font-extrabold text-brand">Orçamentos</h1>
        <Button asChild className="h-11 shrink-0 bg-accent font-bold text-accent-foreground">
          <Link to="/painel/orcamentos/$id" params={{ id: "novo" }}>
            <Plus className="size-4" /> Novo
          </Link>
        </Button>
      </div>

      <div className="surface grid gap-3 p-3 sm:grid-cols-4">
        <Input aria-label="Buscar por cliente" placeholder="Buscar cliente" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          aria-label="Status"
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input aria-label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input aria-label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto size-6 animate-spin text-brand" />
      ) : (
        <ul className="grid gap-2">
          {(data ?? []).map((q) => (
            <li key={q.id}>
              <Link
                to="/painel/orcamentos/$id"
                params={{ id: q.id }}
                className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 hover:border-brand/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    nº {q.number} · {q.client_name || "Sem cliente"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {q.title || "Sem título"} · {formatDateBR(q.quote_date)}
                  </span>
                </span>
                <span className="grid shrink-0 justify-items-end gap-1">
                  <StatusBadge status={q.status} />
                  <span className="text-sm font-bold">{formatCents(q.total_cents)}</span>
                </span>
              </Link>
            </li>
          ))}
          {data && data.length === 0 ? (
            <li className="surface p-4 text-sm text-muted-foreground">Nenhum orçamento encontrado.</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

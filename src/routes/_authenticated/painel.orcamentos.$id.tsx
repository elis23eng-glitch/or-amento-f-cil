import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Copy,
  Download,
  Eye,
  Files,
  Loader2,
  MessageCircle,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field } from "@/components/orcai/field";
import { ProposalView } from "@/components/orcai/proposal-view";
import { StatusBadge } from "@/components/orcai/status-badge";
import { supabase } from "@/integrations/supabase/client";
import {
  confirmSent,
  deleteQuote,
  duplicateQuote,
  getQuote,
  getQuoteVersion,
  nextQuoteNumber,
  publishQuote,
  saveQuote,
  setQuoteStatus,
  setTokenRevoked,
} from "@/lib/quotes.functions";
import {
  centsToInput,
  computeTotals,
  formatCents,
  formatDateBR,
  itemTotalCents,
  parseBRNumber,
  parseMoneyToCents,
  quantityIsValid,
  UNIT_LABELS,
  UNITS,
} from "@/lib/money";
import { normalizeBRPhone, waLink } from "@/lib/phone";
import { PROJECT_TYPES, SERVICE_SUGGESTIONS, type QuoteSnapshot } from "@/lib/quote-snapshot";
import { useAccess } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/orcamentos/$id")({
  component: QuoteEditor,
});

type ItemForm = { key: string; description: string; unit: string; quantity: string; price: string };

type FormState = {
  quote_date: string;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  client_kind: "pf" | "pj";
  service_location: string;
  project_type: string;
  title: string;
  description: string;
  payment_terms: string;
  execution_term: string;
  valid_until: string;
  inclusions: string;
  exclusions: string;
  notes: string;
  extra: string;
  discount: string;
  tax: string;
  bdi: string;
  items: ItemForm[];
};

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const newKey = () => Math.random().toString(36).slice(2);

const EMPTY: FormState = {
  quote_date: today(),
  client_id: null,
  client_name: "",
  client_phone: "",
  client_kind: "pf",
  service_location: "",
  project_type: PROJECT_TYPES[0],
  title: "",
  description: "",
  payment_terms: "",
  execution_term: "",
  valid_until: plusDays(15),
  inclusions: "",
  exclusions: "",
  notes: "",
  extra: "",
  discount: "",
  tax: "",
  bdi: "",
  items: [{ key: newKey(), description: "", unit: "m2", quantity: "", price: "" }],
};

function parsePercent(v: string) {
  const n = parseBRNumber(v);
  return n === null ? 0 : n;
}

function buildPayload(f: FormState) {
  const errors: string[] = [];
  const items = f.items
    .filter((i) => i.description.trim() || i.quantity || i.price)
    .map((i, idx) => {
      const q = parseBRNumber(i.quantity);
      const p = parseMoneyToCents(i.price || "0");
      if (!i.description.trim()) errors.push(`Item ${idx + 1}: informe a descrição.`);
      if (q === null || !quantityIsValid(q))
        errors.push(`Item ${idx + 1}: quantidade deve ser maior que zero, com até 2 casas decimais.`);
      if (p === null || p < 0) errors.push(`Item ${idx + 1}: preço unitário inválido.`);
      return {
        description: i.description.trim(),
        unit: i.unit as (typeof UNITS)[number],
        quantity: q ?? 0,
        unit_price_cents: p ?? 0,
      };
    });
  const extra = parseMoneyToCents(f.extra || "0");
  const discount = parseMoneyToCents(f.discount || "0");
  const tax = parseBRNumber(f.tax || "0");
  const bdi = parseBRNumber(f.bdi || "0");
  if (extra === null || extra < 0) errors.push("Despesas adicionais inválidas.");
  if (discount === null || discount < 0) errors.push("Desconto inválido.");
  if (tax === null || tax < 0 || tax > 100) errors.push("Impostos devem estar entre 0% e 100%.");
  if (bdi === null || bdi < 0 || bdi > 500) errors.push("BDI deve estar entre 0% e 500%.");
  if (!f.client_name.trim()) errors.push("Informe o nome do cliente.");

  const totals = computeTotals({
    items,
    extra_costs_cents: extra ?? 0,
    discount_cents: discount ?? 0,
    tax_percent: tax ?? 0,
    bdi_percent: bdi ?? 0,
  });
  if ((discount ?? 0) > totals.before_discount_cents)
    errors.push("O desconto não pode ser maior que o valor antes do desconto.");

  const n = (s: string) => (s.trim() ? s.trim() : null);
  return {
    errors,
    totals,
    payload: {
      quote_date: f.quote_date,
      client_id: f.client_id,
      client_name: f.client_name.trim(),
      client_phone: n(f.client_phone),
      client_kind: f.client_kind,
      service_location: n(f.service_location),
      project_type: n(f.project_type),
      title: n(f.title),
      description: n(f.description),
      payment_terms: n(f.payment_terms),
      execution_term: n(f.execution_term),
      valid_until: f.valid_until || null,
      inclusions: n(f.inclusions),
      exclusions: n(f.exclusions),
      notes: n(f.notes),
      extra_costs_cents: extra ?? 0,
      discount_cents: discount ?? 0,
      tax_percent: tax ?? 0,
      bdi_percent: bdi ?? 0,
      items,
    },
  };
}

function QuoteEditor() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const access = useAccess();

  const quoteQ = useQuery({
    queryKey: ["quote", id],
    queryFn: () => getQuote({ data: { id } }),
    enabled: !isNew,
  });
  const numberQ = useQuery({
    queryKey: ["next-number"],
    queryFn: () => nextQuoteNumber(),
    enabled: isNew,
  });
  const companyQ = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").maybeSingle();
      let logoUrl: string | null = null;
      if (data?.logo_path) {
        const { data: s } = await supabase.storage.from("logos").createSignedUrl(data.logo_path, 3600);
        logoUrl = s?.signedUrl ?? null;
      }
      return { company: data, logoUrl };
    },
  });
  const catalogQ = useQuery({
    queryKey: ["catalog"],
    queryFn: async () =>
      (await supabase.from("catalog_services").select("*").order("description")).data ?? [],
  });
  const clientsQ = useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await supabase.from("clients").select("*").order("name")).data ?? [],
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastShare, setLastShare] = useState<{ url: string; message: string } | null>(null);

  useEffect(() => {
    if (isNew) {
      setForm({ ...EMPTY, items: [{ ...EMPTY.items[0], key: newKey() }] });
      setDirty(false);
      return;
    }
    const d = quoteQ.data;
    if (!d) return;
    const q = d.quote;
    setForm({
      quote_date: q.quote_date,
      client_id: q.client_id,
      client_name: q.client_name ?? "",
      client_phone: q.client_phone ?? "",
      client_kind: q.client_kind,
      service_location: q.service_location ?? "",
      project_type: q.project_type ?? "",
      title: q.title ?? "",
      description: q.description ?? "",
      payment_terms: q.payment_terms ?? "",
      execution_term: q.execution_term ?? "",
      valid_until: q.valid_until ?? "",
      inclusions: q.inclusions ?? "",
      exclusions: q.exclusions ?? "",
      notes: q.notes ?? "",
      extra: q.extra_costs_cents ? centsToInput(q.extra_costs_cents) : "",
      discount: q.discount_cents ? centsToInput(q.discount_cents) : "",
      tax: Number(q.tax_percent) ? String(q.tax_percent).replace(".", ",") : "",
      bdi: Number(q.bdi_percent) ? String(q.bdi_percent).replace(".", ",") : "",
      items: d.items.map((i) => ({
        key: i.id,
        description: i.description,
        unit: i.unit,
        quantity: String(i.quantity).replace(".", ","),
        price: centsToInput(i.unit_price_cents),
      })),
    });
    setDirty(false);
  }, [isNew, quoteQ.data]);

  // Aviso de alterações não salvas
  useBlocker({
    shouldBlockFn: () => {
      if (!dirty) return false;
      return !window.confirm("Há alterações não salvas. Deseja sair mesmo assim?");
    },
    enableBeforeUnload: dirty,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }
  function updateItem(index: number, patch: Partial<ItemForm>) {
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));
    setDirty(true);
  }
  function moveItem(index: number, dir: -1 | 1) {
    setForm((f) => {
      const items = [...f.items];
      const j = index + dir;
      if (j < 0 || j >= items.length) return f;
      const a = items[index]!; items[index] = items[j]!; items[j] = a;
      return { ...f, items };
    });
    setDirty(true);
  }
  function addItem(seed?: { description?: string; unit?: string; price?: string }) {
    setForm((f) => ({
      ...f,
      items: [...f.items, { key: newKey(), description: "", unit: "m2", quantity: "", price: "", ...seed }],
    }));
    setDirty(true);
  }

  const built = useMemo(() => buildPayload(form), [form]);
  const quote = quoteQ.data?.quote;
  const number = isNew ? numberQ.data?.number ?? 1 : quote?.number ?? 0;
  const company = companyQ.data?.company;

  const previewSnapshot: QuoteSnapshot = {
    company: {
      trade_name: company?.trade_name || "Cadastre sua empresa em “Minha empresa”",
      responsible_name: company?.responsible_name ?? null,
      whatsapp: company?.whatsapp ?? null,
      city: company?.city ?? null,
      cnpj: company?.cnpj ?? null,
      email: company?.email ?? null,
      address: company?.address ?? null,
      website: company?.website ?? null,
      logo_path: company?.logo_path ?? null,
    },
    quote: {
      number,
      ...built.payload,
      client_phone: built.payload.client_phone,
    } as QuoteSnapshot["quote"],
    items: built.payload.items.map((i) => ({
      ...i,
      total_cents: itemTotalCents(i.quantity, i.unit_price_cents),
    })),
    totals: built.totals,
  };

  const canCreate = access.data?.can_create ?? true;
  const readOnlyNew = isNew && !canCreate;

  async function doSave(): Promise<string | null> {
    if (built.errors.length) {
      setErrors(built.errors);
      toast.error("Corrija os campos destacados.");
      return null;
    }
    setErrors([]);
    const result = await saveQuote({ data: { ...built.payload, id: isNew ? null : id } });
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["quotes"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    if (isNew) {
      navigate({ to: "/painel/orcamentos/$id", params: { id: result.id }, replace: true });
    } else {
      await qc.invalidateQueries({ queryKey: ["quote", id] });
    }
    return result.id;
  }

  async function run<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    setBusy(label);
    try {
      return await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    const savedId = await run("save", doSave);
    if (savedId) toast.success("Rascunho salvo.");
  }

  async function ensurePublished(): Promise<{ url: string; total_cents: number } | null> {
    const savedId = dirty || isNew ? await doSave() : id;
    if (!savedId) return null;
    const fresh = await getQuote({ data: { id: savedId } });
    const latest = fresh.versions[0];
    const activeToken = latest
      ? fresh.tokens.find((t) => t.version_id === latest.id && !t.revoked_at)
      : undefined;
    const stale =
      !latest ||
      new Date(fresh.quote.updated_at).getTime() - new Date(latest.published_at).getTime() > 5000;
    if (!stale && activeToken && latest) {
      return { url: `${window.location.origin}/orcamento/${activeToken.token}`, total_cents: latest.total_cents };
    }
    const pub = await publishQuote({ data: { id: savedId } });
    await qc.invalidateQueries({ queryKey: ["quote", savedId] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success(`Proposta publicada (versão ${pub.version}).`);
    return { url: pub.url, total_cents: pub.total_cents };
  }

  function buildMessage(url: string, total: number) {
    return `Olá, ${form.client_name.trim()}! Segue a proposta ${number} da ${company?.trade_name ?? ""}, no valor de ${formatCents(total)}. Você pode visualizar os serviços e as condições neste link: ${url}. Qualquer dúvida, estou à disposição!`;
  }

  async function handlePublish() {
    const r = await run("publish", async () => {
      const savedId = dirty || isNew ? await doSave() : id;
      if (!savedId) return null;
      const pub = await publishQuote({ data: { id: savedId } });
      await qc.invalidateQueries({ queryKey: ["quote", savedId] });
      return pub;
    });
    if (r) {
      setLastShare({ url: r.url, message: buildMessage(r.url, r.total_cents) });
      toast.success(`Proposta publicada (versão ${r.version}).`);
    }
  }

  async function handleWhatsApp() {
    const phone = normalizeBRPhone(form.client_phone);
    if (!phone) {
      setErrors(["Telefone do cliente inválido. Informe DDD + número, ex.: (11) 91234-5678."]);
      toast.error("Corrija o telefone do cliente para abrir o WhatsApp.");
      return;
    }
    const win = window.open("", "_blank");
    const r = await run("wa", ensurePublished);
    if (!r) {
      win?.close();
      return;
    }
    const message = buildMessage(r.url, r.total_cents);
    setLastShare({ url: r.url, message });
    const link = waLink(phone, message);
    if (win) win.location.href = link;
    else window.location.href = link;
    toast.info("WhatsApp aberto. Depois de enviar, confirme o envio aqui.");
  }

  async function copyText(kind: "link" | "message") {
    const r = await run(kind, ensurePublished);
    if (!r) return;
    const message = buildMessage(r.url, r.total_cents);
    setLastShare({ url: r.url, message });
    try {
      await navigator.clipboard.writeText(kind === "link" ? r.url : message);
      toast.success(kind === "link" ? "Link copiado." : "Mensagem copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto abaixo e copie manualmente.");
    }
  }

  async function downloadPdf(mode: "published" | "draft") {
    await run("pdf-" + mode, async () => {
      const { generateQuotePdf, urlToDataUrl } = await import("@/lib/pdf");
      if (mode === "draft") {
        const logo = companyQ.data?.logoUrl ? await urlToDataUrl(companyQ.data.logoUrl) : null;
        await generateQuotePdf({ snapshot: previewSnapshot, logoDataUrl: logo, draft: true });
      } else {
        const latest = quoteQ.data?.versions[0];
        if (!latest) throw new Error("Publique a proposta para baixar o PDF oficial.");
        const v = await getQuoteVersion({ data: { version_id: latest.id } });
        const logo = v.logoUrl ? await urlToDataUrl(v.logoUrl) : null;
        await generateQuotePdf({ snapshot: v.snapshot, logoDataUrl: logo, version: v.version });
      }
      toast.success("PDF baixado.");
    });
  }

  async function saveToCatalog(index: number) {
    const it = form.items[index];
    if (!it) return;
    const price = parseMoneyToCents(it.price || "0");
    if (!it.description.trim() || price === null) return void toast.error("Preencha descrição e preço.");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("catalog_services").insert({
      owner_id: u.user!.id,
      description: it.description.trim().slice(0, 300),
      unit: it.unit,
      unit_price_cents: price,
    });
    if (error) return void toast.error("Não foi possível salvar no catálogo.");
    toast.success("Salvo nos serviços frequentes.");
    qc.invalidateQueries({ queryKey: ["catalog"] });
  }

  if (!isNew && quoteQ.isLoading) return <Loader2 className="mx-auto size-6 animate-spin text-brand" />;
  if (!isNew && (quoteQ.error || !quote))
    return (
      <p className="surface p-4 text-sm text-destructive">
        Orçamento não encontrado. <Link to="/painel/orcamentos" className="underline">Voltar</Link>
      </p>
    );

  if (readOnlyNew)
    return (
      <div className="surface p-5">
        <h1 className="font-display text-xl font-extrabold text-brand">Teste gratuito vencido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Para criar novos orçamentos, contrate o plano piloto. Seus orçamentos existentes continuam
          disponíveis.
        </p>
        <Button asChild className="mt-4 bg-whatsapp font-bold text-whatsapp-foreground">
          <Link to="/painel/plano">Contratar pelo WhatsApp</Link>
        </Button>
      </div>
    );

  const isDraft = isNew || quote?.status === "rascunho";
  const versions = quoteQ.data?.versions ?? [];
  const tokens = quoteQ.data?.tokens ?? [];

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold text-brand">
            Orçamento nº {number}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={quote?.status ?? "rascunho"} />
            {dirty ? <span className="font-semibold text-accent">Alterações não salvas</span> : null}
          </div>
        </div>
        <Button variant="outline" className="shrink-0 lg:hidden" onClick={() => setShowPreview((s) => !s)}>
          <Eye className="size-4" /> {showPreview ? "Editar" : "Prévia"}
        </Button>
      </div>

      {!company?.trade_name ? (
        <p className="rounded-xl border border-warning/50 bg-warning/15 p-3 text-sm text-warning-foreground">
          Cadastre sua empresa em <Link to="/painel/empresa" className="font-bold underline">Minha empresa</Link>{" "}
          antes de publicar. Os dados dela aparecem na proposta e no PDF.
        </p>
      ) : null}

      {errors.length ? (
        <ul role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className={showPreview ? "hidden lg:grid lg:gap-5" : "grid gap-5"}>
          {/* Cliente */}
          <section className="surface grid gap-4 p-4">
            <h2 className="font-display text-lg font-bold">Cliente</h2>
            {(clientsQ.data ?? []).length > 0 ? (
              <Field label="Escolher cliente salvo">
                {(p) => (
                  <select
                    id={p.id}
                    className="h-10 rounded-md border border-input bg-card px-2 text-sm"
                    value={form.client_id ?? ""}
                    onChange={(e) => {
                      const c = clientsQ.data?.find((x) => x.id === e.target.value);
                      setForm((f) => ({
                        ...f,
                        client_id: c?.id ?? null,
                        client_name: c?.name ?? f.client_name,
                        client_phone: c?.phone ?? f.client_phone,
                        client_kind: c?.kind ?? f.client_kind,
                      }));
                      setDirty(true);
                    }}
                  >
                    <option value="">— Novo cliente —</option>
                    {clientsQ.data?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do cliente" required>
                {(p) => <Input {...p} value={form.client_name} onChange={(e) => update("client_name", e.target.value)} />}
              </Field>
              <Field label="Telefone / WhatsApp" hint="Com DDD. Usado para abrir o WhatsApp.">
                {(p) => (
                  <Input {...p} inputMode="tel" value={form.client_phone} onChange={(e) => update("client_phone", e.target.value)} />
                )}
              </Field>
              <Field label="Tipo de cliente">
                {(p) => (
                  <select id={p.id} className="h-10 rounded-md border border-input bg-card px-2 text-sm" value={form.client_kind} onChange={(e) => update("client_kind", e.target.value as "pf" | "pj")}>
                    <option value="pf">Pessoa física</option>
                    <option value="pj">Pessoa jurídica</option>
                  </select>
                )}
              </Field>
              <Field label="Data do orçamento">
                {(p) => <Input {...p} type="date" value={form.quote_date} onChange={(e) => update("quote_date", e.target.value)} />}
              </Field>
              <Field label="Local do serviço" className="sm:col-span-2">
                {(p) => <Input {...p} value={form.service_location} onChange={(e) => update("service_location", e.target.value)} />}
              </Field>
            </div>
          </section>

          {/* Serviço */}
          <section className="surface grid gap-4 p-4">
            <h2 className="font-display text-lg font-bold">Serviço</h2>
            <Field label="Tipo de projeto">
              {(p) => (
                <select id={p.id} className="h-10 rounded-md border border-input bg-card px-2 text-sm" value={form.project_type} onChange={(e) => update("project_type", e.target.value)}>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Título do serviço">
              {(p) => <Input {...p} value={form.title} onChange={(e) => update("title", e.target.value)} />}
            </Field>
            <Field label="Descrição">
              {(p) => <Textarea {...p} rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />}
            </Field>
          </section>

          {/* Itens */}
          <section className="surface grid gap-3 p-4">
            <h2 className="font-display text-lg font-bold">Itens</h2>
            <ol className="grid gap-3">
              {form.items.map((it, index) => {
                const q = parseBRNumber(it.quantity);
                const p = parseMoneyToCents(it.price || "0");
                const lineTotal = q && p !== null && quantityIsValid(q) ? itemTotalCents(q, p) : 0;
                return (
                  <li key={it.key} className="grid gap-2 rounded-xl border border-border p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">Item {index + 1}</span>
                      <span className="flex shrink-0 gap-1">
                        <Button type="button" size="icon" variant="ghost" aria-label="Mover para cima" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" aria-label="Mover para baixo" onClick={() => moveItem(index, 1)} disabled={index === form.items.length - 1}>
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" aria-label="Remover item" onClick={() => { setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) })); setDirty(true); }}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </span>
                    </div>
                    <Field label="Descrição">
                      {(pp) => (
                        <Input {...pp} list="service-suggestions" value={it.description} onChange={(e) => updateItem(index, { description: e.target.value })} />
                      )}
                    </Field>
                    <div className="grid grid-cols-3 gap-2">
                      <Field label="Unidade">
                        {(pp) => (
                          <select id={pp.id} className="h-10 rounded-md border border-input bg-card px-1 text-sm" value={it.unit} onChange={(e) => updateItem(index, { unit: e.target.value })}>
                            {UNITS.map((u) => (
                              <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                            ))}
                          </select>
                        )}
                      </Field>
                      <Field label="Qtd.">
                        {(pp) => <Input {...pp} inputMode="decimal" value={it.quantity} placeholder="0" onChange={(e) => updateItem(index, { quantity: e.target.value })} />}
                      </Field>
                      <Field label="Preço un. (R$)">
                        {(pp) => <Input {...pp} inputMode="decimal" value={it.price} placeholder="0,00" onChange={(e) => updateItem(index, { price: e.target.value })} />}
                      </Field>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
                      <button type="button" className="justify-self-start text-xs font-semibold text-brand underline" onClick={() => saveToCatalog(index)}>
                        Salvar nos serviços frequentes
                      </button>
                      <span className="font-bold">{formatCents(lineTotal)}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
            <datalist id="service-suggestions">
              {SERVICE_SUGGESTIONS.map((s) => (
                <option key={s.description} value={s.description} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => addItem()}>
                <Plus className="size-4" /> Adicionar item
              </Button>
              {(catalogQ.data ?? []).length > 0 ? (
                <select
                  aria-label="Adicionar dos serviços frequentes"
                  className="h-9 min-w-0 max-w-full rounded-md border border-input bg-card px-2 text-sm"
                  value=""
                  onChange={(e) => {
                    const c = catalogQ.data?.find((x) => x.id === e.target.value);
                    if (c) addItem({ description: c.description, unit: c.unit, price: centsToInput(c.unit_price_cents) });
                  }}
                >
                  <option value="">+ Dos serviços frequentes…</option>
                  {catalogQ.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.description} — {formatCents(c.unit_price_cents)}/{UNIT_LABELS[c.unit] ?? c.unit}</option>
                  ))}
                </select>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Sugestões: {SERVICE_SUGGESTIONS.map((s) => s.description).join(", ")}. Os preços são sempre informados por você.
            </p>
          </section>

          {/* Valores */}
          <section className="surface grid gap-4 p-4">
            <h2 className="font-display text-lg font-bold">Valores</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Despesas adicionais (R$)" hint="Ex.: frete, caçamba, deslocamento.">
                {(p) => <Input {...p} inputMode="decimal" placeholder="0,00" value={form.extra} onChange={(e) => update("extra", e.target.value)} />}
              </Field>
              <Field label="Desconto (R$)">
                {(p) => <Input {...p} inputMode="decimal" placeholder="0,00" value={form.discount} onChange={(e) => update("discount", e.target.value)} />}
              </Field>
            </div>
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-bold text-brand">Ajustes avançados (impostos e BDI)</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Impostos (% do subtotal)">
                  {(p) => <Input {...p} inputMode="decimal" placeholder="0" value={form.tax} onChange={(e) => update("tax", e.target.value)} />}
                </Field>
                <Field label="BDI (% do subtotal)">
                  {(p) => <Input {...p} inputMode="decimal" placeholder="0" value={form.bdi} onChange={(e) => update("bdi", e.target.value)} />}
                </Field>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Total = subtotal + impostos + BDI + despesas adicionais − desconto. Impostos e BDI são
                calculados separadamente sobre o subtotal. O BDI (benefícios e despesas indiretas)
                não é margem de lucro líquida. Se o seu BDI já inclui impostos, deixe o campo de
                impostos em zero para não cobrá-los duas vezes.
              </p>
            </details>
            <div className="grid gap-1 rounded-xl bg-secondary p-3 text-sm">
              <Row label="Subtotal" value={formatCents(built.totals.subtotal_cents)} />
              <Row label="Impostos" value={formatCents(built.totals.taxes_cents)} />
              <Row label="BDI" value={formatCents(built.totals.bdi_cents)} />
              <Row label="Despesas adicionais" value={formatCents(built.totals.extra_costs_cents)} />
              <Row label="Desconto" value={`- ${formatCents(built.totals.discount_cents)}`} />
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] font-display text-lg font-extrabold text-brand">
                <span>Total</span>
                <span data-testid="quote-total">{formatCents(built.totals.total_cents)}</span>
              </div>
            </div>
          </section>

          {/* Condições */}
          <section className="surface grid gap-4 p-4">
            <h2 className="font-display text-lg font-bold">Condições</h2>
            <Field label="Condições de pagamento">
              {(p) => <Textarea {...p} rows={2} value={form.payment_terms} onChange={(e) => update("payment_terms", e.target.value)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prazo de execução">
                {(p) => <Input {...p} value={form.execution_term} onChange={(e) => update("execution_term", e.target.value)} />}
              </Field>
              <Field label="Validade da proposta">
                {(p) => <Input {...p} type="date" value={form.valid_until} onChange={(e) => update("valid_until", e.target.value)} />}
              </Field>
            </div>
            <Field label="Inclusões">
              {(p) => <Textarea {...p} rows={2} value={form.inclusions} onChange={(e) => update("inclusions", e.target.value)} />}
            </Field>
            <Field label="Exclusões">
              {(p) => <Textarea {...p} rows={2} value={form.exclusions} onChange={(e) => update("exclusions", e.target.value)} />}
            </Field>
            <Field label="Observações" hint="Aparecem na proposta para o cliente.">
              {(p) => <Textarea {...p} rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />}
            </Field>
          </section>
        </div>

        {/* Prévia + ações */}
        <aside className={showPreview ? "grid content-start gap-4" : "hidden content-start gap-4 lg:grid"}>
          <div className="surface sticky top-28 grid gap-2 p-3">
            <Button onClick={handleSave} disabled={!!busy} variant="outline" className="h-11 font-bold">
              {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar rascunho
            </Button>
            <Button onClick={handlePublish} disabled={!!busy || !canCreate} className="h-11 bg-accent font-bold text-accent-foreground">
              {busy === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Publicar proposta
            </Button>
            <Button onClick={handleWhatsApp} disabled={!!busy} className="h-11 bg-whatsapp font-bold text-whatsapp-foreground">
              {busy === "wa" ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              Compartilhar no WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => copyText("link")} disabled={!!busy}>
                {busy === "link" ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />} Copiar link
              </Button>
              <Button variant="outline" onClick={() => copyText("message")} disabled={!!busy}>
                {busy === "message" ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />} Copiar mensagem
              </Button>
              <Button variant="outline" onClick={() => downloadPdf("published")} disabled={!!busy || versions.length === 0}>
                {busy === "pdf-published" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Baixar PDF
              </Button>
              <Button variant="outline" onClick={() => downloadPdf("draft")} disabled={!!busy}>
                {busy === "pdf-draft" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} PDF rascunho
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compartilhar, copiar e baixar usam a versão publicada; se houver mudanças, uma nova
              versão é publicada antes. Qualquer pessoa com o link verá a proposta. O PDF não é
              anexado automaticamente no WhatsApp.
            </p>
            {lastShare ? (
              <div className="grid gap-2 rounded-lg bg-secondary p-2 text-xs">
                <p className="break-all"><strong>Link:</strong> {lastShare.url}</p>
                <p className="break-words"><strong>Mensagem:</strong> {lastShare.message}</p>
              </div>
            ) : null}
            {!isNew && quote && quote.status !== "rascunho" ? (
              <div className="grid gap-2 border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">
                  {quote.sent_confirmed_at
                    ? `Envio confirmado em ${formatDateBR(quote.sent_confirmed_at.slice(0, 10))}.`
                    : "Abrir o WhatsApp não confirma o envio. Confirme quando tiver enviado."}
                </p>
                {!quote.sent_confirmed_at ? (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("sent", async () => { await confirmSent({ data: { id } }); await qc.invalidateQueries({ queryKey: ["quote", id] }); toast.success("Envio confirmado."); })}>
                    Confirmar que enviei
                  </Button>
                ) : null}
                <div className="grid grid-cols-3 gap-1">
                  {(["aprovado", "recusado", "vencido"] as const).map((s) => (
                    <Button key={s} size="sm" variant={quote.status === s ? "default" : "outline"} disabled={!!busy} onClick={() => run("st", async () => { await setQuoteStatus({ data: { id, status: s } }); await qc.invalidateQueries({ queryKey: ["quote", id] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Status atualizado."); })}>
                      {s === "aprovado" ? "Aprovado" : s === "recusado" ? "Recusado" : "Vencido"}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {!isNew ? (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
                <Button size="sm" variant="ghost" disabled={!!busy || !canCreate} onClick={() => run("dup", async () => { const r = await duplicateQuote({ data: { id } }); toast.success("Orçamento duplicado."); navigate({ to: "/painel/orcamentos/$id", params: { id: r.id } }); })}>
                  <Files className="size-4" /> Duplicar
                </Button>
                {isDraft ? (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="size-4" /> Excluir
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          {versions.length > 0 ? (
            <div className="surface grid gap-2 p-3 text-sm">
              <h3 className="font-display font-bold">Versões publicadas</h3>
              <ul className="grid gap-2">
                {versions.map((v) => {
                  const vTokens = tokens.filter((t) => t.version_id === v.id);
                  return (
                    <li key={v.id} className="rounded-lg border border-border p-2">
                      <p className="font-semibold">
                        Versão {v.version} · {formatCents(v.total_cents)} · {formatDateBR(v.published_at.slice(0, 10))}
                      </p>
                      {vTokens.map((t) => (
                        <div key={t.id} className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs">
                          <a href={`/orcamento/${t.token}`} target="_blank" rel="noreferrer" className={t.revoked_at ? "truncate text-muted-foreground line-through" : "truncate text-brand underline"}>
                            /orcamento/{t.token.slice(0, 10)}…
                          </a>
                          <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run("rev", async () => { await setTokenRevoked({ data: { id: t.id, revoked: !t.revoked_at } }); await qc.invalidateQueries({ queryKey: ["quote", id] }); toast.success(t.revoked_at ? "Link reativado." : "Link revogado."); })}>
                            {t.revoked_at ? <><Undo2 className="size-3" /> Reativar</> : <><Ban className="size-3" /> Revogar</>}
                          </Button>
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted-foreground">
                Versões publicadas não mudam quando você edita o orçamento ou a empresa.
              </p>
            </div>
          ) : null}

          <ProposalView snapshot={previewSnapshot} logoUrl={companyQ.data?.logoUrl} draft />
        </aside>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              O orçamento nº {number} será excluído definitivamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                run("del", async () => {
                  await deleteQuote({ data: { id } });
                  setDirty(false);
                  qc.invalidateQueries({ queryKey: ["quotes"] });
                  toast.success("Rascunho excluído.");
                  navigate({ to: "/painel/orcamentos" });
                })
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

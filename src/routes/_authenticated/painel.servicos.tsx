import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/orcai/field";
import { supabase } from "@/integrations/supabase/client";
import { formatCents, parseMoneyToCents, UNIT_LABELS, UNITS } from "@/lib/money";
import { SERVICE_SUGGESTIONS } from "@/lib/quote-snapshot";

export const Route = createFileRoute("/_authenticated/painel/servicos")({
  component: CatalogPage,
});

function CatalogPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: async () => (await supabase.from("catalog_services").select("*").order("description")).data ?? [],
  });
  const [form, setForm] = useState({ description: "", unit: "m2", price: "" });
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const price = parseMoneyToCents(form.price);
    if (!form.description.trim()) return toast.error("Informe a descrição.");
    if (price === null || price < 0) return toast.error("Preço inválido.");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("catalog_services").insert({
      owner_id: u.user!.id, description: form.description.trim().slice(0, 300), unit: form.unit, unit_price_cents: price,
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Serviço salvo.");
    setForm({ description: "", unit: "m2", price: "" });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("catalog_services").delete().eq("id", id);
    if (error) return toast.error("Não foi possível excluir.");
    qc.invalidateQueries({ queryKey: ["catalog"] });
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand">Serviços frequentes</h1>
        <p className="text-sm text-muted-foreground">Seu catálogo privado, com seus próprios preços.</p>
      </div>
      <form onSubmit={add} className="surface grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_120px_140px]">
        <Field label="Descrição" required>{(p) => <Input {...p} list="sugs" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}</Field>
        <Field label="Unidade">
          {(p) => (
            <select id={p.id} className="h-10 rounded-md border border-input bg-card px-2 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
            </select>
          )}
        </Field>
        <Field label="Preço (R$)" required>{(p) => <Input {...p} inputMode="decimal" placeholder="0,00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />}</Field>
        <datalist id="sugs">{SERVICE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
        <Button type="submit" disabled={saving} className="h-11 bg-accent font-bold text-accent-foreground sm:col-span-3">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Adicionar serviço
        </Button>
      </form>
      {isLoading ? <Loader2 className="mx-auto size-6 animate-spin" /> : (
        <ul className="grid gap-2">
          {(data ?? []).map((c) => (
            <li key={c.id} className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-3">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.description}</span>
                <span className="text-xs text-muted-foreground">{formatCents(c.unit_price_cents)} / {UNIT_LABELS[c.unit] ?? c.unit}</span>
              </span>
              <Button size="icon" variant="ghost" aria-label="Excluir serviço" onClick={() => remove(c.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
          {data?.length === 0 ? <li className="surface p-4 text-sm text-muted-foreground">Nenhum serviço salvo ainda.</li> : null}
        </ul>
      )}
    </div>
  );
}

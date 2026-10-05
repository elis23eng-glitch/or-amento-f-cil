import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/orcai/field";
import { supabase } from "@/integrations/supabase/client";
import { formatBRPhone, normalizeBRPhone } from "@/lib/phone";

export const Route = createFileRoute("/_authenticated/painel/clientes")({
  component: ClientsPage,
});

function ClientsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await supabase.from("clients").select("*").order("name")).data ?? [],
  });
  const [form, setForm] = useState({ name: "", phone: "", kind: "pf" as "pf" | "pj", city: "" });
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return void toast.error("Informe o nome do cliente.");
    if (form.phone && !normalizeBRPhone(form.phone)) return void toast.error("Telefone inválido. Use DDD + número.");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("clients").insert({
      owner_id: u.user!.id,
      name: form.name.trim().slice(0, 160),
      phone: form.phone ? normalizeBRPhone(form.phone) : null,
      kind: form.kind,
      city: form.city.trim().slice(0, 120) || null,
    });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar o cliente.");
    toast.success("Cliente salvo.");
    setForm({ name: "", phone: "", kind: "pf", city: "" });
    qc.invalidateQueries({ queryKey: ["clients"] });
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este cliente? Orçamentos existentes não são alterados.")) return;
    await supabase.from("quotes").update({ client_id: null }).eq("client_id", id);
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return void toast.error("Não foi possível excluir.");
    qc.invalidateQueries({ queryKey: ["clients"] });
  }

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-2xl font-extrabold text-brand">Clientes</h1>
      <form onSubmit={add} className="surface grid gap-3 p-4 sm:grid-cols-2">
        <Field label="Nome" required>{(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
        <Field label="Telefone">{(p) => <Input {...p} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}</Field>
        <Field label="Tipo">
          {(p) => (
            <select id={p.id} className="h-10 rounded-md border border-input bg-card px-2 text-sm" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "pf" | "pj" })}>
              <option value="pf">Pessoa física</option>
              <option value="pj">Pessoa jurídica</option>
            </select>
          )}
        </Field>
        <Field label="Cidade">{(p) => <Input {...p} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}</Field>
        <Button type="submit" disabled={saving} className="sm:col-span-2 h-11 bg-accent font-bold text-accent-foreground">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Adicionar cliente
        </Button>
      </form>
      {isLoading ? <Loader2 className="mx-auto size-6 animate-spin" /> : (
        <ul className="grid gap-2">
          {(data ?? []).map((c) => (
            <li key={c.id} className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-3">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {c.kind === "pj" ? "PJ" : "PF"}{c.phone ? ` · ${formatBRPhone(c.phone)}` : ""}{c.city ? ` · ${c.city}` : ""}
                </span>
              </span>
              <Button size="icon" variant="ghost" aria-label={`Excluir ${c.name}`} onClick={() => remove(c.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
          {data?.length === 0 ? <li className="surface p-4 text-sm text-muted-foreground">Nenhum cliente salvo.</li> : null}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/orcai/field";
import { supabase } from "@/integrations/supabase/client";
import { normalizeBRPhone, formatBRPhone } from "@/lib/phone";

export const Route = createFileRoute("/_authenticated/painel/empresa")({
  component: CompanyPage,
});

const schema = z.object({
  trade_name: z.string().trim().min(2, "Informe o nome comercial ou seu nome").max(160),
  responsible_name: z.string().trim().max(160),
  whatsapp: z.string().trim().max(30),
  city: z.string().trim().max(120),
  cnpj: z.string().trim().max(20).refine((v) => !v || v.replace(/\D/g, "").length === 14, "CNPJ deve ter 14 dígitos"),
  email: z.string().trim().max(255).refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido"),
  address: z.string().trim().max(300),
  website: z.string().trim().max(200),
});

const EMPTY = { trade_name: "", responsible_name: "", whatsapp: "", city: "", cnpj: "", email: "", address: "", website: "" };
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

function CompanyPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
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
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const c = q.data?.company;
    if (c) setForm({
      trade_name: c.trade_name ?? "", responsible_name: c.responsible_name ?? "", whatsapp: c.whatsapp ? formatBRPhone(c.whatsapp) : "",
      city: c.city ?? "", cnpj: c.cnpj ?? "", email: c.email ?? "", address: c.address ?? "", website: c.website ?? "",
    });
  }, [q.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
    if (form.whatsapp && !normalizeBRPhone(form.whatsapp)) errs.whatsapp = "WhatsApp inválido. Use DDD + número.";
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.success) return toast.error("Corrija os campos destacados.");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const n = (s: string) => s || null;
    const row = {
      owner_id: u.user!.id, trade_name: parsed.data.trade_name, responsible_name: n(parsed.data.responsible_name),
      whatsapp: form.whatsapp ? normalizeBRPhone(form.whatsapp) : null, city: n(parsed.data.city), cnpj: n(parsed.data.cnpj),
      email: n(parsed.data.email), address: n(parsed.data.address), website: n(parsed.data.website), updated_at: new Date().toISOString(),
    };
    const existing = q.data?.company;
    const { error } = existing
      ? await supabase.from("companies").update(row).eq("id", existing.id)
      : await supabase.from("companies").insert(row);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Empresa salva.");
    await qc.invalidateQueries({ queryKey: ["company"] });
    if (!existing) navigate({ to: "/painel" });
  }

  async function upload(file: File) {
    if (!ALLOWED.includes(file.type)) return toast.error("Use uma imagem PNG, JPG ou WEBP.");
    if (file.size > 2 * 1024 * 1024) return toast.error("A logo deve ter no máximo 2 MB.");
    if (!q.data?.company) return toast.error("Salve os dados da empresa antes de enviar a logo.");
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${u.user!.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { contentType: file.type });
    if (error) { setUploading(false); return toast.error("Falha no envio da logo."); }
    await supabase.from("companies").update({ logo_path: path }).eq("id", q.data.company.id);
    setUploading(false);
    toast.success("Logo atualizada.");
    qc.invalidateQueries({ queryKey: ["company"] });
  }

  if (q.isLoading) return <Loader2 className="mx-auto size-6 animate-spin" />;

  const F = (key: keyof typeof EMPTY, label: string, opts: { required?: boolean; hint?: string; type?: string } = {}) => (
    <Field label={label} required={opts.required} hint={opts.hint} error={errors[key]}>
      {(p) => <Input {...p} type={opts.type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}
    </Field>
  );

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand">Minha empresa</h1>
        <p className="text-sm text-muted-foreground">
          {q.data?.company ? "Estes dados aparecem nas próximas propostas publicadas." : "Primeiro acesso: cadastre sua empresa ou seu nome profissional. CNPJ é opcional."}
        </p>
      </div>
      <form onSubmit={save} className="surface grid gap-4 p-4 sm:grid-cols-2" noValidate>
        {F("trade_name", "Nome comercial ou nome do profissional", { required: true })}
        {F("responsible_name", "Nome do responsável")}
        {F("whatsapp", "WhatsApp", { hint: "Com DDD." })}
        {F("city", "Cidade")}
        {F("cnpj", "CNPJ (opcional)")}
        {F("email", "E-mail (opcional)", { type: "email" })}
        {F("address", "Endereço (opcional)")}
        {F("website", "Site ou rede social (opcional)")}
        <Button type="submit" disabled={saving} className="h-11 bg-accent font-bold text-accent-foreground sm:col-span-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar empresa
        </Button>
      </form>
      <section className="surface grid gap-3 p-4">
        <h2 className="font-display text-lg font-bold">Logo (opcional)</h2>
        {q.data?.logoUrl ? <img src={q.data.logoUrl} alt="Logo atual" className="size-24 rounded-lg border border-border object-contain p-1" /> : <p className="text-sm text-muted-foreground">Nenhuma logo enviada.</p>}
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-semibold">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Enviar logo
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        </label>
        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP, até 2 MB.</p>
      </section>
    </div>
  );
}

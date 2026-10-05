import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTotals, itemTotalCents, quantityIsValid } from "./money";
import type { QuoteSnapshot } from "./quote-snapshot";

const itemSchema = z.object({
  description: z.string().trim().min(1, "Descreva o serviço ou material").max(300),
  unit: z.enum(["m2", "un", "m", "dias", "vb"]),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  unit_price_cents: z.number().int().min(0, "O preço não pode ser negativo"),
});

const quoteSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  quote_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  client_id: z.string().uuid().nullable().optional(),
  client_name: z.string().trim().min(1, "Informe o nome do cliente").max(160),
  client_phone: z.string().trim().max(40).nullable().optional(),
  client_kind: z.enum(["pf", "pj"]),
  service_location: z.string().trim().max(240).nullable().optional(),
  project_type: z.string().trim().max(120).nullable().optional(),
  title: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  payment_terms: z.string().trim().max(1000).nullable().optional(),
  execution_term: z.string().trim().max(300).nullable().optional(),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  inclusions: z.string().trim().max(2000).nullable().optional(),
  exclusions: z.string().trim().max(2000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  extra_costs_cents: z.number().int().min(0, "Despesas adicionais não podem ser negativas"),
  discount_cents: z.number().int().min(0, "O desconto não pode ser negativo"),
  tax_percent: z.number().min(0).max(100),
  bdi_percent: z.number().min(0).max(500),
  items: z.array(itemSchema).max(300),
});

export type QuotePayload = z.infer<typeof quoteSchema>;

function validateAndCompute(data: QuotePayload) {
  for (const item of data.items) {
    if (!quantityIsValid(item.quantity)) {
      throw new Error(
        `Quantidade inválida em "${item.description}": use um número maior que zero com no máximo duas casas decimais.`,
      );
    }
  }
  const totals = computeTotals({
    items: data.items,
    extra_costs_cents: data.extra_costs_cents,
    discount_cents: data.discount_cents,
    tax_percent: data.tax_percent,
    bdi_percent: data.bdi_percent,
  });
  if (data.discount_cents > totals.before_discount_cents) {
    throw new Error("O desconto não pode ser maior que o valor antes do desconto.");
  }
  if (totals.total_cents < 0) {
    throw new Error("O total não pode ser negativo.");
  }
  return totals;
}

async function accessState(supabase: ReturnType<typeof Object>, userId: string) {
  const { getAccessState } = await import("./access.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getAccessState(supabase as any, userId);
}

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => accessState(context.supabase, context.userId));

export const listQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: z
          .enum(["rascunho", "publicado", "aprovado", "recusado", "vencido", "todos"])
          .optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("quotes")
      .select(
        "id, number, status, quote_date, client_name, client_phone, title, total_cents, valid_until, updated_at",
      )
      .eq("owner_id", context.userId)
      .order("number", { ascending: false });

    if (data.status && data.status !== "todos") query = query.eq("status", data.status);
    if (data.search) query = query.ilike("client_name", `%${data.search}%`);
    if (data.from) query = query.gte("quote_date", data.from);
    if (data.to) query = query.lte("quote_date", data.to);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getQuote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: quote, error } = await context.supabase
      .from("quotes")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!quote) throw new Error("Orçamento não encontrado.");

    const { data: items } = await context.supabase
      .from("quote_items")
      .select("id, description, unit, quantity, unit_price_cents, total_cents, position")
      .eq("quote_id", data.id)
      .order("position", { ascending: true });

    const { data: versions } = await context.supabase
      .from("quote_versions")
      .select("id, version, total_cents, published_at, valid_until")
      .eq("quote_id", data.id)
      .order("version", { ascending: false });

    const { data: tokens } = await context.supabase
      .from("share_tokens")
      .select("id, token, version_id, revoked_at, created_at")
      .eq("quote_id", data.id)
      .order("created_at", { ascending: false });

    return {
      quote,
      items: (items ?? []).map((i) => ({ ...i, quantity: Number(i.quantity) })),
      versions: versions ?? [],
      tokens: tokens ?? [],
    };
  });

export const nextQuoteNumber = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("quotes")
      .select("number")
      .eq("owner_id", context.userId)
      .order("number", { ascending: false })
      .limit(1);
    return { number: (data?.[0]?.number ?? 0) + 1 };
  });

export const saveQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quoteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const totals = validateAndCompute(data);

    if (!data.id) {
      const access = await accessState(supabase, userId);
      if (!access.can_create) {
        throw new Error(
          "Seu teste gratuito venceu. Contrate o plano piloto para criar novos orçamentos. Os orçamentos existentes continuam disponíveis para consulta e exportação.",
        );
      }
    }

    const base = {
      owner_id: userId,
      quote_date: data.quote_date,
      client_id: data.client_id ?? null,
      client_name: data.client_name,
      client_phone: data.client_phone ?? null,
      client_kind: data.client_kind,
      service_location: data.service_location ?? null,
      project_type: data.project_type ?? null,
      title: data.title ?? null,
      description: data.description ?? null,
      payment_terms: data.payment_terms ?? null,
      execution_term: data.execution_term ?? null,
      valid_until: data.valid_until ?? null,
      inclusions: data.inclusions ?? null,
      exclusions: data.exclusions ?? null,
      notes: data.notes ?? null,
      extra_costs_cents: data.extra_costs_cents,
      discount_cents: data.discount_cents,
      tax_percent: data.tax_percent,
      bdi_percent: data.bdi_percent,
      subtotal_cents: totals.subtotal_cents,
      total_cents: totals.total_cents,
      updated_at: new Date().toISOString(),
    };

    let quoteId = data.id ?? null;

    if (quoteId) {
      const { error } = await supabase
        .from("quotes")
        .update(base)
        .eq("id", quoteId)
        .eq("owner_id", userId);
      if (error) throw new Error(error.message);
    } else {
      const { data: last } = await supabase
        .from("quotes")
        .select("number")
        .eq("owner_id", userId)
        .order("number", { ascending: false })
        .limit(1);
      const number = (last?.[0]?.number ?? 0) + 1;
      const { data: created, error } = await supabase
        .from("quotes")
        .insert({ ...base, number, status: "rascunho" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      quoteId = created.id;
    }

    await supabase.from("quote_items").delete().eq("quote_id", quoteId).eq("owner_id", userId);
    if (data.items.length > 0) {
      const { error: itemsError } = await supabase.from("quote_items").insert(
        data.items.map((item, index) => ({
          quote_id: quoteId,
          owner_id: userId,
          position: index,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          total_cents: itemTotalCents(item.quantity, item.unit_price_cents),
        })),
      );
      if (itemsError) throw new Error(itemsError.message);
    }

    return { id: quoteId as string, totals };
  });

export const deleteQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: quote } = await context.supabase
      .from("quotes")
      .select("status")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!quote) throw new Error("Orçamento não encontrado.");
    if (quote.status !== "rascunho") {
      throw new Error("Somente rascunhos podem ser excluídos.");
    }
    const { error } = await context.supabase
      .from("quotes")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await accessState(supabase, userId);
    if (!access.can_create) {
      throw new Error("Seu teste gratuito venceu. Contrate o plano piloto para criar orçamentos.");
    }
    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!quote) throw new Error("Orçamento não encontrado.");
    const { data: items } = await supabase
      .from("quote_items")
      .select("description, unit, quantity, unit_price_cents, total_cents, position")
      .eq("quote_id", data.id)
      .order("position");

    const { data: last } = await supabase
      .from("quotes")
      .select("number")
      .eq("owner_id", userId)
      .order("number", { ascending: false })
      .limit(1);

    const {
      id: _id,
      number: _number,
      status: _status,
      created_at: _createdAt,
      sent_confirmed_at: _sent,
      ...rest
    } = quote;

    const { data: created, error } = await supabase
      .from("quotes")
      .insert({
        ...rest,
        number: (last?.[0]?.number ?? 0) + 1,
        status: "rascunho",
        quote_date: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (items && items.length > 0) {
      await supabase
        .from("quote_items")
        .insert(items.map((i) => ({ ...i, quote_id: created.id, owner_id: userId })));
    }
    return { id: created.id };
  });

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += String.fromCharCode(b);
  return btoa(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const publishQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await accessState(supabase, userId);
    if (!access.can_create) {
      throw new Error(
        "Seu teste gratuito venceu. Contrate o plano piloto para publicar novas propostas. As propostas já publicadas continuam acessíveis.",
      );
    }

    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!quote) throw new Error("Orçamento não encontrado.");

    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!company?.trade_name) {
      throw new Error(
        "Cadastre sua empresa em “Minha empresa” antes de publicar. O nome comercial é obrigatório.",
      );
    }

    const { data: items } = await supabase
      .from("quote_items")
      .select("description, unit, quantity, unit_price_cents")
      .eq("quote_id", data.id)
      .order("position");
    if (!items || items.length === 0) {
      throw new Error("Adicione ao menos um item antes de publicar.");
    }

    const parsedItems = items.map((i) => ({ ...i, unit: i.unit as QuotePayload["items"][number]["unit"], quantity: Number(i.quantity) }));
    const totals = validateAndCompute({
      ...(quote as unknown as QuotePayload),
      tax_percent: Number(quote.tax_percent),
      bdi_percent: Number(quote.bdi_percent),
      items: parsedItems,
    });

    const snapshot: QuoteSnapshot = {
      company: {
        trade_name: company.trade_name,
        responsible_name: company.responsible_name,
        whatsapp: company.whatsapp,
        city: company.city,
        cnpj: company.cnpj,
        email: company.email,
        address: company.address,
        website: company.website,
        logo_path: company.logo_path,
      },
      quote: {
        number: quote.number,
        quote_date: quote.quote_date,
        client_name: quote.client_name,
        client_phone: quote.client_phone,
        client_kind: quote.client_kind,
        service_location: quote.service_location,
        project_type: quote.project_type,
        title: quote.title,
        description: quote.description,
        payment_terms: quote.payment_terms,
        execution_term: quote.execution_term,
        valid_until: quote.valid_until,
        inclusions: quote.inclusions,
        exclusions: quote.exclusions,
        notes: quote.notes,
      },
      items: parsedItems.map((i) => ({
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
        unit_price_cents: i.unit_price_cents,
        total_cents: itemTotalCents(i.quantity, i.unit_price_cents),
      })),
      totals,
    };

    const { data: lastVersion } = await supabase
      .from("quote_versions")
      .select("version")
      .eq("quote_id", data.id)
      .order("version", { ascending: false })
      .limit(1);

    const { data: version, error: versionError } = await supabase
      .from("quote_versions")
      .insert({
        quote_id: data.id,
        owner_id: userId,
        version: (lastVersion?.[0]?.version ?? 0) + 1,
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        total_cents: totals.total_cents,
        valid_until: quote.valid_until,
      })
      .select("id, version")
      .single();
    if (versionError) throw new Error(versionError.message);

    const token = newToken();
    const { error: tokenError } = await supabase.from("share_tokens").insert({
      token,
      quote_id: data.id,
      version_id: version.id,
      owner_id: userId,
    });
    if (tokenError) throw new Error(tokenError.message);

    await supabase
      .from("quotes")
      .update({
        status: quote.status === "rascunho" || quote.status === "vencido" ? "publicado" : quote.status,
        subtotal_cents: totals.subtotal_cents,
        total_cents: totals.total_cents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("owner_id", userId);

    const { requestOrigin } = await import("./origin.server");
    return {
      token,
      version: version.version,
      version_id: version.id,
      url: `${requestOrigin()}/orcamento/${token}`,
      total_cents: totals.total_cents,
    };
  });

export const setTokenRevoked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), revoked: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("share_tokens")
      .update({ revoked_at: data.revoked ? new Date().toISOString() : null })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["publicado", "aprovado", "recusado", "vencido"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: quote } = await context.supabase
      .from("quotes")
      .select("status")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!quote) throw new Error("Orçamento não encontrado.");
    if (quote.status === "rascunho") {
      throw new Error("Publique a proposta antes de registrar aprovação ou recusa.");
    }
    const { error } = await context.supabase
      .from("quotes")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const confirmSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("quotes")
      .update({ sent_confirmed_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: quotes } = await supabase
      .from("quotes")
      .select("id, number, status, client_name, total_cents, quote_date, valid_until, updated_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    const list = quotes ?? [];
    const byStatus = {
      rascunho: 0,
      publicado: 0,
      aprovado: 0,
      recusado: 0,
      vencido: 0,
    } as Record<string, number>;
    for (const q of list) byStatus[q.status] = (byStatus[q.status] ?? 0) + 1;

    const approvedTotal = list
      .filter((q) => q.status === "aprovado")
      .reduce((acc, q) => acc + q.total_cents, 0);

    const { data: reminders } = await supabase
      .from("reminders")
      .select("id, due_on, note, done, quote_id")
      .eq("owner_id", userId)
      .eq("done", false)
      .order("due_on", { ascending: true })
      .limit(10);

    const access = await accessState(supabase, userId);

    return {
      byStatus,
      total: list.length,
      approvedTotalCents: approvedTotal,
      recent: list.slice(0, 5),
      reminders: reminders ?? [],
      access,
    };
  });

export const getQuoteVersion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ version_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: version } = await context.supabase
      .from("quote_versions")
      .select("id, version, snapshot, published_at")
      .eq("id", data.version_id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!version) throw new Error("Versão não encontrada.");
    const snapshot = version.snapshot as unknown as QuoteSnapshot;
    let logoUrl: string | null = null;
    if (snapshot.company.logo_path) {
      const { data: signed } = await context.supabase.storage
        .from("logos")
        .createSignedUrl(snapshot.company.logo_path, 3600);
      logoUrl = signed?.signedUrl ?? null;
    }
    return { version: version.version, published_at: version.published_at, snapshot, logoUrl };
  });

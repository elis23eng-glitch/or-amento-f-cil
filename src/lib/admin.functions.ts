import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeBRPhone } from "./phone";

async function assertAdmin(supabase: { rpc: (fn: string) => Promise<{ data: unknown }> }) {
  const { data } = await supabase.rpc("is_admin");
  if (data !== true) throw new Error("Acesso restrito à administração do Orçai.");
  return true;
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("is_admin");
    return { admin: data === true };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [leads, profiles, subscriptions, payments, settings, publishers] = await Promise.all([
      supabaseAdmin.from("leads").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("manual_payments")
        .select("*")
        .order("confirmed_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("app_settings").select("key, value"),
      supabaseAdmin.from("quote_versions").select("owner_id"),
    ]);

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    const emails = new Map<string, string>();
    for (const u of authUsers?.users ?? []) emails.set(u.id, u.email ?? "");

    const today = new Date().toISOString().slice(0, 10);
    const subs = subscriptions.data ?? [];
    const activeSubs = subs.filter(
      (s) =>
        s.status === "ativa" &&
        (!s.starts_on || s.starts_on <= today) &&
        (!s.ends_on || s.ends_on >= today),
    );
    const publisherIds = new Set((publishers.data ?? []).map((r) => r.owner_id));

    const settingsMap: Record<string, string | null> = {};
    for (const s of settings.data ?? []) settingsMap[s.key] = s.value;

    return {
      leads: leads.data ?? [],
      users: (profiles.data ?? []).map((p) => ({
        ...p,
        email: emails.get(p.id) ?? null,
        published_first: publisherIds.has(p.id),
        subscription: subs.find((s) => s.user_id === p.id) ?? null,
      })),
      subscriptions: subs,
      payments: payments.data ?? [],
      settings: settingsMap,
      metrics: {
        leads: (leads.data ?? []).length,
        signups: (profiles.data ?? []).length,
        published_first: publisherIds.size,
        active_subscribers: activeSubs.length,
        confirmed_payments: (payments.data ?? []).length,
      },
    };
  });

export const adminUpdateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["novo", "contatado", "em_teste", "pagante", "inativo"]),
        admin_notes: z.string().trim().max(2000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit").insert({
      actor_id: context.userId,
      action: "lead.update",
      target: data.id,
      details: { status: data.status },
    });
    return { ok: true };
  });

export const adminSetSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ key: z.enum(["admin_whatsapp"]), value: z.string().trim().max(60).nullable() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase);
    let value = data.value;
    if (data.key === "admin_whatsapp" && value) {
      const normalized = normalizeBRPhone(value);
      if (!normalized) throw new Error("Informe um WhatsApp brasileiro válido, com DDD.");
      value = normalized;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_settings").upsert({
      key: data.key,
      value: value || null,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit").insert({
      actor_id: context.userId,
      action: "settings.update",
      target: data.key,
      details: { value: value || null },
    });
    return { ok: true, value };
  });

export const adminConfirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        amount_cents: z.number().int().min(0),
        paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        method: z.string().trim().max(60).nullable().optional(),
        note: z.string().trim().max(500).nullable().optional(),
        starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.user_id)
      .order("created_at", { ascending: false })
      .limit(1);

    let subscriptionId = existing?.[0]?.id ?? null;
    if (subscriptionId) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "ativa",
          starts_on: data.starts_on,
          ends_on: data.ends_on,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: data.user_id,
          status: "ativa",
          starts_on: data.starts_on,
          ends_on: data.ends_on,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      subscriptionId = created.id;
    }

    const { error: payError } = await supabaseAdmin.from("manual_payments").insert({
      user_id: data.user_id,
      subscription_id: subscriptionId,
      amount_cents: data.amount_cents,
      paid_on: data.paid_on,
      method: data.method ?? null,
      note: data.note ?? null,
      confirmed_by: context.userId,
    });
    if (payError) throw new Error(payError.message);

    await supabaseAdmin.from("admin_audit").insert({
      actor_id: context.userId,
      action: "payment.confirm",
      target: data.user_id,
      details: {
        amount_cents: data.amount_cents,
        paid_on: data.paid_on,
        starts_on: data.starts_on,
        ends_on: data.ends_on,
      },
    });

    return { ok: true };
  });

export const adminSetSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        status: z.enum(["solicitada", "ativa", "encerrada"]),
        starts_on: z.string().nullable().optional(),
        ends_on: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.user_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing?.[0]) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: data.status,
          starts_on: data.starts_on ?? null,
          ends_on: data.ends_on ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("subscriptions").insert({
        user_id: data.user_id,
        status: data.status,
        starts_on: data.starts_on ?? null,
        ends_on: data.ends_on ?? null,
      });
    }

    await supabaseAdmin.from("admin_audit").insert({
      actor_id: context.userId,
      action: "subscription.update",
      target: data.user_id,
      details: { status: data.status, starts_on: data.starts_on, ends_on: data.ends_on },
    });
    return { ok: true };
  });

export const adminAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

/** Solicitação de assinatura feita pelo próprio profissional (não ativa nada). */
export const requestSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", context.userId)
      .limit(1);
    if (!existing?.[0]) {
      await supabaseAdmin
        .from("subscriptions")
        .insert({ user_id: context.userId, status: "solicitada" });
    }
    const { data: setting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_whatsapp")
      .maybeSingle();
    const phone = normalizeBRPhone(setting?.value ?? null);
    return { requested: true, adminPhone: phone, contactPending: !phone };
  });

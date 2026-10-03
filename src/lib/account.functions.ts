import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Exporta todos os dados do próprio usuário (RLS aplica-se como o usuário). */
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, company, clients, catalog, quotes, items, versions, reminders, subs, pays] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId),
        supabase.from("companies").select("*").eq("owner_id", userId),
        supabase.from("clients").select("*").eq("owner_id", userId),
        supabase.from("catalog_services").select("*").eq("owner_id", userId),
        supabase.from("quotes").select("*").eq("owner_id", userId),
        supabase.from("quote_items").select("*").eq("owner_id", userId),
        supabase.from("quote_versions").select("*").eq("owner_id", userId),
        supabase.from("reminders").select("*").eq("owner_id", userId),
        supabase.from("subscriptions").select("*").eq("user_id", userId),
        supabase.from("manual_payments").select("*").eq("user_id", userId),
      ]);
    return JSON.parse(
      JSON.stringify({
        exported_at: new Date().toISOString(),
        profile: profile.data,
        company: company.data,
        clients: clients.data,
        catalog_services: catalog.data,
        quotes: quotes.data,
        quote_items: items.data,
        quote_versions: versions.data,
        reminders: reminders.data,
        subscriptions: subs.data,
        manual_payments: pays.data,
      }),
    ) as Record<string, unknown>;
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeBRPhone } from "./phone";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  whatsapp: z.string().trim().min(10, "Informe um WhatsApp válido").max(40),
  profession: z.string().trim().min(2, "Informe sua profissão ou tipo de serviço").max(120),
  city: z.string().trim().min(2, "Informe sua cidade").max(120),
  monthly_quotes: z.string().trim().min(1, "Informe quantos orçamentos faz por mês").max(40),
  interest: z.enum(["testar", "contratar"]),
  marketing_consent: z.boolean(),
});

/** Telefone da administradora — público apenas como "configurado / não configurado" + número. */
export const getAdminWhatsapp = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "admin_whatsapp")
    .maybeSingle();
  const phone = normalizeBRPhone(data?.value ?? null);
  return { phone, configured: !!phone };
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const phone = normalizeBRPhone(data.whatsapp);
    if (!phone) {
      throw new Error(
        "O WhatsApp informado não parece válido. Use DDD + número, por exemplo (11) 91234-5678.",
      );
    }

    const { getRequestIP } = await import("@tanstack/react-start/server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? "desconhecido";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Limitação simples de requisições por origem (10 minutos).
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      throw new Error("Recebemos vários pedidos deste dispositivo. Tente novamente em alguns minutos.");
    }

    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      whatsapp: phone,
      profession: data.profession,
      city: data.city,
      monthly_quotes: data.monthly_quotes,
      interest: data.interest,
      marketing_consent: data.marketing_consent,
      source_ip: ip,
    });
    if (error) throw new Error("Não foi possível salvar seu pedido agora. Tente novamente.");

    const { data: setting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_whatsapp")
      .maybeSingle();
    const adminPhone = normalizeBRPhone(setting?.value ?? null);

    return { saved: true, adminPhone, contactPending: !adminPhone };
  });

import { z } from "zod";
import { normalizeBRPhone } from "./phone";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120, "Use no máximo 120 caracteres."),
  whatsapp: z
    .string()
    .trim()
    .max(40, "Número muito longo.")
    .refine((v) => v.length > 0, "Informe seu WhatsApp com DDD.")
    .refine(
      (v) => v.length === 0 || !!normalizeBRPhone(v),
      "WhatsApp inválido. Use DDD + número, por exemplo (11) 91234-5678.",
    ),
  profession: z
    .string()
    .trim()
    .min(2, "Informe sua profissão ou tipo de serviço.")
    .max(120, "Use no máximo 120 caracteres."),
  city: z.string().trim().min(2, "Informe sua cidade.").max(120, "Use no máximo 120 caracteres."),
  monthly_quotes: z.string().trim().min(1, "Escolha quantos orçamentos faz por mês.").max(40),
  interest: z.enum(["testar", "contratar"], { message: "Escolha o que você quer agora." }),
  marketing_consent: z.boolean(),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadErrors = Partial<Record<keyof LeadInput, string>>;

/** Valida o pedido e devolve uma mensagem simples por campo (vazio = válido). */
export function validateLead(input: unknown): { ok: true; data: LeadInput } | { ok: false; errors: LeadErrors } {
  const r = leadSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const errors: LeadErrors = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof LeadInput | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

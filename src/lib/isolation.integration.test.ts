import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Teste real contra o banco: duas contas diferentes (A e B).
 * Usa somente a chave pública, exatamente como a interface e as funções
 * de backend fazem (elas agem com a sessão do usuário).
 *
 * Requer variáveis de ambiente com duas contas de teste já cadastradas:
 *   ISOLATION_A_EMAIL, ISOLATION_A_PASSWORD, ISOLATION_B_EMAIL, ISOLATION_B_PASSWORD
 * Sem elas, o teste é ignorado (não conta como aprovado).
 */
const env = process.env;
const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;
const ready =
  !!url && !!key && !!env.ISOLATION_A_EMAIL && !!env.ISOLATION_A_PASSWORD && !!env.ISOLATION_B_EMAIL && !!env.ISOLATION_B_PASSWORD;

async function login(email: string, password: string) {
  const c = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { c, id: data.user.id };
}

describe.skipIf(!ready)("isolamento entre usuários (banco real)", () => {
  let A: { c: SupabaseClient; id: string };
  let B: { c: SupabaseClient; id: string };
  let quoteId: string;

  beforeAll(async () => {
    A = await login(env.ISOLATION_A_EMAIL!, env.ISOLATION_A_PASSWORD!);
    B = await login(env.ISOLATION_B_EMAIL!, env.ISOLATION_B_PASSWORD!);
    const { data: company } = await A.c.from("companies").select("id").eq("owner_id", A.id).maybeSingle();
    if (!company) await A.c.from("companies").insert({ owner_id: A.id, trade_name: "Teste isolamento A" });
    const { data, error } = await A.c
      .from("quotes")
      .insert({ owner_id: A.id, number: 900000 + Math.floor(Math.random() * 99999), client_name: "Cliente teste isolamento" })
      .select("id")
      .single();
    if (error) throw error;
    quoteId = data.id;
    await A.c.from("quote_items").insert({ quote_id: quoteId, owner_id: A.id, description: "Item teste", quantity: 1 });
  });

  afterAll(async () => {
    if (quoteId) {
      await A.c.from("quote_items").delete().eq("quote_id", quoteId);
      await A.c.from("quotes").delete().eq("id", quoteId);
    }
  });

  it("A enxerga o próprio orçamento", async () => {
    const { data } = await A.c.from("quotes").select("id").eq("id", quoteId);
    expect(data).toHaveLength(1);
  });

  it("B não consulta orçamento, itens nem empresa de A, mesmo sabendo o ID", async () => {
    for (const [table, col, val] of [
      ["quotes", "id", quoteId],
      ["quote_items", "quote_id", quoteId],
      ["companies", "owner_id", A.id],
      ["clients", "owner_id", A.id],
      ["quote_versions", "owner_id", A.id],
      ["share_tokens", "owner_id", A.id],
    ] as const) {
      const { data } = await B.c.from(table).select("*").eq(col, val);
      expect(data ?? [], table).toHaveLength(0);
    }
  });

  it("B não altera nem exclui orçamento ou empresa de A", async () => {
    await B.c.from("quotes").update({ client_name: "invadido" }).eq("id", quoteId);
    await B.c.from("quotes").delete().eq("id", quoteId);
    await B.c.from("companies").update({ trade_name: "invadido" }).eq("owner_id", A.id);
    const { data: q } = await A.c.from("quotes").select("client_name").eq("id", quoteId).single();
    expect(q?.client_name).toBe("Cliente teste isolamento");
    const { data: co } = await A.c.from("companies").select("trade_name").eq("owner_id", A.id).single();
    expect(co?.trade_name).not.toBe("invadido");
  });

  it("B não cria registros em nome de A", async () => {
    const { error: e1 } = await B.c.from("quotes").insert({ owner_id: A.id, number: 1, client_name: "x" });
    const { error: e2 } = await B.c.from("quote_items").insert({ quote_id: quoteId, owner_id: A.id, description: "x", quantity: 1 });
    const { error: e3 } = await B.c.from("quote_items").insert({ quote_id: quoteId, owner_id: B.id, description: "x", quantity: 1 });
    expect(e1).not.toBeNull();
    expect(e2).not.toBeNull();
    expect(e3).not.toBeNull(); // não pode anexar itens ao orçamento de outro
    const { data } = await A.c.from("quote_items").select("owner_id").eq("quote_id", quoteId);
    expect((data ?? []).every((i) => i.owner_id === A.id)).toBe(true);
    if (!e3) await B.c.from("quote_items").delete().eq("quote_id", quoteId).eq("owner_id", B.id);
  });

  it("B não lê logos de A no armazenamento", async () => {
    const { data } = await B.c.storage.from("logos").list(A.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("visitante sem login não lê tabelas privadas", async () => {
    const anon = createClient(url!, key!, { auth: { persistSession: false } });
    for (const t of ["quotes", "companies", "quote_items", "quote_versions", "share_tokens", "leads"]) {
      const { data } = await anon.from(t).select("*").limit(1);
      expect(data ?? [], t).toHaveLength(0);
    }
  });
});

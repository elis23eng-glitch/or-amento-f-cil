import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verificação estática das funções de backend privadas:
 * toda função exportada precisa exigir sessão (requireSupabaseAuth),
 * e as consultas a dados privados precisam filtrar pelo dono.
 * O banco também aplica RLS — este teste garante a segunda camada.
 */
const read = (f: string) => readFileSync(resolve(__dirname, f), "utf8");

function serverFns(source: string) {
  const parts = source.split(/export const (\w+) = createServerFn/);
  const out: { name: string; body: string }[] = [];
  for (let i = 1; i < parts.length; i += 2) out.push({ name: parts[i], body: parts[i + 1] });
  return out;
}

const PRIVATE_MODULES = ["quotes.functions.ts", "account.functions.ts", "admin.functions.ts"];

describe("funções de backend privadas", () => {
  for (const file of PRIVATE_MODULES) {
    for (const fn of serverFns(read(file))) {
      it(`${file} › ${fn.name} exige usuário autenticado`, () => {
        expect(fn.body).toContain("requireSupabaseAuth");
      });
    }
  }

  const ownerScoped = ["getQuote", "deleteQuote", "duplicateQuote", "publishQuote", "setTokenRevoked", "setQuoteStatus", "confirmSent", "getQuoteVersion", "listQuotes", "saveQuote"];
  for (const fn of serverFns(read("quotes.functions.ts")).filter((f) => ownerScoped.includes(f.name))) {
    it(`quotes › ${fn.name} restringe ao dono`, () => {
      expect(fn.body).toMatch(/owner_id["']?,?\s*:?\s*(context\.)?userId|\.eq\("owner_id", (context\.)?userId\)/);
    });
  }

  it("publicação lê a empresa somente do próprio usuário", () => {
    const fn = serverFns(read("quotes.functions.ts")).find((f) => f.name === "publishQuote")!;
    expect(fn.body).toMatch(/from\("companies"\)[\s\S]*?\.eq\("owner_id", userId\)/);
  });

  it("funções administrativas verificam o papel de administradora", () => {
    for (const fn of serverFns(read("admin.functions.ts"))) {
      if (fn.name === "amIAdmin" || fn.name === "requestSubscription") continue;
      expect(fn.body, fn.name).toMatch(/requireAdmin|is_admin|assertAdmin/);
    }
  });
});

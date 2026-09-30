import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { QuoteSnapshot } from "./quote-snapshot";

export type PublicQuoteResult =
  | { ok: false }
  | {
      ok: true;
      snapshot: QuoteSnapshot;
      version: number;
      published_at: string;
      logoUrl: string | null;
      expired: boolean;
    };

/**
 * Resolve o token no servidor e devolve apenas os campos autorizados
 * da versão publicada. Nenhuma tabela é lida diretamente sem login.
 */
export const getPublicQuote = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().min(10).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicQuoteResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tokenRow } = await supabaseAdmin
      .from("share_tokens")
      .select("version_id, revoked_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!tokenRow || tokenRow.revoked_at) return { ok: false };

    const { data: version } = await supabaseAdmin
      .from("quote_versions")
      .select("version, snapshot, published_at, valid_until")
      .eq("id", tokenRow.version_id)
      .maybeSingle();

    if (!version) return { ok: false };

    const snapshot = version.snapshot as unknown as QuoteSnapshot;

    let logoUrl: string | null = null;
    if (snapshot.company?.logo_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("logos")
        .createSignedUrl(snapshot.company.logo_path, 60 * 60 * 12);
      logoUrl = signed?.signedUrl ?? null;
    }

    const validUntil = version.valid_until ?? snapshot.quote?.valid_until ?? null;
    const expired = !!validUntil && validUntil < new Date().toISOString().slice(0, 10);

    return {
      ok: true,
      snapshot,
      version: version.version,
      published_at: version.published_at,
      logoUrl,
      expired,
    };
  });

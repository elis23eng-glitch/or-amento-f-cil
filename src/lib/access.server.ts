import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessState = {
  trial_started_at: string;
  trial_ends_at: string;
  trial_active: boolean;
  subscription_status: string | null;
  subscription_ends_on: string | null;
  subscription_active: boolean;
  can_create: boolean;
};

/**
 * Situação do acesso calculada SEMPRE no servidor.
 * O usuário não consegue ativar plano nem estender o teste pela interface.
 */
export async function getAccessState(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccessState> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_started_at, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("status, starts_on, ends_on")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const trialEnds = profile?.trial_ends_at ?? now.toISOString();
  const trialActive = new Date(trialEnds).getTime() > now.getTime();

  const sub = subs?.[0] ?? null;
  const subActive =
    !!sub &&
    sub.status === "ativa" &&
    (!sub.starts_on || sub.starts_on <= today) &&
    (!sub.ends_on || sub.ends_on >= today);

  return {
    trial_started_at: profile?.trial_started_at ?? now.toISOString(),
    trial_ends_at: trialEnds,
    trial_active: trialActive,
    subscription_status: sub?.status ?? null,
    subscription_ends_on: sub?.ends_on ?? null,
    subscription_active: subActive,
    can_create: trialActive || subActive,
  };
}

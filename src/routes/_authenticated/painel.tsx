import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/orcai/brand";
import { Button } from "@/components/ui/button";
import { amIAdmin } from "@/lib/admin.functions";
import { getMyAccess } from "@/lib/quotes.functions";
import { formatDateBR } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Orçai" },
      { name: "description", content: "Seus orçamentos, clientes e empresa no Orçai." },
      { property: "og:title", content: "Painel — Orçai" },
      { property: "og:description", content: "Seus orçamentos, clientes e empresa no Orçai." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PanelLayout,
});

const NAV = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/painel/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/painel/clientes", label: "Clientes", icon: Users },
  { to: "/painel/servicos", label: "Serviços frequentes", icon: ListChecks },
  { to: "/painel/empresa", label: "Minha empresa", icon: Building2 },
  { to: "/painel/plano", label: "Meu plano", icon: CreditCard },
] as const;

export function useAccess() {
  return useQuery({ queryKey: ["access"], queryFn: () => getMyAccess() });
}

function PanelLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useQuery({ queryKey: ["am-i-admin"], queryFn: () => amIAdmin() });
  const access = useAccess();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const a = access.data;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5">
          <Link to="/painel">
            <BrandMark />
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            {admin.data?.admin ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">
                  <Shield className="size-4" /> <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sair">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-2" aria-label="Menu do painel">
          <ul className="flex min-w-max gap-1 pb-2">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: "exact" in item }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                  activeProps={{ className: "bg-brand-soft text-brand" }}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {a && !a.can_create ? (
        <div className="border-b border-warning/40 bg-warning/15 px-4 py-2.5 text-sm text-warning-foreground">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <span>
              Seu teste gratuito venceu em {formatDateBR(a.trial_ends_at.slice(0, 10))}. Você pode
              consultar e exportar seus orçamentos; para criar e publicar novos, contrate o plano.
            </span>
            <Button asChild size="sm" className="bg-whatsapp font-bold text-whatsapp-foreground">
              <Link to="/painel/plano">Contratar pelo WhatsApp</Link>
            </Button>
          </div>
        </div>
      ) : a && a.trial_active && !a.subscription_active ? (
        <div className="border-b border-border bg-brand-soft px-4 py-2 text-xs text-brand">
          <div className="mx-auto max-w-6xl">
            Teste gratuito ativo até {formatDateBR(a.trial_ends_at.slice(0, 10))}.
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

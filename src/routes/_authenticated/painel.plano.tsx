import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestSubscription } from "@/lib/admin.functions";
import { exportMyData } from "@/lib/account.functions";
import { formatDateBR } from "@/lib/money";
import { waLink } from "@/lib/phone";
import { useAccess } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/plano")({
  component: PlanPage,
});

function PlanPage() {
  const access = useAccess();
  const request = useServerFn(requestSubscription);
  const exportFn = useServerFn(exportMyData);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const a = access.data;

  async function contact(kind: "contratar" | "excluir") {
    const win = window.open("", "_blank");
    setBusy(kind);
    try {
      const r = await request();
      if (!r.adminPhone) {
        win?.close();
        setPending(true);
        toast.info(kind === "contratar" ? "Solicitação registrada. O contato está pendente." : "WhatsApp de atendimento ainda não configurado.");
        return;
      }
      const msg = kind === "contratar"
        ? "Olá! Quero contratar o plano piloto do Orçai (R$ 29,90/mês)."
        : "Olá! Quero solicitar a exclusão da minha conta e dos meus dados no Orçai.";
      const link = waLink(r.adminPhone, msg);
      if (win) win.location.href = link; else window.location.href = link;
    } catch {
      win?.close();
      toast.error("Não foi possível registrar agora.");
    } finally {
      setBusy(null);
    }
  }

  async function doExport() {
    setBusy("export");
    try {
      const data = await exportFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a2 = document.createElement("a");
      a2.href = url; a2.download = `orcai-meus-dados-${new Date().toISOString().slice(0, 10)}.json`; a2.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação baixada.");
    } catch {
      toast.error("Não foi possível exportar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-2xl font-extrabold text-brand">Meu plano</h1>
      <section className="surface grid gap-2 p-4 text-sm">
        {!a ? <Loader2 className="size-5 animate-spin" /> : (
          <>
            <p><strong>Teste gratuito:</strong> {formatDateBR(a.trial_started_at.slice(0, 10))} até {formatDateBR(a.trial_ends_at.slice(0, 10))} — {a.trial_active ? "ativo" : "vencido"}</p>
            <p><strong>Assinatura:</strong> {a.subscription_active ? `ativa até ${formatDateBR(a.subscription_ends_on)}` : a.subscription_status === "solicitada" ? "solicitada, aguardando confirmação da administradora" : "não contratada"}</p>
            <p className="text-muted-foreground">Plano piloto: R$ 29,90/mês. A contratação é pelo WhatsApp e o pagamento é confirmado manualmente pela administradora — não é possível ativar o plano por aqui.</p>
          </>
        )}
        <Button onClick={() => contact("contratar")} disabled={!!busy} className="mt-2 h-11 w-fit bg-whatsapp font-bold text-whatsapp-foreground">
          {busy === "contratar" ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} Contratar pelo WhatsApp
        </Button>
        {pending ? <p className="text-xs text-warning-foreground">Sua solicitação foi registrada; o WhatsApp de atendimento ainda não está configurado, então o contato está pendente.</p> : null}
      </section>
      <section className="surface grid gap-2 p-4 text-sm">
        <h2 className="font-display text-lg font-bold">Seus dados</h2>
        <p className="text-muted-foreground">Baixe todos os seus dados (empresa, clientes, orçamentos, versões) em um arquivo.</p>
        <Button variant="outline" onClick={doExport} disabled={!!busy} className="w-fit">
          {busy === "export" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Exportar meus dados
        </Button>
        <Button variant="ghost" onClick={() => contact("excluir")} disabled={!!busy} className="w-fit text-destructive">
          Solicitar exclusão da conta
        </Button>
      </section>
    </div>
  );
}

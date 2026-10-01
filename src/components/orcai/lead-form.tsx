import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "./field";
import { submitLead } from "@/lib/leads.functions";
import { waLink } from "@/lib/phone";

const EMPTY = {
  name: "",
  whatsapp: "",
  profession: "",
  city: "",
  monthly_quotes: "1 a 5",
  interest: "testar" as "testar" | "contratar",
  marketing_consent: false,
};

export function LeadForm({ defaultInterest }: { defaultInterest?: "testar" | "contratar" }) {
  const [form, setForm] = useState({ ...EMPTY, interest: defaultInterest ?? "testar" });
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const send = useServerFn(submitLead);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      // O lead é salvo ANTES de qualquer tentativa de abrir o WhatsApp.
      const result = await send({ data: form });
      if (result.adminPhone) {
        setStatus("saved");
        toast.success("Pedido salvo! Abrindo a conversa no WhatsApp.");
        const message =
          form.interest === "contratar"
            ? `Olá! Sou ${form.name}, ${form.profession} em ${form.city}. Quero contratar o plano piloto do Orçai (R$ 29,90/mês).`
            : `Olá! Sou ${form.name}, ${form.profession} em ${form.city}. Quero testar o Orçai por 7 dias.`;
        window.open(waLink(result.adminPhone, message), "_blank", "noopener,noreferrer");
      } else {
        setStatus("pending");
        toast.success("Pedido salvo. O contato está pendente.");
      }
    } catch (e) {
      setStatus("idle");
      const message =
        e instanceof Error ? e.message : "Não foi possível enviar agora. Tente novamente.";
      setError(message);
      toast.error(message);
    }
  }

  if (status === "saved" || status === "pending") {
    return (
      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold text-brand">Pedido registrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "pending"
            ? "Salvamos seu pedido, mas o WhatsApp de atendimento ainda não está configurado. O contato está pendente e a administradora falará com você assim que possível."
            : "Salvamos seu pedido e abrimos a conversa no WhatsApp. Se a janela não abriu, verifique o bloqueador de pop-ups."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setForm({ ...EMPTY, interest: defaultInterest ?? "testar" });
            setStatus("idle");
          }}
        >
          Enviar outro pedido
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface grid gap-4 p-5" noValidate>
      <div>
        <h3 className="font-display text-lg font-bold text-brand">Quero usar o Orçai</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Usamos seus dados apenas para atender a esta solicitação e falar com você sobre o Orçai.
        </p>
      </div>

      <Field label="Nome" required>
        {(p) => (
          <Input
            {...p}
            value={form.name}
            autoComplete="name"
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
      </Field>

      <Field label="WhatsApp" hint="Com DDD, por exemplo (11) 91234-5678." required>
        {(p) => (
          <Input
            {...p}
            value={form.whatsapp}
            inputMode="tel"
            autoComplete="tel"
            required
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
        )}
      </Field>

      <Field label="Profissão ou tipo de serviço" required>
        {(p) => (
          <Input
            {...p}
            value={form.profession}
            placeholder="Pintor, eletricista, construtor…"
            required
            onChange={(e) => setForm({ ...form, profession: e.target.value })}
          />
        )}
      </Field>

      <Field label="Cidade" required>
        {(p) => (
          <Input
            {...p}
            value={form.city}
            required
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        )}
      </Field>

      <Field label="Quantos orçamentos você faz por mês" required>
        {(p) => (
          <Select
            value={form.monthly_quotes}
            onValueChange={(v) => setForm({ ...form, monthly_quotes: v })}
          >
            <SelectTrigger id={p.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["1 a 5", "6 a 15", "16 a 30", "mais de 30"].map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field label="O que você quer agora" required>
        {(p) => (
          <Select
            value={form.interest}
            onValueChange={(v) => setForm({ ...form, interest: v as "testar" | "contratar" })}
          >
            <SelectTrigger id={p.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="testar">Testar gratuitamente por 7 dias</SelectItem>
              <SelectItem value="contratar">Contratar o plano piloto (R$ 29,90/mês)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </Field>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={form.marketing_consent}
          onCheckedChange={(v) => setForm({ ...form, marketing_consent: v === true })}
          className="mt-0.5"
        />
        <span>
          Quero receber novidades e dicas do Orçai (opcional e independente do atendimento).
        </span>
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={status === "loading"}
        className="h-12 w-full bg-whatsapp text-base font-bold text-whatsapp-foreground hover:brightness-95"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Salvando…
          </>
        ) : (
          <>
            <MessageCircle className="size-5" /> Salvar e falar no WhatsApp
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Seu pedido é salvo mesmo se o WhatsApp não abrir.
      </p>
    </form>
  );
}

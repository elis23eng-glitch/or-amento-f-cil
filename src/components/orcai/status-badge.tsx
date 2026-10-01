import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  vencido: "Vencido",
};

const STATUS_CLASSES: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  publicado: "bg-brand-soft text-brand",
  aprovado: "bg-success/15 text-success",
  recusado: "bg-destructive/12 text-destructive",
  vencido: "bg-warning/20 text-warning-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

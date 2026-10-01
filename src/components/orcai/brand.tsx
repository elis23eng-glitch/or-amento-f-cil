import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          tone === "brand" ? "bg-brand text-brand-foreground" : "bg-card text-brand",
        )}
      >
        <Ruler className="size-5" aria-hidden="true" />
      </span>
      <span
        className={cn(
          "font-display text-xl font-extrabold tracking-tight",
          tone === "brand" ? "text-brand" : "text-brand-foreground",
        )}
      >
        Orçai
      </span>
    </span>
  );
}

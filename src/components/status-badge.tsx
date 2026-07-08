import type { EventStatus, ItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { label: string; cls: string }> = {
    planejado: { label: "Planejado", cls: "bg-muted text-foreground/70 border-border" },
    em_andamento: { label: "Em andamento", cls: "bg-info/10 text-info border-info/30" },
    concluido: { label: "Concluído", cls: "bg-success/10 text-success border-success/30" },
    com_pendencias: {
      label: "Com pendências",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
    },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

export function ItemStatusPill({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, string> = {
    pendente: "bg-muted text-muted-foreground",
    em_andamento: "bg-info/10 text-info",
    concluido: "bg-success/15 text-success",
    na: "bg-muted text-muted-foreground/70",
  };
  const label: Record<ItemStatus, string> = {
    pendente: "Pendente",
    em_andamento: "Em andamento",
    concluido: "Concluído",
    na: "N/A",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        map[status],
      )}
    >
      {label[status]}
    </span>
  );
}

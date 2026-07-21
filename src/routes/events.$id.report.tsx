import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Users,
  Paperclip,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, ItemStatusPill } from "@/components/status-badge";
import {
  allItems,
  eventStatus,
  useEvent,
} from "@/lib/events-store";
import type { ChecklistItem, EventInfo } from "@/lib/types";

export const Route = createFileRoute("/events/$id/report")({
  head: () => ({
    meta: [
      { title: "Relatório — Painel Conexão VIP" },
      { name: "description", content: "Relatório visual do evento para supervisão." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Evento não encontrado.{" "}
      <Link to="/" className="underline">
        Voltar
      </Link>
    </div>
  ),
});

function formatDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function ReportPage() {
  const { id } = Route.useParams();
  const ev = useEvent(id);
  if (!ev) throw notFound();

  const items = allItems(ev);
  const status = eventStatus(ev);
  const done = items.filter((i) => i.status === "concluido");
  const pending = items.filter(
    (i) => i.status !== "concluido" && i.status !== "na",
  );
  const critical: ChecklistItem[] = [];

  const soon = pending
    .filter((i) => i.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 6);

  return (
    <div className="bg-muted/30 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Toolbar */}
        <div className="no-print mb-4 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/events/$id/checklist" params={{ id }}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao checklist
            </Link>
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Printer className="mr-1.5 h-4 w-4" /> Gerar relatório / Imprimir
          </Button>
        </div>

        {/* Report page */}
        <div className="rounded-2xl bg-card shadow-sm print:rounded-none print:shadow-none">
          {/* Header */}
          <div className="brand-gradient rounded-t-2xl p-6 print:rounded-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-widest text-primary/70">
                  Conexão VIP · Relatório do evento
                </div>
                <h1 className="mt-1 font-display text-3xl font-bold text-primary">
                  {ev.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary/80">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> 
                    {ev.endDate && ev.endDate !== ev.date 
                      ? `${formatDate(ev.date)} a ${formatDate(ev.endDate)}`
                      : formatDate(ev.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {ev.location || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-4 w-4" /> {ev.organizer || "—"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">


            {/* Contatos */}
            <section>
              <SectionTitle>Informações principais</SectionTitle>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={User} label="Organizador / Responsável" value={ev.organizer} />
                <InfoRow icon={Phone} label="WhatsApp" value={ev.whatsapp} />
                <InfoRow icon={Mail} label="E-mail" value={ev.email} />
                <InfoRow icon={Users} label="Público estimado" value={ev.audience} />
                <InfoRow 
                  icon={Calendar} 
                  label="Montagem" 
                  value={`${ev.setupDate ? ev.setupDate.split("-").reverse().join("/") : ""} ${ev.setupTime ? "às " + ev.setupTime : ""}`.trim() || "—"} 
                />
                <InfoRow 
                  icon={Calendar} 
                  label="Evento" 
                  value={ev.eventTime || "—"} 
                />
                <InfoRow 
                  icon={Calendar} 
                  label="Desmontagem" 
                  value={`${ev.teardownDate ? ev.teardownDate.split("-").reverse().join("/") : ""} ${ev.teardownTime ? "às " + ev.teardownTime : ""}`.trim() || "—"} 
                />
              </div>
              {ev.mapLink && (
                <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  <span className="font-semibold block mb-1">Notas de localização do Stand:</span>
                  <div className="text-muted-foreground whitespace-pre-line">{ev.mapLink}</div>
                </div>
              )}
              {ev.mapImage && (
                <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  <span className="font-semibold block mb-2">Mapa do Stand (Imagem):</span>
                  <img src={ev.mapImage} alt="Mapa do Stand" className="max-h-80 rounded object-contain border border-border" />
                </div>
              )}
            </section>

            {/* Contrapartidas section */}
            {ev.stages.find(s => s.id === "comercial")?.groups.find(g => g.id === "comercial_contrapartidas") && (
              <section className="rounded-lg border border-border bg-card p-4">
                <SectionTitle>Contrapartidas negociadas</SectionTitle>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ev.stages.find(s => s.id === "comercial")?.groups.find(g => g.id === "comercial_contrapartidas")?.items
                    .filter(i => i.status === "concluido")
                    .map(it => (
                      <span key={it.id} className="inline-flex items-center gap-1 rounded bg-success/10 border border-success/20 px-2.5 py-1 text-xs text-success font-medium">
                        ✓ {it.label}
                      </span>
                    ))}
                  {ev.stages.find(s => s.id === "comercial")?.groups.find(g => g.id === "comercial_contrapartidas")?.items
                    .filter(i => i.status === "concluido").length === 0 && (
                      <span className="text-xs text-muted-foreground">Nenhuma contrapartida marcada.</span>
                    )}
                </div>
                {ev.contrapartidasNotes && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                    <span className="font-semibold block mb-1">Observações das contrapartidas:</span>
                    <div className="text-muted-foreground whitespace-pre-line">{ev.contrapartidasNotes}</div>
                  </div>
                )}
              </section>
            )}





            {/* Upcoming deadlines */}
            {soon.length > 0 && (
              <section>
                <SectionTitle>Prazos próximos</SectionTitle>
                <ItemList items={soon} showDate />
              </section>
            )}

            {/* Per-area subchecklists */}
            <StageSection ev={ev} title="Checklist técnico" stageId="tecnico" />
            <StageSection
              ev={ev}
              title="Checklist de marketing"
              stageId="operacao"
              groupIds={["op_stand", "op_materiais"]}
            />
            <StageSection
              ev={ev}
              title="Checklist de equipe"
              stageId="operacao"
              groupIds={["op_equipe"]}
            />
            <StageSection
              ev={ev}
              title="Registros"
              stageId="operacao"
              groupIds={["op_registros"]}
            />
            <StageSection ev={ev} title="Pós-evento" stageId="pos" />

            {/* Attachments/notes */}
            <NotesSection ev={ev} />

            {/* Pending list as last section */}
            <PendingItemsSection items={pending} />

            <footer className="border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
              Relatório gerado pelo Painel de Eventos Conexão VIP ·{" "}
              {new Date().toLocaleString("pt-BR")}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "critical";
}) {
  return (
    <h2
      className={`mb-3 font-display text-sm font-bold uppercase tracking-wider ${
        tone === "critical" ? "text-destructive" : "text-foreground"
      }`}
    >
      {children}
    </h2>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "default" | "success" | "info" | "critical";
}) {
  const toneCls: Record<string, string> = {
    default: "bg-muted text-foreground",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    critical: "bg-destructive/15 text-destructive",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`grid h-9 w-9 place-items-center rounded-md ${toneCls[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="font-display text-xl font-bold text-foreground">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium text-foreground">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function ItemList({
  items,
  showDate = false,
}: {
  items: ChecklistItem[];
  showDate?: boolean;
}) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((it) => (
        <li key={it.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{it.label}</span>
            </div>
            {(it.responsible || it.notes) && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {it.responsible && <span>Resp.: {it.responsible}</span>}
                {it.responsible && it.notes ? " · " : ""}
                {it.notes}
              </div>
            )}
            {it.attachment && (
              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-info">
                <Paperclip className="h-3 w-3" />
                <span className="truncate">{it.attachment}</span>
              </div>
            )}
          </div>
          {showDate && it.dueDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(`${it.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}
            </span>
          )}
          <ItemStatusPill status={it.status} />
        </li>
      ))}
    </ul>
  );
}

function StageSection({
  ev,
  title,
  stageId,
  groupIds,
}: {
  ev: EventInfo;
  title: string;
  stageId: string;
  groupIds?: string[];
}) {
  const stage = ev.stages.find((s) => s.id === stageId);
  if (!stage) return null;
  const groups = groupIds
    ? stage.groups.filter((g) => groupIds.includes(g.id))
    : stage.groups;
  
  const hasItems = groups.some((g) => g.items.filter((i) => i.status !== "na").length > 0);
  if (!hasItems) return null;
  
  return (
    <section className="space-y-3">
      <div className="mb-2 flex items-center justify-between border-b border-border pb-1">
        <SectionTitle>{title}</SectionTitle>
      </div>
      <div className="space-y-4">
        {groups.map((group) => {
          const isSelectionGroup = 
            group.id === "tec_internet" || 
            group.id === "tec_banda" || 
            group.id === "op_stand" || 
            group.id === "op_materiais";

          const completedItems = group.items.filter((i) => i.status === "concluido");

          if (group.id === "op_registros" && group.items.filter((i) => i.attachment).length === 0 && !group.notes) {
            return null;
          }
          if (group.id === "op_equipe" && group.items.length === 0 && !group.notes) {
            return null;
          }
          if (group.id !== "op_registros" && group.id !== "op_equipe" && completedItems.length === 0 && !group.notes) {
            return null;
          }

          return (
            <div key={group.id} className="rounded-lg border border-border p-3 space-y-2 bg-muted/10">
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wide">{group.title}</h4>
              {group.id === "op_registros" ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mt-2">
                  {group.items.filter((it) => it.attachment).map((it) => (
                    <div key={it.id} className="aspect-video w-full rounded-lg border border-border/80 overflow-hidden bg-muted shadow-sm">
                      <img src={it.attachment} alt="Registro do evento" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {group.items.filter((it) => it.attachment).length === 0 && (
                    <span className="text-xs text-muted-foreground italic col-span-full">Nenhuma foto enviada.</span>
                  )}
                </div>
              ) : isSelectionGroup ? (
                <div className="flex flex-wrap gap-1.5 my-1">
                  {completedItems.map((it) => (
                    <span key={it.id} className="inline-flex items-center gap-1 rounded bg-success/10 border border-success/20 px-2.5 py-1 text-xs text-success font-medium">
                      ✓ {it.label}
                    </span>
                  ))}
                  {completedItems.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum item marcado.</span>
                  )}
                </div>
              ) : group.id === "op_equipe" ? (
                <div className="flex flex-wrap gap-1.5 my-1">
                  {group.items.map((it) => (
                    <span key={it.id} className="inline-flex items-center gap-1 rounded bg-card border border-border px-2.5 py-1 text-xs text-foreground font-medium shadow-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> {it.label}
                    </span>
                  ))}
                  {group.items.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Nenhum funcionário cadastrado.</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 my-1">
                  {completedItems.map((it) => (
                    <span key={it.id} className="inline-flex items-center gap-1 rounded bg-success/10 border border-success/20 px-2.5 py-1 text-xs text-success font-medium">
                      ✓ {it.label}
                    </span>
                  ))}
                </div>
              )}
              {group.notes && (
                <div className="mt-2 rounded border border-border/80 bg-muted/40 p-2 text-[11px] text-muted-foreground">
                  <strong className="text-foreground/70">
                    {group.id === "op_equipe" ? "Nome dos funcionários:" : "Observações:"}
                  </strong>{" "}
                  {group.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NotesSection({ ev }: { ev: EventInfo }) {
  const groupsWithNotes = ev.stages.flatMap((s) => s.groups).filter((g) => g.notes);
  if (groupsWithNotes.length === 0) return null;
  return (
    <section>
      <SectionTitle>Observações gerais das áreas</SectionTitle>
      <div className="space-y-2">
        {groupsWithNotes.map((g) => (
          <div key={g.id} className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <div className="font-semibold text-foreground">
              {g.id === "op_equipe" ? "Nome dos funcionários (Equipe)" : g.title}
            </div>
            <div className="mt-1 text-muted-foreground whitespace-pre-line">{g.notes}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PendingItemsSection({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <SectionTitle>Pendências gerais</SectionTitle>
        <p className="text-xs text-success font-medium">
          ✓ Nenhuma pendência — todas as tarefas operacionais estão concluídas!
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <SectionTitle>Pendências gerais</SectionTitle>
        <span className="text-xs font-semibold text-muted-foreground">
          {items.length} {items.length === 1 ? "item pendente" : "itens pendentes"}
        </span>
      </div>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 pt-1">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center gap-2 p-2 border border-border/70 rounded-md bg-muted/20 text-xs"
          >
            <span className="text-warning font-bold">○</span>
            <span className="truncate flex-1 font-medium text-foreground/90" title={it.label}>
              {it.label}
            </span>
            {it.dueDate && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {new Date(`${it.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

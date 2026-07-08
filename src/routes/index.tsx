import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Search,
  Plus,
  ClipboardList,
  FileBarChart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Percent,
  CalendarClock,
  Download,
  Upload,
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import {
  allItems,
  completionRate,
  eventStatus,
  useEvents,
} from "@/lib/events-store";
import type { EventStatus } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Painel de Eventos Conexão VIP" },
      {
        name: "description",
        content:
          "Visão geral de eventos, checklist operacional e progresso da equipe Conexão VIP.",
      },
    ],
  }),
  component: DashboardPage,
});

function formatDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function DashboardPage() {
  const events = useEvents();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | EventStatus>("todos");

  const handleExportData = () => {
    try {
      const data = localStorage.getItem("conexao-vip-events-v1");
      if (!data) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conexao-vip-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso!");
    } catch (e) {
      toast.error("Falha ao exportar os dados.");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("Formato inválido. Deve ser um array de eventos.");
        }
        localStorage.setItem("conexao-vip-events-v1", text);
        toast.success("Dados importados com sucesso! Recarregando...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        toast.error("Falha ao importar dados. Verifique se o arquivo está correto.");
      }
    };
    reader.readAsText(file);
  };

  const enriched = useMemo(
    () =>
      events.map((e) => {
        const items = allItems(e);
        return {
          ev: e,
          rate: completionRate(items),
          status: eventStatus(e),
          critical: 0,
        };
      }),
    [events],
  );

  const filtered = enriched.filter(({ ev, status }) => {
    if (filter !== "todos" && status !== filter) return false;
    if (q && !ev.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = useMemo(() => {
    const total = enriched.length;
    const emAndamento = enriched.filter((e) => e.status === "em_andamento").length;
    const concluidos = enriched.filter((e) => e.status === "concluido").length;
    const geral =
      total === 0
        ? 0
        : Math.round(enriched.reduce((s, e) => s + e.rate, 0) / total);
    const upcoming = [...enriched]
      .filter((e) => e.ev.date)
      .sort((a, b) => a.ev.date.localeCompare(b.ev.date))[0];
    return { total, emAndamento, concluidos, pendencias: 0, geral, upcoming };
  }, [enriched]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Dashboard operacional
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe todos os eventos e o progresso do checklist.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportData} variant="outline" size="sm" className="h-9">
            <Download className="mr-1.5 h-4 w-4" /> Exportar dados
          </Button>
          <label className="cursor-pointer inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground select-none transition-colors">
            <Upload className="h-4 w-4" />
            <span>Importar dados</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportData}
            />
          </label>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 h-9">
            <Link to="/events/new">
              <Plus className="mr-1.5 h-4 w-4" /> Novo evento
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de eventos"
          value={stats.total}
          icon={ClipboardList}
        />
        <StatCard
          label="Em andamento"
          value={stats.emAndamento}
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Concluídos"
          value={stats.concluidos}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Próximo evento"
          value={stats.upcoming ? formatDate(stats.upcoming.ev.date) : "—"}
          sub={stats.upcoming?.ev.name}
          icon={CalendarClock}
        />
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do evento…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="em_andamento">Em andamento</TabsTrigger>
            <TabsTrigger value="concluido">Concluídos</TabsTrigger>
            <TabsTrigger value="com_pendencias">Com pendências</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Events */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum evento encontrado.{" "}
              <Link to="/events/new" className="font-medium text-foreground underline">
                Cadastre o primeiro
              </Link>
              .
            </CardContent>
          </Card>
        )}
        {filtered.map(({ ev, rate, status }) => (
          <Card key={ev.id} className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-lg font-semibold text-foreground">
                      {ev.name}
                    </h3>
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {ev.endDate && ev.endDate !== ev.date 
                        ? `${formatDate(ev.date)} a ${formatDate(ev.endDate)}`
                        : formatDate(ev.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {ev.location || "—"}
                    </span>
                    <span>{ev.eventType || "—"}</span>
                    <span><strong>Org/Resp:</strong> {ev.organizer || "—"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/events/$id/checklist" params={{ id: ev.id }}>
                      <ClipboardList className="mr-1.5 h-4 w-4" /> Ver checklist
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Link to="/events/$id/report" params={{ id: ev.id }}>
                      <FileBarChart className="mr-1.5 h-4 w-4" /> Ver relatório
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "info" | "critical" | "brand";
}) {
  const toneCls: Record<string, string> = {
    default: "bg-muted text-foreground",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    critical: "bg-destructive/15 text-destructive",
    brand: "bg-brand text-brand-foreground",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${toneCls[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="truncate font-display text-xl font-bold text-foreground">
            {value}
          </div>
          {sub && <div className="truncate text-[11px] text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

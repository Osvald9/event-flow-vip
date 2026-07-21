import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  FileBarChart,
  Paperclip,
  Trash2,
  Upload,
  Plus,
  X,
  User,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import {
  allItems,
  completionRate,
  deleteEvent,
  eventStatus,
  stageCompletion,
  updateItem,
  updateEvent,
  updateGroupNotes,
  addItemToGroup,
  removeItemFromGroup,
  useEvent,
} from "@/lib/events-store";
import type { ChecklistItem, ItemStatus } from "@/lib/types";

export const Route = createFileRoute("/events/$id/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist do evento — Painel Conexão VIP" },
      { name: "description", content: "Checklist operacional detalhado do evento." },
    ],
  }),
  component: ChecklistPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Evento não encontrado.{" "}
      <Link to="/" className="underline">
        Voltar ao painel
      </Link>
      .
    </div>
  ),
});

function ChecklistPage() {
  const { id } = Route.useParams();
  const ev = useEvent(id);
  if (!ev) throw notFound();

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const items = allItems(ev);
  const rate = completionRate(items);
  const status = eventStatus(ev);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao painel
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/events/$id/report" params={{ id }}>
              <FileBarChart className="mr-1.5 h-4 w-4" /> Ver relatório
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Excluir este evento? Esta ação não pode ser desfeita.")) {
                deleteEvent(id);
                toast.success("Evento excluído.");
                window.history.back();
              }
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      {/* Event header */}
      <Card className="overflow-hidden border-l-4 border-l-brand">
        <CardContent className="p-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-2xl font-bold text-foreground">
                  {ev.name}
                </h1>
                <StatusBadge status={status} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingEvent(true)}
                className="h-8 text-xs bg-card hover:bg-accent"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar informações do evento
              </Button>
            </div>
            
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
              <div><strong>Organizador:</strong> {ev.organizer || "—"}</div>
              <div><strong>Responsável:</strong> {ev.responsible || "—"}</div>
              <div><strong>WhatsApp:</strong> {ev.whatsapp || ev.phone || "—"}</div>
              <div><strong>E-mail:</strong> {ev.email || "—"}</div>
              <div><strong>Local:</strong> {ev.location || "—"}</div>
              <div>
                <strong>Datas:</strong>{" "}
                {ev.endDate && ev.endDate !== ev.date
                  ? `${ev.date.split("-").reverse().join("/")} a ${ev.endDate.split("-").reverse().join("/")}`
                  : ev.date.split("-").reverse().join("/")}
              </div>
              <div><strong>Tipo:</strong> {ev.eventType || "—"}</div>
              <div><strong>Público:</strong> {ev.audience ? `${ev.audience} pessoas` : "—"}</div>
            </div>

            {ev.mapImage && (
              <div className="mt-3 flex items-start gap-2">
                <div className="text-xs">
                  <span className="font-semibold block text-muted-foreground mb-1">Mapa do Stand:</span>
                  <a href={ev.mapImage} target="_blank" rel="noreferrer" className="block hover:opacity-90">
                    <img src={ev.mapImage} alt="Mapa do Stand" className="max-h-24 rounded object-contain border border-border" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditEventDialog
        ev={ev}
        open={isEditingEvent}
        onOpenChange={setIsEditingEvent}
      />

      {/* Stages */}
      <div className="mt-4 space-y-3">
        {ev.stages.map((stage) => {
          const sRate = stageCompletion(ev, stage.id);
          return (
            <Card key={stage.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-lg">{stage.title}</CardTitle>
                    {stage.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {stage.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {stage.groups.map((group) => {
                    const gRate = group.id === "comercial_parceria"
                      ? (ev.partnershipType ? 100 : 0)
                      : completionRate(group.items);
                    return (
                      <AccordionItem key={group.id} value={group.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                            <span className="text-sm font-medium">{group.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {group.id === "comercial_parceria" ? (
                            <div className="space-y-4 p-3 bg-muted/20 border border-border rounded-lg">
                              <div>
                                <Label className="text-xs font-semibold mb-1.5 block text-foreground">
                                  Tipo de Parceria
                                </Label>
                                <Select
                                  value={ev.partnershipType || ""}
                                  onValueChange={(v) => updateEvent(ev.id, { partnershipType: v })}
                                >
                                  <SelectTrigger className="w-full bg-card">
                                    <SelectValue placeholder="Selecione o tipo de parceria" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Patrocínio Ouro">Patrocínio Ouro</SelectItem>
                                    <SelectItem value="Patrocínio Prata">Patrocínio Prata</SelectItem>
                                    <SelectItem value="Patrocínio Bronze">Patrocínio Bronze</SelectItem>
                                    <SelectItem value="Apoio">Apoio</SelectItem>
                                    <SelectItem value="Fornecedor Oficial de Internet">Fornecedor Oficial de Internet</SelectItem>
                                    <SelectItem value="Venda de internet temporária">Venda de internet temporária</SelectItem>
                                    <SelectItem value="Permuta">Permuta</SelectItem>
                                    <SelectItem value="Contrato financeiro">Contrato financeiro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="quotaValue" className="text-xs font-semibold mb-1.5 block text-foreground">
                                  Valor da cota fechada
                                </Label>
                                <Input
                                  id="quotaValue"
                                  placeholder="Ex: R$ 15.000,00"
                                  value={ev.quotaValue || ""}
                                  onChange={(e) => updateEvent(ev.id, { quotaValue: e.target.value })}
                                  className="bg-card"
                                />
                              </div>
                            </div>
                          ) : group.id === "op_registros" ? (
                            <div className="space-y-4 p-3 bg-muted/20 border border-border rounded-lg">
                              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                                {group.items.map((it) => {
                                  const isDone = it.status === "concluido";
                                  return (
                                    <div key={it.id} className={`border rounded-lg p-3 bg-card space-y-2.5 flex flex-col justify-between transition-colors ${
                                      isDone ? "bg-success/5 border-success/30" : "border-border"
                                    }`}>
                                      <div className="flex items-start gap-2 min-w-0">
                                        <Checkbox
                                          id={it.id}
                                          checked={isDone}
                                          onCheckedChange={(checked) =>
                                            updateItem(ev.id, it.id, {
                                              status: checked ? "concluido" : "pendente",
                                            })
                                          }
                                          className="mt-0.5"
                                        />
                                        <Label htmlFor={it.id} className="text-xs font-semibold leading-tight cursor-pointer break-words flex-1">
                                          {it.label}
                                        </Label>
                                      </div>
                                      <div className="pt-1">
                                        {it.attachment ? (
                                          <div className="relative group w-full aspect-video border border-border rounded overflow-hidden bg-muted">
                                            <img src={it.attachment} alt={it.label} className="w-full h-full object-cover" />
                                            <button
                                              type="button"
                                              onClick={() => updateItem(ev.id, it.id, { attachment: "", status: "pendente" })}
                                              className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full shadow hover:bg-destructive/80 transition-colors"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div>
                                            <label className="cursor-pointer inline-flex w-full items-center justify-center gap-1.5 rounded border border-input bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground select-none transition-colors">
                                              <Upload className="h-3.5 w-3.5" />
                                              <span>Enviar foto</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                      if (event.target?.result) {
                                                        updateItem(ev.id, it.id, {
                                                          attachment: event.target.result as string,
                                                          status: "concluido"
                                                        });
                                                        toast.success("Foto anexada com sucesso.");
                                                      }
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                              />
                                            </label>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="pt-3 border-t border-border">
                                <Label htmlFor={`notes-${group.id}`} className="text-xs font-semibold mb-1.5 block text-foreground">
                                  Observações do grupo
                                </Label>
                                <Textarea
                                  id={`notes-${group.id}`}
                                  placeholder={`Observações gerais sobre ${group.title.toLowerCase()}...`}
                                  value={group.notes || ""}
                                  onChange={(e) => updateGroupNotes(ev.id, group.id, e.target.value)}
                                  className="bg-card text-xs"
                                  rows={2}
                                />
                              </div>
                            </div>
                          ) : group.id === "op_equipe" ? (
                            <TeamGroupSection eventId={ev.id} group={group} />
                          ) : (
                            <div className="space-y-4 p-3 bg-muted/20 border border-border rounded-lg">
                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                {group.items.map((it) => {
                                  const isDone = it.status === "concluido";
                                  return (
                                    <label key={it.id} className={`flex items-center gap-2 text-xs p-2 border rounded-lg cursor-pointer hover:bg-muted/50 select-none transition-colors ${
                                      isDone ? "bg-success/5 border-success/30" : "bg-card border-border"
                                    }`}>
                                      <Checkbox
                                        checked={isDone}
                                        onCheckedChange={(checked) =>
                                          updateItem(ev.id, it.id, {
                                            status: checked ? "concluido" : "pendente",
                                          })
                                        }
                                      />
                                      <span className={`truncate flex-1 ${isDone ? "font-medium" : ""}`}>{it.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              <div className="pt-3 border-t border-border">
                                <Label htmlFor={`notes-${group.id}`} className="text-xs font-semibold mb-1.5 block text-foreground">
                                  Observações do grupo
                                </Label>
                                <Textarea
                                  id={`notes-${group.id}`}
                                  placeholder={`Observações gerais sobre ${group.title.toLowerCase()}...`}
                                  value={group.notes || ""}
                                  onChange={(e) => updateGroupNotes(ev.id, group.id, e.target.value)}
                                  className="bg-card text-xs"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({ eventId, item }: { eventId: string; item: ChecklistItem }) {
  const done = item.status === "concluido";
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        done ? "border-success/30 bg-success/5" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <Checkbox
          checked={done}
          onCheckedChange={(v) =>
            updateItem(eventId, item.id, {
              status: v ? "concluido" : "pendente",
            })
          }
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
            >
              {item.label}
            </span>
            {item.critical && (
              <span className="inline-flex items-center gap-1 rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                <AlertTriangle className="h-3 w-3" /> Crítico
              </span>
            )}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-[11px] text-muted-foreground">Status</Label>
              <Select
                value={item.status}
                onValueChange={(v: ItemStatus) =>
                  updateItem(eventId, item.id, { status: v })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="na">Não se aplica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Responsável</Label>
              <Input
                value={item.responsible ?? ""}
                onChange={(e) =>
                  updateItem(eventId, item.id, { responsible: e.target.value })
                }
                className="h-8 text-xs"
                placeholder="Nome"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Prazo</Label>
              <Input
                type="date"
                value={item.dueDate ?? ""}
                onChange={(e) =>
                  updateItem(eventId, item.id, { dueDate: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                <Paperclip className="mr-0.5 inline h-3 w-3" />
                Link / anexo
              </Label>
              <Input
                value={item.attachment ?? ""}
                onChange={(e) =>
                  updateItem(eventId, item.id, { attachment: e.target.value })
                }
                className="h-8 text-xs"
                placeholder="URL foto ou documento"
              />
            </div>
          </div>

          <div className="mt-2">
            <Textarea
              value={item.notes ?? ""}
              onChange={(e) => updateItem(eventId, item.id, { notes: e.target.value })}
              rows={2}
              placeholder="Observações…"
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamGroupSection({
  eventId,
  group,
}: {
  eventId: string;
  group: { id: string; title: string; items: ChecklistItem[]; notes?: string };
}) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addItemToGroup(eventId, group.id, name.trim());
    setName("");
    toast.success("Funcionário adicionado à equipe.");
  };

  return (
    <div className="space-y-4 p-3 bg-muted/20 border border-border rounded-lg">
      <div>
        <Label className="text-xs font-semibold mb-1.5 block text-foreground">
          Inserir funcionário (digite o nome e pressione Enter)
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Nome do funcionário..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="bg-card text-xs flex-1"
          />
          <Button type="button" size="sm" onClick={handleAdd} className="h-9 px-3 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold mb-1.5 block text-foreground">
          Membros da equipe ({group.items.length})
        </Label>
        <div className="flex flex-wrap gap-2">
          {group.items.map((it) => (
            <span
              key={it.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium text-foreground shadow-sm"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{it.label}</span>
              <button
                type="button"
                onClick={() => {
                  removeItemFromGroup(eventId, it.id);
                  toast.success("Funcionário removido.");
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Remover"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {group.items.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Nenhum funcionário inserido. Digite o nome no campo acima e pressione Enter.
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <Label htmlFor={`notes-${group.id}`} className="text-xs font-semibold mb-1.5 block text-foreground">
          Observações da equipe
        </Label>
        <Textarea
          id={`notes-${group.id}`}
          placeholder="Observações adicionais sobre a equipe..."
          value={group.notes || ""}
          onChange={(e) => updateGroupNotes(eventId, group.id, e.target.value)}
          className="bg-card text-xs"
          rows={2}
        />
      </div>
    </div>
  );
}

function EditEventDialog({
  ev,
  open,
  onOpenChange,
}: {
  ev: EventInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    name: ev.name || "",
    organizer: ev.organizer || "",
    responsible: ev.responsible || "",
    phone: ev.phone || "",
    whatsapp: ev.whatsapp || "",
    email: ev.email || "",
    location: ev.location || "",
    date: ev.date || "",
    endDate: ev.endDate || "",
    setupDate: ev.setupDate || "",
    setupTime: ev.setupTime || "",
    eventTime: ev.eventTime || "",
    teardownDate: ev.teardownDate || "",
    teardownTime: ev.teardownTime || "",
    audience: ev.audience || "",
    eventType: ev.eventType || "",
    mapLink: ev.mapLink || "",
    mapImage: ev.mapImage || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent(ev.id, formData);
    toast.success("Informações do evento atualizadas com sucesso!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-display">Editar informações do evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="edit-name" className="text-xs font-semibold block mb-1">
                Nome do evento *
              </Label>
              <Input
                id="edit-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-organizer" className="text-xs font-semibold block mb-1">
                Organizador / Empresa
              </Label>
              <Input
                id="edit-organizer"
                placeholder="Ex: Conexão VIP, Prefeitura..."
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-responsible" className="text-xs font-semibold block mb-1">
                Responsável / Contato
              </Label>
              <Input
                id="edit-responsible"
                placeholder="Nome do responsável"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-whatsapp" className="text-xs font-semibold block mb-1">
                WhatsApp
              </Label>
              <Input
                id="edit-whatsapp"
                placeholder="(48) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-email" className="text-xs font-semibold block mb-1">
                E-mail
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="contato@evento.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-location" className="text-xs font-semibold block mb-1">
                Localização / Cidade
              </Label>
              <Input
                id="edit-location"
                placeholder="Ex: CentroSul - Florianópolis/SC"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-eventType" className="text-xs font-semibold block mb-1">
                Tipo de evento
              </Label>
              <Input
                id="edit-eventType"
                placeholder="Ex: Feira de tecnologia, Exposição..."
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-date" className="text-xs font-semibold block mb-1">
                Data de Início *
              </Label>
              <Input
                id="edit-date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-endDate" className="text-xs font-semibold block mb-1">
                Data de Término
              </Label>
              <Input
                id="edit-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-setupDate" className="text-xs font-semibold block mb-1">
                Data da Montagem
              </Label>
              <Input
                id="edit-setupDate"
                type="date"
                value={formData.setupDate}
                onChange={(e) => setFormData({ ...formData, setupDate: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-setupTime" className="text-xs font-semibold block mb-1">
                Horário da Montagem
              </Label>
              <Input
                id="edit-setupTime"
                type="time"
                value={formData.setupTime}
                onChange={(e) => setFormData({ ...formData, setupTime: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-eventTime" className="text-xs font-semibold block mb-1">
                Horário do Evento
              </Label>
              <Input
                id="edit-eventTime"
                placeholder="Ex: 14:00 às 22:00"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-teardownDate" className="text-xs font-semibold block mb-1">
                Data da Desmontagem
              </Label>
              <Input
                id="edit-teardownDate"
                type="date"
                value={formData.teardownDate}
                onChange={(e) => setFormData({ ...formData, teardownDate: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-teardownTime" className="text-xs font-semibold block mb-1">
                Horário da Desmontagem
              </Label>
              <Input
                id="edit-teardownTime"
                type="time"
                value={formData.teardownTime}
                onChange={(e) => setFormData({ ...formData, teardownTime: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-audience" className="text-xs font-semibold block mb-1">
                Público estimado
              </Label>
              <Input
                id="edit-audience"
                placeholder="Ex: 5000"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="bg-card text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="edit-mapLink" className="text-xs font-semibold block mb-1">
                Notas de localização do Stand
              </Label>
              <Textarea
                id="edit-mapLink"
                placeholder="Instruções sobre o local do stand..."
                value={formData.mapLink}
                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                className="bg-card text-xs"
                rows={2}
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold block mb-1">
                Imagem / Mapa do Stand
              </Label>
              <div className="flex items-center gap-3">
                {formData.mapImage && (
                  <img src={formData.mapImage} alt="Mapa" className="h-16 w-16 rounded object-cover border border-border" />
                )}
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-input bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground select-none transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{formData.mapImage ? "Alterar foto do mapa" : "Upload foto do mapa"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setFormData({ ...formData, mapImage: event.target.result as string });
                            toast.success("Foto do mapa selecionada.");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {formData.mapImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 px-2 text-xs"
                    onClick={() => setFormData({ ...formData, mapImage: "" })}
                  >
                    Remover imagem
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

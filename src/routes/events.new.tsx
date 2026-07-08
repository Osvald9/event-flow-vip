import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEvent } from "@/lib/events-store";

export const Route = createFileRoute("/events/new")({
  head: () => ({
    meta: [
      { title: "Novo evento — Painel Conexão VIP" },
      { name: "description", content: "Cadastre um novo evento no painel Conexão VIP." },
    ],
  }),
  component: NewEventPage,
});

const STANDARD_EVENT_TYPES = ["Show", "Feira", "Rodeio", "Exposição", "Congresso", "Esporte"];

function NewEventPage() {
  const navigate = useNavigate();

  // Custom form states
  const [name, setName] = useState("");
  const [organizerAndResponsible, setOrganizerAndResponsible] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [setupTime, setSetupTime] = useState("");
  const [setupDate, setSetupDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [teardownTime, setTeardownTime] = useState("");
  const [teardownDate, setTeardownDate] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedType, setSelectedType] = useState("Feira");
  const [customType, setCustomType] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [mapImage, setMapImage] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMapImage(event.target.result as string);
        toast.success("Imagem do mapa carregada com sucesso.");
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do evento.");
      return;
    }

    const eventType = selectedType === "Outro" ? customType : selectedType;

    const dataToSubmit = {
      name,
      organizer: organizerAndResponsible,
      responsible: organizerAndResponsible,
      phone: "", // Removed phone field
      whatsapp,
      email,
      location,
      date,
      endDate: endDate || date, // Fallback end date to start date
      setupTime,
      setupDate,
      eventTime,
      teardownTime,
      teardownDate,
      audience,
      eventType,
      mapLink,
      mapImage,
    };

    const ev = createEvent(dataToSubmit);
    toast.success("Evento cadastrado.");
    navigate({ to: "/events/$id/checklist", params: { id: ev.id } });
  };

  const resetForm = () => {
    setName("");
    setOrganizerAndResponsible("");
    setWhatsapp("");
    setEmail("");
    setLocation("");
    setDate("");
    setEndDate("");
    setSetupTime("");
    setSetupDate("");
    setEventTime("");
    setTeardownTime("");
    setTeardownDate("");
    setAudience("");
    setSelectedType("Feira");
    setCustomType("");
    setMapLink("");
    setMapImage("");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/" })}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
      </Button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Cadastrar novo evento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados principais da Conexão VIP. O checklist correspondente será gerado automaticamente.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Informações do evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Name */}
              <div>
                <Label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Nome do evento *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Festival Conexão VIP 2026"
                  required
                />
              </div>

              {/* Combined Organizer and Responsible */}
              <div>
                <Label htmlFor="organizer" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Organizador / Responsável
                </Label>
                <Input
                  id="organizer"
                  value={organizerAndResponsible}
                  onChange={(e) => setOrganizerAndResponsible(e.target.value)}
                  placeholder="Ex: Roberto Carlos / Mariana Costa"
                />
              </div>

              {/* Contacts Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="whatsapp" className="mb-1.5 block text-xs font-semibold text-foreground">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: (11) 98888-7777"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-foreground">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: contato@evento.com.br"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Local
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Centro de Eventos Sul - Stand 23"
                />
              </div>

              {/* Date Period Selector */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Data de início
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Data de término
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={date}
                  />
                </div>
              </div>

              {/* Schedules Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Setup Schedule */}
                <div className="border border-border rounded-lg p-3 bg-muted/10 space-y-2">
                  <span className="text-xs font-bold text-foreground block">Montagem</span>
                  <div>
                    <Label htmlFor="setupDate" className="mb-1 block text-[10px] text-muted-foreground">Data</Label>
                    <Input
                      id="setupDate"
                      type="date"
                      value={setupDate}
                      onChange={(e) => setSetupDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="setupTime" className="mb-1 block text-[10px] text-muted-foreground">Horário</Label>
                    <Input
                      id="setupTime"
                      type="time"
                      value={setupTime}
                      onChange={(e) => setSetupTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Event Schedule */}
                <div className="border border-border rounded-lg p-3 bg-muted/10 space-y-2">
                  <span className="text-xs font-bold text-foreground block">Horário do Evento</span>
                  <div>
                    <Label htmlFor="eventTime" className="mb-1 block text-[10px] text-muted-foreground">Hora de início</Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Teardown Schedule */}
                <div className="border border-border rounded-lg p-3 bg-muted/10 space-y-2">
                  <span className="text-xs font-bold text-foreground block">Desmontagem</span>
                  <div>
                    <Label htmlFor="teardownDate" className="mb-1 block text-[10px] text-muted-foreground">Data</Label>
                    <Input
                      id="teardownDate"
                      type="date"
                      value={teardownDate}
                      onChange={(e) => setTeardownDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="teardownTime" className="mb-1 block text-[10px] text-muted-foreground">Horário</Label>
                    <Input
                      id="teardownTime"
                      type="time"
                      value={teardownTime}
                      onChange={(e) => setTeardownTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Audience and Custom Event Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="audience" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Público estimado
                  </Label>
                  <Input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Ex: 5000 pessoas"
                  />
                </div>

                {/* Event Type Selectable Chips */}
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Tipo de evento
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {STANDARD_EVENT_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedType(t)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selectedType === t
                            ? "bg-brand text-brand-foreground border-brand"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedType("Outro")}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        selectedType === "Outro"
                          ? "bg-brand text-brand-foreground border-brand"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      Outro
                    </button>
                  </div>
                  {selectedType === "Outro" && (
                    <Input
                      placeholder="Especifique o tipo (ex: Rodeio, Exposição)"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Map & Stand Setup: text and Image Upload */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="mapLink" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Notas de localização do Stand
                  </Label>
                  <Textarea
                    id="mapLink"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    placeholder="Descrição da localização do stand Conexão VIP no evento ou links de referência..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Upload do Mapa (Imagem)
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] bg-muted/20 relative">
                    {mapImage ? (
                      <div className="w-full flex flex-col items-center gap-2">
                        <img
                          src={mapImage}
                          alt="Stand Map"
                          className="max-h-24 object-contain rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => setMapImage("")}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remover imagem
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 w-full text-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">Clique para selecionar imagem do mapa</span>
                        <span className="text-[10px] text-muted-foreground">PNG, JPG, GIF</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            Limpar
          </Button>
          <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Save className="mr-1.5 h-4 w-4" /> Salvar e abrir checklist
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useSyncExternalStore } from "react";
import { CHECKLIST_TEMPLATE } from "./checklist-template";
import type { ChecklistItem, EventInfo, EventStatus, ItemStatus } from "./types";
import { supabase } from "./supabase";
import INITIAL_DATA from "./initial-events.json";

const KEY = "conexao-vip-events-v1";

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: EventInfo[] | null = null;
let isSyncing = false;

function notify() {
  listeners.forEach((l) => l());
}

function getLocalData(): EventInfo[] {
  if (typeof window === "undefined") return INITIAL_DATA as EventInfo[];
  try {
    const rawLocal = window.localStorage.getItem(KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler localStorage:", e);
  }
  return INITIAL_DATA as EventInfo[];
}

function writeCache(next: EventInfo[]) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }
  notify();
}

async function fetchAndSync() {
  if (typeof window === "undefined" || isSyncing) return;
  isSyncing = true;

  try {
    const currentLocal = getLocalData();

    // 1. Buscar dados do Supabase
    const { data: dbData, error } = await supabase
      .from("events")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
      writeCache(currentLocal);
      isSyncing = false;
      return;
    }

    const dbEvents = dbData || [];
    let combinedEvents = [...dbEvents];

    // Sincronizar todos os eventos locais que ainda não estejam no banco
    for (const localEv of currentLocal) {
      const exists = combinedEvents.some((dbEv) => dbEv.id === localEv.id);
      if (!exists) {
        combinedEvents.unshift(localEv);
        // Subir o evento faltante para o Supabase sem bloquear a UI
        supabase.from("events").insert(localEv).then(({ error: insertError }) => {
          if (insertError) {
            console.error(`Erro ao subir evento ${localEv.name} para o Supabase:`, insertError);
          } else {
            console.log(`Evento ${localEv.name} sincronizado com o Supabase com sucesso.`);
          }
        });
      }
    }

    // Se nem o banco nem o localStorage tiverem dados, subir INITIAL_DATA
    if (combinedEvents.length === 0) {
      const initial = INITIAL_DATA as EventInfo[];
      combinedEvents = initial;
      for (const sEv of initial) {
        supabase.from("events").insert(sEv);
      }
    }

    writeCache(combinedEvents);
  } catch (err) {
    console.error("Erro na sincronização:", err);
    writeCache(getLocalData());
  } finally {
    isSyncing = false;
  }
}

// Iniciar a busca e sincronização no cliente
if (typeof window !== "undefined") {
  fetchAndSync();

  // Escutar atualizações em tempo real do Supabase
  supabase
    .channel("public:events")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events" },
      () => {
        fetchAndSync();
      }
    )
    .subscribe();
}

function read(): EventInfo[] {
  if (cache) return cache;
  return (cache = getLocalData());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function cloneTemplate() {
  return JSON.parse(JSON.stringify(CHECKLIST_TEMPLATE)) as EventInfo["stages"];
}

function seed(): EventInfo[] {
  const now = new Date().toISOString();
  const demo: EventInfo = {
    id: "demo-expo-tech",
    name: "Expo Tech Sul 2026",
    organizer: "Grupo Sul Feiras",
    responsible: "Marina Alves",
    phone: "(48) 3025-1010",
    whatsapp: "(48) 99999-8888",
    email: "marina@expotechsul.com",
    location: "CentroSul — Florianópolis/SC",
    date: "2026-08-14",
    setupTime: "08:00",
    eventTime: "14:00",
    teardownTime: "22:00",
    audience: "5000",
    eventType: "Feira de tecnologia",
    days: "3",
    mapLink: "",
    createdAt: now,
    updatedAt: now,
    stages: cloneTemplate(),
  };
  demo.stages[0].groups[0].items[0].status = "concluido";
  demo.stages[0].groups[0].items[7].status = "concluido";
  demo.stages[1].groups[0].items[0].status = "concluido";
  demo.stages[1].groups[0].items[1].status = "em_andamento";
  return [demo];
}

export function useEvents(): EventInfo[] {
  return useSyncExternalStore(subscribe, read, () => []);
}

export function useEvent(id: string | undefined): EventInfo | undefined {
  const events = useEvents();
  return events.find((e) => e.id === id);
}

export async function createEvent(input: Omit<EventInfo, "id" | "createdAt" | "updatedAt" | "stages">) {
  const now = new Date().toISOString();
  
  const start = new Date(input.date);
  const end = input.endDate ? new Date(input.endDate) : start;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const days = String(isNaN(diffDays) ? 1 : diffDays);

  const ev: EventInfo = {
    ...input,
    days,
    id: `ev-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    stages: cloneTemplate(),
  };

  const current = cache || [];
  writeCache([ev, ...current]);

  const { error } = await supabase.from("events").insert(ev);
  if (error) {
    console.error("Erro ao criar evento no Supabase:", error);
  }
  return ev;
}

export async function updateEvent(id: string, patch: Partial<EventInfo>) {
  const current = cache || [];
  let updatedEvent: EventInfo | null = null;

  const next = current.map((e) => {
    if (e.id !== id) return e;
    const newPatch = { ...patch };
    if (newPatch.date || newPatch.endDate) {
      const dateVal = newPatch.date || e.date;
      const endDateVal = newPatch.endDate || e.endDate || dateVal;
      const start = new Date(dateVal);
      const end = new Date(endDateVal);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      newPatch.days = String(isNaN(diffDays) ? 1 : diffDays);
    }
    updatedEvent = { ...e, ...newPatch, updatedAt: new Date().toISOString() };
    return updatedEvent;
  });

  writeCache(next);

  if (updatedEvent) {
    const { error } = await supabase
      .from("events")
      .update(updatedEvent)
      .eq("id", id);
    if (error) {
      console.error("Erro ao atualizar evento no Supabase:", error);
    }
  }
}

export async function deleteEvent(id: string) {
  const current = cache || [];
  writeCache(current.filter((e) => e.id !== id));

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Erro ao deletar evento no Supabase:", error);
  }
}

export async function updateItem(
  eventId: string,
  itemId: string,
  patch: Partial<ChecklistItem>,
) {
  const current = cache || [];
  let updatedEvent: EventInfo | null = null;

  const next = current.map((e) => {
    if (e.id !== eventId) return e;
    updatedEvent = {
      ...e,
      updatedAt: new Date().toISOString(),
      stages: e.stages.map((s) => ({
        ...s,
        groups: s.groups.map((g) => ({
          ...g,
          items: g.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        })),
      })),
    };
    return updatedEvent;
  });

  writeCache(next);

  if (updatedEvent) {
    const { error } = await supabase
      .from("events")
      .update({
        stages: updatedEvent.stages,
        updatedAt: updatedEvent.updatedAt
      })
      .eq("id", eventId);
    if (error) {
      console.error("Erro ao atualizar item no Supabase:", error);
    }
  }
}

export async function updateGroupNotes(eventId: string, groupId: string, notes: string) {
  const current = cache || [];
  let updatedEvent: EventInfo | null = null;

  const next = current.map((e) => {
    if (e.id !== eventId) return e;
    updatedEvent = {
      ...e,
      updatedAt: new Date().toISOString(),
      stages: e.stages.map((s) => ({
        ...s,
        groups: s.groups.map((g) => (g.id === groupId ? { ...g, notes } : g)),
      })),
    };
    return updatedEvent;
  });

  writeCache(next);

  if (updatedEvent) {
    const { error } = await supabase
      .from("events")
      .update({
        stages: updatedEvent.stages,
        updatedAt: updatedEvent.updatedAt
      })
      .eq("id", eventId);
    if (error) {
      console.error("Erro ao atualizar notas no Supabase:", error);
    }
  }
}

export async function addItemToGroup(eventId: string, groupId: string, label: string) {
  const current = cache || [];
  let updatedEvent: EventInfo | null = null;
  const newItemId = `${groupId}__${Date.now().toString(36)}`;

  const next = current.map((e) => {
    if (e.id !== eventId) return e;
    updatedEvent = {
      ...e,
      updatedAt: new Date().toISOString(),
      stages: e.stages.map((s) => ({
        ...s,
        groups: s.groups.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            items: [
              ...g.items,
              {
                id: newItemId,
                label: label.trim(),
                status: "concluido" as const,
              },
            ],
          };
        }),
      })),
    };
    return updatedEvent;
  });

  writeCache(next);

  if (updatedEvent) {
    const { error } = await supabase.from("events").update({
      stages: updatedEvent.stages,
      updatedAt: updatedEvent.updatedAt,
    }).eq("id", eventId);
    if (error) {
      console.error("Erro ao adicionar item no Supabase:", error);
    }
  }
}

export async function removeItemFromGroup(eventId: string, itemId: string) {
  const current = cache || [];
  let updatedEvent: EventInfo | null = null;

  const next = current.map((e) => {
    if (e.id !== eventId) return e;
    updatedEvent = {
      ...e,
      updatedAt: new Date().toISOString(),
      stages: e.stages.map((s) => ({
        ...s,
        groups: s.groups.map((g) => ({
          ...g,
          items: g.items.filter((it) => it.id !== itemId),
        })),
      })),
    };
    return updatedEvent;
  });

  writeCache(next);

  if (updatedEvent) {
    const { error } = await supabase.from("events").update({
      stages: updatedEvent.stages,
      updatedAt: updatedEvent.updatedAt,
    }).eq("id", eventId);
    if (error) {
      console.error("Erro ao remover item no Supabase:", error);
    }
  }
}

// ---- Derived helpers ----

export function allItems(ev: EventInfo): ChecklistItem[] {
  return ev.stages.flatMap((s) => 
    s.groups.flatMap((g) => 
      g.id === "comercial_parceria" || 
      g.id === "comercial_contrapartidas" || 
      g.id === "tec_internet" || 
      g.id === "tec_banda" ||
      g.id === "op_equipe" ? [] : g.items
    )
  );
}

export function countable(items: ChecklistItem[]) {
  return items.filter((i) => i.status !== "na");
}

export function completionRate(items: ChecklistItem[]): number {
  const c = countable(items);
  if (c.length === 0) return 0;
  const done = c.filter((i) => i.status === "concluido").length;
  return Math.round((done / c.length) * 100);
}

export function stageCompletion(ev: EventInfo, stageId: string): number {
  const stage = ev.stages.find((s) => s.id === stageId);
  if (!stage) return 0;
  if (stageId === "comercial") {
    const partnershipDone = ev.partnershipType ? 1 : 0;
    const contrapartidasGroup = stage.groups.find((g) => g.id === "comercial_contrapartidas");
    const countableContrapartidas = contrapartidasGroup
      ? contrapartidasGroup.items.filter((i) => i.status !== "na")
      : [];
    const contrapartidasDone = countableContrapartidas.filter((i) => i.status === "concluido").length;
    const contrapartidasTotal = countableContrapartidas.length;
    
    const totalDone = partnershipDone + contrapartidasDone;
    const totalCount = 1 + contrapartidasTotal;
    return totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0;
  }
  return completionRate(stage.groups.flatMap((g) => g.items));
}

export function eventStatus(ev: EventInfo): EventStatus {
  const items = allItems(ev);
  const rate = completionRate(items);
  if (rate === 100) return "concluido";
  if (rate > 0) return "em_andamento";
  return "planejado";
}

export const STATUS_LABEL: Record<ItemStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  na: "Não se aplica",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  com_pendencias: "Com pendências",
};

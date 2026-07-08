import { useSyncExternalStore } from "react";
import { CHECKLIST_TEMPLATE } from "./checklist-template";
import type { ChecklistItem, EventInfo, EventStatus, ItemStatus } from "./types";

const KEY = "conexao-vip-events-v1";

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: EventInfo[] | null = null;

function read(): EventInfo[] {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = []);
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as EventInfo[]) : seed();
    if (!raw) write(cache);
    return cache;
  } catch {
    return (cache = []);
  }
}

function write(next: EventInfo[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
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
  // Mark a few items as done in demo
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

export function createEvent(input: Omit<EventInfo, "id" | "createdAt" | "updatedAt" | "stages">) {
  const now = new Date().toISOString();
  
  // Calculate days count
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
  write([ev, ...read()]);
  return ev;
}

export function updateEvent(id: string, patch: Partial<EventInfo>) {
  const next = read().map((e) => {
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
    return { ...e, ...newPatch, updatedAt: new Date().toISOString() };
  });
  write(next);
}

export function deleteEvent(id: string) {
  write(read().filter((e) => e.id !== id));
}

export function updateItem(
  eventId: string,
  itemId: string,
  patch: Partial<ChecklistItem>,
) {
  const next = read().map((e) => {
    if (e.id !== eventId) return e;
    return {
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
  });
  write(next);
}

export function updateGroupNotes(eventId: string, groupId: string, notes: string) {
  const next = read().map((e) => {
    if (e.id !== eventId) return e;
    return {
      ...e,
      updatedAt: new Date().toISOString(),
      stages: e.stages.map((s) => ({
        ...s,
        groups: s.groups.map((g) => (g.id === groupId ? { ...g, notes } : g)),
      })),
    };
  });
  write(next);
}

// ---- Derived helpers ----

export function allItems(ev: EventInfo): ChecklistItem[] {
  return ev.stages.flatMap((s) => 
    s.groups.flatMap((g) => 
      g.id === "comercial_parceria" ? [] : g.items
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
    const contrapartidasDone = contrapartidasGroup 
      ? contrapartidasGroup.items.filter((i) => i.status === "concluido").length 
      : 0;
    const contrapartidasTotal = contrapartidasGroup ? contrapartidasGroup.items.length : 0;
    
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

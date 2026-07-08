export type ItemStatus = "pendente" | "em_andamento" | "concluido" | "na";

export type EventStatus = "em_andamento" | "concluido" | "com_pendencias" | "planejado";

export interface ChecklistItem {
  id: string;
  label: string;
  critical?: boolean;
  status: ItemStatus;
  responsible?: string;
  dueDate?: string;
  notes?: string;
  attachment?: string;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
  notes?: string;
}

export interface ChecklistStage {
  id: string;
  title: string;
  description?: string;
  groups: ChecklistGroup[];
}

export interface EventInfo {
  id: string;
  name: string;
  organizer: string;
  responsible: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  date: string;
  setupTime: string;
  eventTime: string;
  teardownTime: string;
  setupDate?: string;
  teardownDate?: string;
  audience: string;
  eventType: string;
  days: string;
  mapLink: string;
  endDate?: string;
  mapImage?: string;
  partnershipType?: string;
  quotaValue?: string;
  contrapartidasNotes?: string;
  createdAt: string;
  updatedAt: string;
  stages: ChecklistStage[];
}

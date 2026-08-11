// Grounded directly against the live Supabase schema (ilbyzbmridyxxblclpyf) —
// seller_leads / seller_lead_* tables, crm_* tables, and their check constraints.

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "APPLICATION",
  "REGISTERED",
  "VERIFIED",
  "PRODUCTS_UPLOADED",
  "ACTIVE",
  "FIRST_ORDER",
  "INACTIVE",
  "LOST",
  "REJECTED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS_UZ: Record<LeadStatus, string> = {
  NEW: "Lead",
  CONTACTED: "Bog'lanildi",
  INTERESTED: "Qiziqdi",
  APPLICATION: "Ariza",
  REGISTERED: "Ro'yxatdan o'tdi",
  VERIFIED: "Tasdiqlandi",
  PRODUCTS_UPLOADED: "Mahsulot yuklandi",
  ACTIVE: "Aktiv",
  FIRST_ORDER: "Birinchi buyurtma",
  INACTIVE: "Nofaol",
  LOST: "Yo'qotildi",
  REJECTED: "Rad etildi",
};

// The core 9-stage acquisition funnel (the remaining 3 — INACTIVE/LOST/REJECTED — are
// exit/terminal states shown separately, not as funnel steps).
export const FUNNEL_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "APPLICATION",
  "REGISTERED",
  "VERIFIED",
  "PRODUCTS_UPLOADED",
  "ACTIVE",
  "FIRST_ORDER",
];

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS_UZ: Record<Priority, string> = {
  HIGH: "Yuqori",
  MEDIUM: "O'rta",
  LOW: "Past",
};

export const OBJECTION_TYPES = [
  "COMMISSION",
  "LOGISTICS",
  "TRUST",
  "TRAFFIC",
  "ALREADY_USING_MARKETPLACE",
  "NO_TIME",
  "OTHER",
] as const;
export type ObjectionType = (typeof OBJECTION_TYPES)[number];
export const OBJECTION_LABELS_UZ: Record<ObjectionType, string> = {
  COMMISSION: "Komissiya yuqori",
  LOGISTICS: "Logistika muammosi",
  TRUST: "Ishonch yo'q",
  TRAFFIC: "Trafik/sotuv kam",
  ALREADY_USING_MARKETPLACE: "Boshqa marketpleys ishlatadi",
  NO_TIME: "Vaqt yo'q",
  OTHER: "Boshqa",
};

export const SELLS_ON_OPTIONS = ["wb", "uzum", "instagram", "telegram", "offline", "other"] as const;
export type SellsOnOption = (typeof SELLS_ON_OPTIONS)[number];
export const SELLS_ON_LABELS_UZ: Record<SellsOnOption, string> = {
  wb: "Wildberries",
  uzum: "Uzum Market",
  instagram: "Instagram",
  telegram: "Telegram",
  offline: "Offline",
  other: "Boshqa",
};

export const FULFILLMENT_MODELS = ["zento_fbo", "seller_fbs", "hybrid", "unknown"] as const;
export type FulfillmentModel = (typeof FULFILLMENT_MODELS)[number];
export const FULFILLMENT_MODEL_LABELS_UZ: Record<FulfillmentModel, string> = {
  zento_fbo: "ZENTO FBO (bizning ombor)",
  seller_fbs: "Seller FBS (o'z ombori)",
  hybrid: "Aralash",
  unknown: "Noma'lum",
};

export type SellerSignal = "replied" | "application_sent" | "verified" | "retained";
export const SIGNAL_LABELS_UZ: Record<SellerSignal, string> = {
  replied: "Javob berdi",
  application_sent: "Ariza yuborildi",
  verified: "Tasdiqlandi",
  retained: "Ushlab qolindi",
};

export interface SellerLead {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  telegram: string | null;
  instagram: string | null;
  website: string | null;
  category_id: string | null;
  source_id: string | null;
  estimated_sku_count: number | null;
  estimated_monthly_sales: number | null;
  price_range: string | null;
  location: string | null;
  status: LeadStatus;
  priority: Priority;
  assigned_manager: string | null;
  converted_seller_id: string | null;
  first_order_id: string | null;
  first_order_at: string | null;
  first_order_value: number | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  escalate_to_founder: boolean;
  escalate_reason: string | null;
  escalated_at: string | null;
  escalated_by: string | null;
  sells_on: SellsOnOption[];
  has_warehouse: boolean | null;
  fulfillment_model: FulfillmentModel;
  replied_at: string | null;
  application_sent_at: string | null;
  verified_at: string | null;
  retained_at: string | null;
  lead_score: number;
}

export interface SellerHealth {
  lead_id: string;
  company_name: string;
  converted_seller_id: string;
  orders_90d: number;
  cancel_pct: number;
  late_pct: number;
  return_pct: number;
  avg_rating: number;
  review_count: number;
  health_score: number;
  health_level: "good" | "warning" | "critical";
}

export function healthBand(score: number): "good" | "warning" | "critical" {
  if (score >= 80) return "good";
  if (score >= 60) return "warning";
  return "critical";
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  avatar_url?: string | null;
}

export const CHANNEL_TYPES = ["website", "telegram", "instagram", "facebook", "manual"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];
export const CHANNEL_LABELS_UZ: Record<ChannelType, string> = {
  website: "Veb-sayt",
  telegram: "Telegram bot",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Qo'lda",
};
export const CHANNEL_DESCRIPTIONS_UZ: Record<ChannelType, string> = {
  website: "Sayt formasi orqali kelgan so'rovlarni avtomatik lead sifatida qabul qiladi.",
  telegram: "Telegram bot webhook orqali yozgan foydalanuvchilarni lead sifatida qabul qiladi.",
  instagram: "Instagram Direct orqali yozganlarni lead sifatida qabul qiladi (Meta webhook).",
  facebook: "Facebook Messenger orqali yozganlarni lead sifatida qabul qiladi (Meta webhook).",
  manual: "Faqat qo'lda kiritish uchun — webhook shart emas.",
};

export interface CrmChannel {
  id: string;
  organization_id: string;
  type: ChannelType;
  name: string;
  webhook_token: string;
  is_active: boolean;
  config: Record<string, unknown>;
  last_event_at: string | null;
  created_at: string;
}

export interface FunnelStageRow {
  status: string;
  count: number;
  pct_of_total: number;
}
export interface PipelineFunnel {
  total_leads: number;
  stages: FunnelStageRow[];
  from: string | null;
  to: string | null;
}

export const ACTIVITY_TYPE_LABELS_UZ: Record<string, string> = {
  status_change: "Status o'zgardi",
  note: "Izoh",
  call: "Qo'ng'iroq",
  sms: "SMS",
  followup: "Follow-up",
  objection: "E'tiroz",
  signal: "Signal",
  assignment: "Biriktirildi",
  escalation: "Founderga o'tkazildi",
};

export const TEAM_ROLES = ["founder", "admin", "seller_manager"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
export const TEAM_ROLE_LABELS_UZ: Record<TeamRole, string> = {
  founder: "Founder",
  admin: "Admin",
  seller_manager: "Sotuvchi menejeri",
};
export const TEAM_ROLE_DESCRIPTIONS_UZ: Record<TeamRole, string> = {
  founder: "To'liq huquq — barcha leadlar, hisobotlar va jamoa boshqaruvi.",
  admin: "To'liq huquq — barcha leadlar, hisobotlar va jamoa boshqaruvi.",
  seller_manager: "Faqat o'ziga biriktirilgan leadlarni ko'radi va boshqaradi.",
};
// Roles that crm-create-employee Edge Function is allowed to create.
export const CREATABLE_TEAM_ROLES: TeamRole[] = ["seller_manager", "admin"];

export interface TeamMember {
  id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  org_role: string;
}

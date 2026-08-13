// Grounded directly against the live Supabase schema (ilbyzbmridyxxblclpyf) —
// seller_leads / seller_lead_* tables, crm_* tables, tasks/task_* tables, and their check constraints.

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

export const SELLER_TIERS = ["A", "B", "C"] as const;
export type SellerTier = (typeof SELLER_TIERS)[number];
export const SELLER_TIER_LABELS_UZ: Record<SellerTier, string> = {
  A: "A — Strategik",
  B: "B — Yaxshi",
  C: "C — Oddiy",
};

export const OBJECTION_OUTCOMES = ["interested", "not_interested", "pending"] as const;
export type ObjectionOutcome = (typeof OBJECTION_OUTCOMES)[number];
export const OBJECTION_OUTCOME_LABELS_UZ: Record<ObjectionOutcome, string> = {
  interested: "Qiziqdi",
  not_interested: "Qiziqmadi",
  pending: "Hali noaniq",
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
  city: string | null;
  seller_tier: SellerTier | null;
  evidence_url: string | null;
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
  is_platform_owner?: boolean;
  // Faza 2 (WST): foydalanuvchi a'zo bo'lgan crm_organizations id'lari.
  // Buning yordamida faqat WST'ga a'zo (ZENTO'ga emas, platforma egasi ham
  // emas) akkauntlar uchun butunlay alohida, WST-only qobiq ko'rsatiladi.
  org_ids?: string[];
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

export const TEAM_ROLES = [
  "founder",
  "admin",
  "seller_manager",
  "ops_manager",
  "logistics_manager",
  "finance_manager",
  "ai_developer",
  "employee",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
export const TEAM_ROLE_LABELS_UZ: Record<TeamRole, string> = {
  founder: "Founder",
  admin: "Admin",
  seller_manager: "Sotuvchi menejeri",
  ops_manager: "Operatsion menejer",
  logistics_manager: "Logistika menejeri",
  finance_manager: "Moliya menejeri",
  ai_developer: "AI Developer",
  employee: "Xodim",
};
export const TEAM_ROLE_DESCRIPTIONS_UZ: Record<TeamRole, string> = {
  founder: "To'liq huquq — barcha leadlar, hisobotlar va jamoa boshqaruvi.",
  admin: "To'liq huquq — barcha leadlar, hisobotlar va jamoa boshqaruvi.",
  seller_manager: "Faqat o'ziga biriktirilgan leadlarni ko'radi va boshqaradi.",
  ops_manager: "O'z jamoasining vazifalari va KPI'sini ko'radi va boshqaradi.",
  logistics_manager: "Buyurtma/ombor/kuryer holatini ko'radi va boshqaradi.",
  finance_manager: "Moliya va to'lov ma'lumotlarini ko'radi va boshqaradi.",
  ai_developer: "AI agentlar va avtomatlashtirish ustida ishlaydi.",
  employee: "Faqat o'z vazifalarini ko'radi va bajaradi.",
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

// WST (Faza 2) — crm_organization_members.team_role qiymatlari. profiles.role
// bilan aralashtirmaslik kerak: WST akkauntlari profiles.role'da doim
// 'employee' bo'ladi, tashkilot ichidagi haqiqiy rol shu maydonda saqlanadi.
export const WST_TEAM_ROLES = [
  "owner",
  "sales_manager",
  "project_manager",
  "installer",
  "warehouse_manager",
  "supplier_manager",
  "service_staff",
  "operator",
  "hr",
  "marketplace_manager",
  "accountant",
] as const;
export type WstTeamRole = (typeof WST_TEAM_ROLES)[number];
export const WST_TEAM_ROLE_LABELS_UZ: Record<WstTeamRole, string> = {
  owner: "Rahbar (owner)",
  sales_manager: "Sotuv menejeri",
  project_manager: "Loyiha menejeri",
  installer: "Montajchi",
  warehouse_manager: "Ombor menejeri",
  supplier_manager: "Ta'minot menejeri",
  service_staff: "Xizmat ko'rsatish xodimi",
  operator: "Operator",
  hr: "HR",
  marketplace_manager: "Marketpleys menejeri",
  accountant: "Buxgalter",
};

export interface WstTeamMember {
  id: string;
  full_name: string | null;
  phone: string | null;
  org_role: string;
  team_role: string | null;
}

// ============================================================
// TASK SYSTEM (ZENTO Command Center — Phase 0/1)
// ============================================================

export const TASK_PRIORITIES = ["critical", "high", "normal", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_PRIORITY_LABELS_UZ: Record<TaskPriority, string> = {
  critical: "🔴 Critical",
  high: "🟠 High",
  normal: "🟢 Normal",
  low: "⚪ Low",
};
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/20",
  high: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  normal: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  low: "bg-white/10 text-ink-300 border border-white/10",
};

export interface TaskBoard {
  id: string;
  name: string;
  module: string;
  created_by: string | null;
  created_at: string;
}

export interface TaskStatus {
  id: string;
  board_id: string;
  name: string;
  position: number;
  is_terminal: boolean;
  requires_verification: boolean;
}

export interface Task {
  id: string;
  board_id: string;
  status_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  created_by: string | null;
  priority: TaskPriority;
  category: string | null;
  related_seller_lead_id: string | null;
  related_order_id: string | null;
  expected_result: string | null;
  deadline_at: string | null;
  started_at: string | null;
  done_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  kpi_key: string | null;
  created_at: string;
  updated_at: string;
  owner?: { full_name: string | null } | null;
  status?: { name: string; is_terminal: boolean; requires_verification: boolean } | null;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  label: string;
  is_done: boolean;
  done_at: string | null;
  position: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author?: { full_name: string | null } | null;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// EMPLOYEE / KPI
// ============================================================

export interface EmployeeProfile {
  id: string;
  role_title: string | null;
  department: string | null;
  hired_at: string | null;
  manager_id: string | null;
}

export interface KpiDefinition {
  id: string;
  key: string;
  label: string;
  level: 1 | 2 | 3;
  unit: "count" | "percent" | "currency";
  module: string | null;
}

export interface KpiActual {
  id: string;
  employee_id: string;
  kpi_key: string;
  period: string;
  actual_value: number;
  computed_at: string;
}

export interface EmployeeListRow {
  id: string;
  full_name: string | null;
  role: string;
  role_title: string | null;
  department: string | null;
  hired_at: string | null;
  manager_id: string | null;
  manager_name: string | null;
  has_profile: boolean;
}

export interface KpiActualRow {
  kpi_key: string;
  period: string;
  actual_value: number;
  label: string;
  level: 1 | 2 | 3;
  unit: "count" | "percent" | "currency";
}

export interface KpiTargetRow {
  kpi_key: string;
  period: string;
  target_value: number;
  label: string;
  level: 1 | 2 | 3;
  unit: "count" | "percent" | "currency";
}

export interface EodReportRow {
  report_date: string;
  tasks_planned: number;
  tasks_completed: number;
  summary: string | null;
  tomorrow_followups: string | null;
  submitted_at: string;
}

export interface EmployeeDetail {
  profile: { id: string; full_name: string | null; role: string; phone: string | null };
  employee_profile: { role_title: string | null; department: string | null; hired_at: string | null; manager_id: string | null; manager_name: string | null } | null;
  kpi_actuals: KpiActualRow[];
  kpi_targets: KpiTargetRow[];
  recent_eod_reports: EodReportRow[];
  task_stats: { open: number; overdue: number; verified_total: number };
}

export function kpiUnitFormat(value: number, unit: "count" | "percent" | "currency") {
  if (unit === "percent") return `${value}%`;
  if (unit === "currency") return `${new Intl.NumberFormat("uz-UZ").format(Math.round(value))} so'm`;
  return new Intl.NumberFormat("uz-UZ").format(Math.round(value));
}

// ============================================================
// AUTOMATION ENGINE (ZENTO Command Center — Phase 3)
// ============================================================

export const AUTOMATION_TRIGGER_TABLES = ["tasks", "seller_leads"] as const;
export type AutomationTriggerTable = (typeof AUTOMATION_TRIGGER_TABLES)[number];

export const AUTOMATION_TRIGGER_EVENTS = ["INSERT", "UPDATE"] as const;
export type AutomationTriggerEvent = (typeof AUTOMATION_TRIGGER_EVENTS)[number];

export const AUTOMATION_CONDITION_OPS = ["eq", "neq", "is_null", "is_not_null", "gt", "lt", "gte", "lte", "changed_to"] as const;
export type AutomationConditionOp = (typeof AUTOMATION_CONDITION_OPS)[number];

export const AUTOMATION_CONDITION_OP_LABELS_UZ: Record<AutomationConditionOp, string> = {
  eq: "= (teng)",
  neq: "!= (teng emas)",
  is_null: "bo'sh",
  is_not_null: "bo'sh emas",
  gt: "> (katta)",
  lt: "< (kichik)",
  gte: ">= (katta yoki teng)",
  lte: "<= (kichik yoki teng)",
  changed_to: "shu qiymatga o'zgardi",
};

export interface AutomationCondition {
  field: string;
  op: AutomationConditionOp;
  value?: string;
}

export const AUTOMATION_ACTION_TYPES = ["send_notification", "create_task"] as const;
export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export interface AutomationAction {
  id: string;
  position: number;
  action_type: AutomationActionType;
  action_config: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  is_active: boolean;
  trigger_table: string;
  trigger_event: string;
  trigger_condition: AutomationCondition[];
  created_at: string;
  actions: AutomationAction[];
  last_run: { status: "success" | "failed"; triggered_at: string; error: string | null } | null;
  run_count: number;
}

export interface AutomationRun {
  id: string;
  rule_id: string;
  rule_name: string;
  triggered_by_row_id: string | null;
  triggered_at: string;
  status: "success" | "failed";
  error: string | null;
}

// ============================================================
// ORDERS / LOGISTICS / FINANCE (ZENTO Command Center — Phase 4)
// ============================================================

export interface OrderException {
  source: string;
  order_id: string;
  seller_id: string | null;
  title: string;
  detail: string;
  severity: "warning" | "critical";
  since: string;
}

export interface LogisticsEmployeeRow {
  employee_id: string;
  full_name: string | null;
  received_count?: number;
  qc_count?: number;
  qc_fail_count?: number;
  packed_count?: number;
  delivered_count?: number;
}

export interface LogisticsDashboard {
  by_receiver: LogisticsEmployeeRow[];
  by_qc: LogisticsEmployeeRow[];
  by_packer: LogisticsEmployeeRow[];
  by_courier: LogisticsEmployeeRow[];
  stage_counts: Record<string, number>;
}

export interface FinanceOverview {
  period_from: string;
  period_to: string;
  gmv: number;
  seller_commission: number;
  delivery_cost: number;
  return_impact: number;
  estimated_contribution: number;
  not_tracked: string[];
  note: string;
}

export const ORDER_EXCEPTION_SOURCE_LABELS_UZ: Record<string, string> = {
  fulfillment_stuck_qc: "QC navbatida qolib ketdi",
  qc_failed: "QC muvaffaqiyatsiz",
  dropoff_overdue: "Topshirish muddati o'tdi",
  courier_pickup_overdue: "Kuryer olib ketmadi",
  return_pending: "Qaytarish kutmoqda",
  penalty_appealed: "Jarima apellyatsiyasi",
};

// ============================================================
// NOTIFICATION CENTER + UNIFIED ACTIVITY LOG (ZENTO Command Center — Phase 5)
// ============================================================

export interface NotificationRow {
  id: string;
  title: string | null;
  message: string | null;
  body: string | null;
  type: string | null;
  category: string | null;
  severity: "info" | "warning" | "critical" | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export const NOTIFICATION_SEVERITY_LABELS_UZ: Record<string, string> = {
  info: "Ma'lumot",
  warning: "Ogohlantirish",
  critical: "Kritik",
};

export const NOTIFICATION_SEVERITY_COLORS: Record<string, string> = {
  info: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  critical: "border-red-500/20 bg-red-500/10 text-red-400",
};

export interface NotificationRoutingRule {
  id: string;
  category: string | null;
  min_severity: string | null;
  target_role: string | null;
  channel: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  source: "audit" | "crm_lead" | "crm_deal" | "task" | string;
  actor_id: string | null;
  actor_name: string | null;
  action: string | null;
  entity: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export const ACTIVITY_SOURCE_LABELS_UZ: Record<string, string> = {
  audit: "Tizim (audit)",
  crm_lead: "CRM — Lead",
  crm_deal: "CRM — Deal",
  task: "Vazifa",
};

// ============================================================
// PERMISSION MATRIX (ZENTO Business OS — Faza 1, Qadam 1.2)
// LEVEL 2 (module access) + LEVEL 3 (record scope), org_module_permissions'ga mos.
// ============================================================

export const PERMISSION_MODULES = [
  "dashboard",
  "tasks",
  "crm",
  "employees",
  "automation",
  "orders",
  "finance",
  "ask_ai",
  "notifications",
  "activity_log",
  "ai_agents",
  "integrations",
  "team_management",
] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_MODULE_LABELS_UZ: Record<PermissionModule, string> = {
  dashboard: "CEO Dashboard",
  tasks: "Vazifalar",
  crm: "CRM (Leadlar/Pipeline)",
  employees: "Xodimlar & KPI",
  automation: "Avtomatlashtirish",
  orders: "Buyurtmalar",
  finance: "Moliya",
  ask_ai: "Ask ZENTO",
  notifications: "Bildirishnomalar",
  activity_log: "Faoliyat jurnali",
  ai_agents: "AI Agentlar",
  integrations: "Integratsiyalar",
  team_management: "Jamoa boshqaruvi",
};

export const PERMISSION_ACCESS_LEVELS = ["none", "read", "write"] as const;
export type PermissionAccess = (typeof PERMISSION_ACCESS_LEVELS)[number];
export const PERMISSION_ACCESS_LABELS_UZ: Record<PermissionAccess, string> = {
  none: "Yo'q",
  read: "O'qish",
  write: "To'liq",
};

export const PERMISSION_SCOPES = ["self", "team", "all"] as const;
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];
export const PERMISSION_SCOPE_LABELS_UZ: Record<PermissionScope, string> = {
  self: "Faqat o'zi",
  team: "Jamoasi",
  all: "Hammasi",
};

export interface OrgModulePermission {
  id: string;
  organization_id: string;
  role: TeamRole | string;
  module: PermissionModule | string;
  access: PermissionAccess | string;
  scope: PermissionScope | string;
  updated_at: string;
  updated_by: string | null;
}

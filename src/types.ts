export type Stage =
  "briefing" | "quotes" | "compare" | "proposal" | "approval" | "handoff";
export type Field = {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "textarea";
  required: boolean;
};
export type Template = {
  id: string;
  name: string;
  version: number;
  fields: Field[];
};
export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
export type Client = {
  id: string;
  name: string;
  contact: string;
  email: string;
  nucleus: string;
};
export type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  city: string;
};
export type Line = {
  id: string;
  category: string;
  description: string;
  qty: number;
  unit: number;
  direct: boolean;
  supplier?: string;
  optional?: boolean;
  sourceQuote?: string;
  sourceRevision?: number;
  sourceSelection?: string;
};
export type QuoteOption = {
  id: string;
  name: string;
  detail: string;
  lines: Line[];
};
export type QuoteRevision = {
  number: number;
  at: string;
  options: QuoteOption[];
  fields: Record<string, string>;
  terms: string;
  attachment: string;
};
export type QuoteSelection = {
  id: string;
  revision: number;
  optionId: string;
  lineIds: string[];
  at: string;
  confirmedAt?: string;
};
export type QuoteMessage = {
  id: string;
  author: "adviser" | "supplier";
  kind: "message" | "adjustment" | "selection" | "confirmation" | "revision";
  text: string;
  at: string;
  revision: number;
};
export type Quote = {
  id: string;
  supplierId: string;
  template: Template;
  status: "draft" | "requested" | "received";
  deadline: string;
  fields: Record<string, string>;
  lines: Line[];
  terms: string;
  attachment: string;
  selected: boolean;
  sentAt?: string;
  receivedAt?: string;
  options?: QuoteOption[];
  revision?: number;
  revisions?: QuoteRevision[];
  messages?: QuoteMessage[];
  selection?: QuoteSelection;
  adjustmentPending?: boolean;
};
export type Version = {
  id: string;
  number: number;
  at: string;
  lines: Line[];
  fee: number;
  tax: number;
  total: number;
  terms: string;
  title: string;
  client: string;
  date: string;
  guests: number;
  location: string;
};
export type Demand = {
  id: string;
  title: string;
  clientId: string;
  owner: string;
  stage: Stage;
  source: string;
  message: string;
  date: string;
  guests: number;
  budget: number;
  location: string;
  objective: string;
  questions: string;
  briefingValid: boolean;
  briefingLog: string[];
  creative: string;
  attachments?: BriefingAttachment[];
  conversation?: ClientMessage[];
  clientDraft?: string;
  clientResponseDue?: string;
  presentations?: Presentation[];
  quotes: Quote[];
  lines: Line[];
  fee: number;
  tax: number;
  terms: string;
  versions: Version[];
  sentVersion?: string;
  decision: "pending" | "changes" | "accepted" | "declined";
  evidence: string;
  acceptedVersion?: string;
  handoff: boolean;
  history: { at: string; text: string }[];
  createdAt?: string;
  updatedAt?: string;
  stageEnteredAt?: string;
  dueAt?: string;
  briefingDetails?: Record<string, string>;
  scope?: Record<
    string,
    { included: boolean; answers: Record<string, string> }
  >;
};
export type AppState = {
  schema: 1;
  demands: Demand[];
  clients: Client[];
  suppliers: Supplier[];
  templates: Template[];
  users: Person[];
  aiMode: "available" | "offline";
  provider: string;
  readAlerts?: string[];
  managementDemo?: boolean;
  alertRules?: { idleDays: number; dueDays: number };
};
export type AIResult = {
  title: string;
  date: string;
  guests: number;
  budget: number;
  location: string;
  objective: string;
  questions: string[];
  evidence: string[];
  suggestions?: BriefingSuggestion[];
};
export type BriefingAttachment = {
  id: string;
  name: string;
  size: number;
  kind: "pdf" | "docx" | "xlsx";
  text: string;
  included: boolean;
  at: string;
  messageId?: string;
  status: "ready" | "manual";
  detail: string;
};
export type ClientMessage = {
  id: string;
  direction: "in" | "out";
  text: string;
  at: string;
  contact: string;
  channel: string;
  reviewedAt?: string;
};
export type BriefingSuggestion = {
  path: string;
  label: string;
  value: string | number;
  source: string;
  excerpt: string;
};
export type Presentation = {
  id: string;
  number: number;
  title: string;
  concept: string;
  changes: string;
  source: "demo" | "link" | "file";
  url?: string;
  fileName?: string;
  fileType?: string;
  at: string;
  status: "draft" | "sent" | "changes" | "approved";
  sentAt?: string;
  feedback?: string;
  feedbackBy?: string;
  feedbackAt?: string;
};

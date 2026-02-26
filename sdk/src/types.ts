// ─── Batch metadata ───────────────────────────────────────────────────────────────────

export interface AnalyzeMeta {
  batch_id: string;
  processed_at: string;
  total_images: number;
}

// ─── Summary ────────────────────────────────────────────────────────────────────────

export interface CombinedTotal {
  amount: number;
  currency: string;
}

export interface AnalyzeSummary {
  total_tickets: number;
  /** Present only when all tickets share the same currency. Absent means mixed currencies. */
  combined_total?: CombinedTotal;
  vehicles_detected: number;
  vehicle_types: Record<string, number>;
}

// ─── Ticket ──────────────────────────────────────────────────────────────────────────

export interface Merchant {
  name: string;
  address?: string;
  vat_number?: string;
}

export interface TicketInfo {
  date?: string;
  time?: string;
  currency?: string;
  currency_inferred?: boolean;
}

export interface LineItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  confidence?: number;
}

export interface TaxLine {
  name: string;
  rate: number;
  base: number;
  amount: number;
}

export interface Totals {
  subtotal: number;
  tax: number;
  tax_lines?: TaxLine[];
  total: number;
}

export interface TicketData {
  merchant: Merchant;
  ticket: TicketInfo;
  items: LineItem[];
  totals: Totals;
  raw_text?: string;
  warnings: string[];
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────────────

export interface Vehicle {
  license_plate: string | null;
  plate_visible: boolean;
  plate_unreadable_reason: 'occluded' | 'blurry' | 'angle' | 'damaged' | 'not_present' | null;
  country: string | null;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'bus' | 'van' | 'other' | null;
  brand: string | null;
  model: string | null;
  color: string | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VehicleDetection {
  bounding_box?: BoundingBox;
}

export interface VehicleData {
  vehicle: Vehicle;
  detection?: VehicleDetection;
  raw_text?: string;
  warnings: string[];
}

// ─── Discriminated union ────────────────────────────────────────────────────────

export interface TicketImageResult {
  image_id: string;
  type: 'ticket';
  confidence: number | null;
  data: TicketData;
}

export interface VehicleImageResult {
  image_id: string;
  type: 'vehicle';
  confidence: number | null;
  data: VehicleData;
}

export interface UnknownImageResult {
  image_id: string;
  type: string;
  confidence: number | null;
  data: Record<string, unknown>;
}

export type ImageResult = TicketImageResult | VehicleImageResult | UnknownImageResult;

// ─── Type guards ───────────────────────────────────────────────────────────────────

export function isTicketResult(r: ImageResult): r is TicketImageResult {
  return r.type === 'ticket';
}

export function isVehicleResult(r: ImageResult): r is VehicleImageResult {
  return r.type === 'vehicle';
}

// ─── Root response ────────────────────────────────────────────────────────────

export interface AnalyzeResponse {
  meta: AnalyzeMeta;
  results: ImageResult[];
  summary: AnalyzeSummary;
}

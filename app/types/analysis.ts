/**
 * analysis.ts
 *
 * Domain types for the Vision AI analysis API response.
 *
 * The endpoint returns a batch response that may contain heterogeneous
 * image results (ticket, vehicle, …). Each result is a discriminated union
 * keyed on `type`, so exhaustive type-narrowing with switch/if is safe and
 * future result types can be added here without touching existing code.
 *
 * Usage:
 *   import type { AnalysisResponse, ImageResult, TicketImageResult } from '~/types/analysis'
 *   import { isTicketResult, isVehicleResult } from '~/types/analysis'
 */

// ─── Batch metadata ──────────────────────────────────────────────────────────

export interface AnalysisMeta {
  /** Unique identifier for this processing batch. */
  batch_id: string
  /** ISO-8601 timestamp of when the batch was processed. */
  processed_at: string
  /** Number of images that were included in the batch. */
  total_images: number
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface CombinedTotal {
  amount: number
  currency: string
}

export interface AnalysisSummary {
  total_tickets: number
  /** Present only when all tickets share the same currency. Absent means mixed currencies. */
  combined_total?: CombinedTotal
  vehicles_detected: number
  /** Map of vehicle type → count, e.g. { car: 2, truck: 1 } */
  vehicle_types: Record<string, number>
}

// ─── Ticket result ────────────────────────────────────────────────────────────

export interface Merchant {
  name: string
  address?: string
  vat_number?: string
}

export interface TicketInfo {
  date?: string
  time?: string
  currency?: string
  currency_inferred?: boolean
}

export interface LineItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
  category?: string
  confidence?: number
}

export interface TaxLine {
  name: string
  rate: number
  base: number
  amount: number
}

export interface Totals {
  subtotal: number
  tax: number
  tax_lines?: TaxLine[]
  total: number
}

export interface TicketData {
  merchant: Merchant
  ticket: TicketInfo
  items: LineItem[]
  totals: Totals
  raw_text?: string
  warnings: string[]
}

// ─── Vehicle result ───────────────────────────────────────────────────────────

export interface Vehicle {
  license_plate: string | null
  plate_visible: boolean
  plate_unreadable_reason: 'occluded' | 'blurry' | 'angle' | 'damaged' | 'not_present' | null
  country: string | null
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'bus' | 'van' | 'other' | null
  brand: string | null
  model: string | null
  color: string | null
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface VehicleDetection {
  bounding_box?: BoundingBox
}

export interface VehicleData {
  vehicle: Vehicle
  detection?: VehicleDetection
  raw_text?: string
  warnings: string[]
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export interface TicketImageResult {
  image_id: string
  type: 'ticket'
  confidence: number
  data: TicketData
}

export interface VehicleImageResult {
  image_id: string
  type: 'vehicle'
  confidence: number
  data: VehicleData
}

/**
 * Fallback for any result type not yet modelled above.
 * Keeps the union extensible without breaking existing narrowing.
 */
export interface UnknownImageResult {
  image_id: string
  type: string
  confidence: number
  data: Record<string, unknown>
}

/** Discriminated union of all known (and unknown) image result types. */
export type ImageResult = TicketImageResult | VehicleImageResult | UnknownImageResult

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isTicketResult(r: ImageResult): r is TicketImageResult {
  return r.type === 'ticket'
}

export function isVehicleResult(r: ImageResult): r is VehicleImageResult {
  return r.type === 'vehicle'
}

// ─── Root response ────────────────────────────────────────────────────────────

export interface AnalysisResponse {
  meta: AnalysisMeta
  results: ImageResult[]
  summary: AnalysisSummary
}

# AI Vision Agent

A web application that uses AI to extract structured data from images — receipts/tickets and vehicle photos. Upload images manually or use the live camera detection mode to scan vehicles in real time.

---

## Overview

```
┌─────────────────────────────────────────────────────┐
│                  Nuxt 4 Frontend                    │
│                                                     │
│  ┌─────────────┐        ┌────────────────────────┐  │
│  │  Upload tab │        │  Live Detection tab    │  │
│  │             │        │                        │  │
│  │ ImageUpload │        │   LiveDetector.vue     │  │
│  │    er.vue   │        │  (camera loop)         │  │
│  └──────┬──────┘        └───────────┬────────────┘  │
│         │                           │               │
│         └──────────┬────────────────┘               │
│                    ▼                                │
│           useAnalyze composable                     │
│      (@studiogenesis/vision-agent-sdk)              │
└──────────────────────┬──────────────────────────────┘
                       │  POST /analyze
                       ▼
                  Backend API  ──▶  AI model
                       │
                       ▼
           Structured JSON response
```

| Directory | Description |
|---|---|
| `app/` | Nuxt 4 frontend (Vue 3, Tailwind CSS v4) |
| `sdk/` | `@studiogenesis/vision-agent-sdk` — standalone npm package that wraps the backend API |

---

## Features

### Upload tab
- **Three upload modes** — drag & drop files, live camera snapshot, or URL
- **Multi-image support** — up to 3 images per analysis batch
- **Duplicate detection** — same filename won't be added twice
- **Rotating loading phrases** while the AI model processes

### Live Detection tab
- **Continuous camera loop** — captures a JPEG frame every 750 ms and sends it to `/analyze`
- **In-flight guard** — only one request in-flight at a time; skips frames while analyzing
- **Auto-cooldown** — 4 s pause after each positive detection, then scanning resumes automatically
- **Thumbnail capture** — the exact frame that was sent to the API is stored as a 240 px JPEG thumbnail (captured before the API call, so the image always matches the result)
- **Detection history table** — ID, thumbnail, plate, brand, model, color, type, confidence bar, view/delete actions; newest entry on top
- **Detail modal** — clicking the eye icon on any row opens the full `ResultViewer` card for that detection
- **Canvas overlay** — dashed bounding-box guide drawn over the live feed; turns green on detection
- **Status badge** — Idle / Scanning / Analyzing / Detected with colour coding

### Results
- **Ticket parsing** — merchant name, VAT number, line items with categories, tax breakdown, totals, inferred-currency flag
- **Vehicle parsing** — license plate, country, make / model / color, vehicle type, bounding box
- **Mixed-currency handling** — when tickets in a batch use different currencies the total is not summed; an amber warning is shown instead
- **Collapsible result sections** — Tickets (amber), Vehicles (sky), Others (zinc)
- **Raw JSON toggle** — expand the full API response at the bottom of results
- **Responsive UI** — works on mobile and desktop

---

## Requirements

- Node.js 18+
- A running backend that exposes `POST /analyze` (see [Backend API](#backend-api))
- Firebase CLI (only for deployment)

---

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd vision-artifical

# 2. Install dependencies (also runs nuxt prepare via postinstall)
npm install

# 3. Create an environment file
cp .env.example .env   # or create .env manually
```

`.env` file:

```env
# Required — URL of your backend API
BACKEND_URL=https://your-backend.example.com

# Optional — sent as Bearer token if your backend requires auth
SDK_API_KEY=your_secret_key
```

---

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Building for production

```bash
npm run build
```

Output goes to `.output/`. Static assets served by Firebase Hosting are in `.output/public/`.

---

## Deployment

The app is configured for **Firebase Hosting** (static frontend — the backend is deployed separately).

```bash
npm run build
firebase deploy
```

Make sure your Firebase project is initialised (`firebase login`, `firebase use <project-id>`).

---

## Backend API

The SDK calls `POST {BACKEND_URL}/analyze` with a `multipart/form-data` body.

| Field | Type | Description |
|---|---|---|
| `images` | `File` (repeated) | One or more image files (JPEG, PNG, WEBP) |

**Authorization** (when `SDK_API_KEY` is set):

```
Authorization: Bearer <SDK_API_KEY>
```

**Response** (`200 OK`, `application/json`):

```jsonc
{
  "meta": {
    "batch_id": "abc123",
    "processed_at": "2026-02-26T12:00:00Z",
    "total_images": 2
  },
  "summary": {
    "total_tickets": 1,
    "vehicles_detected": 1,
    "vehicle_types": { "car": 1 },
    // combined_total is ONLY present when all tickets share the same currency.
    // Omit this field when tickets have mixed currencies.
    "combined_total": { "amount": 42.50, "currency": "EUR" }
  },
  "results": [
    {
      "image_id": "img_001",
      "type": "vehicle",        // "ticket" | "vehicle" | "unknown"
      "confidence": 0.95,       // float 0–1, or null
      "data": { /* see types below */ }
    }
  ]
}
```

**Error response:**

```jsonc
{ "error": "Human-readable error message" }
```

---

## Data types

### Ticket (`type: "ticket"`)

```typescript
interface TicketData {
  merchant: {
    name: string;
    address?: string;
    vat_number?: string;
  };
  ticket: {
    date?: string;
    time?: string;
    currency?: string;
    currency_inferred?: boolean;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category?: string;
    confidence?: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    tax_lines?: Array<{ name: string; rate: number; base: number; amount: number }>;
    total: number;
  };
  raw_text?: string;
  warnings: string[];
}
```

### Vehicle (`type: "vehicle"`)

```typescript
interface VehicleData {
  vehicle: {
    license_plate: string | null;
    plate_visible: boolean;
    plate_unreadable_reason: 'occluded' | 'blurry' | 'angle' | 'damaged' | 'not_present' | null;
    country: string | null;
    vehicle_type: 'car' | 'truck' | 'motorcycle' | 'bus' | 'van' | 'other' | null;
    brand: string | null;
    model: string | null;
    color: string | null;
  };
  detection?: {
    bounding_box?: { x: number; y: number; width: number; height: number }; // normalised 0–1
  };
  raw_text?: string;
  warnings: string[];
}
```

---

## Composables

### `useAnalyze`

Wraps the SDK. Exposes reactive state for a single analysis call.

```typescript
const { analyze, result, loading, error, reset } = useAnalyze()

await analyze([file1, file2])
// result.value → AnalysisResponse | null
// loading.value → boolean
// error.value   → string | null
```

### `useCamera`

Manages `MediaDevices`, camera lifecycle, zoom, torch, and frame capture.

```typescript
const {
  startCamera,   // (videoEl, canvasEl?) → Promise<void>
  stopCamera,
  captureFrame,  // (videoEl, canvasEl, quality?) → Promise<File>
  toggleFacingMode,
  cameraActive,
  cameraError,
} = useCamera()
```

### `useLiveDetection`

Drives the continuous capture → analyze loop for the Live Detection tab.

```typescript
const {
  isRunning, status, history, confidence,
  analyzing, error, cameraError, cameraActive,
  startLive, stopLive, clearHistory, removeEntry,
} = useLiveDetection(videoEl, canvasEl)
```

| Export | Type | Description |
|---|---|---|
| `isRunning` | `Ref<boolean>` | Whether the detection loop is active |
| `status` | `Ref<LiveStatus>` | `'idle' \| 'scanning' \| 'analyzing' \| 'detected'` |
| `history` | `Ref<HistoryEntry[]>` | Detection history, newest first |
| `confidence` | `Ref<number \| null>` | Confidence of the last positive detection |
| `startLive()` | function | Start camera + detection loop |
| `stopLive()` | function | Stop loop and release camera |
| `clearHistory()` | function | Clear all entries and reset counter |
| `removeEntry(id)` | function | Remove a single entry by ID |

#### `HistoryEntry`

```typescript
interface HistoryEntry {
  id: string          // Sequential display ID: 'V001', 'V002'…
  result: AnalysisResponse
  thumbnail: string   // 240 px-wide JPEG base64 data URL.
                      // Captured from the video frame BEFORE the API call,
                      // so it always matches the analyzed image exactly.
}
```

**Detection logic:**
- A result is a positive hit when `type !== 'unknown'` AND `confidence >= 0.5`
- After a hit: 4 s cooldown, then scanning resumes automatically
- Loop interval: 750 ms; concurrent requests are blocked by an in-flight guard

---

## SDK (`@studiogenesis/vision-agent-sdk`)

Located in `sdk/`. A zero-dependency TypeScript package.

### Build

```bash
cd sdk
npm run build   # produces dist/ (ESM + CJS + .d.ts)
```

> Rebuild after any change to `sdk/src/` before testing in the app or publishing.

### Install in another project

```bash
npm install /path/to/sdk                        # local path
npm install @studiogenesis/vision-agent-sdk     # after publishing
```

### Usage

```typescript
import { VisionAgentSDK } from '@studiogenesis/vision-agent-sdk'
import { isTicketResult, isVehicleResult } from '@studiogenesis/vision-agent-sdk'
import type { AnalyzeResponse } from '@studiogenesis/vision-agent-sdk'

const sdk = new VisionAgentSDK({
  apiKey: 'your_key',
  baseUrl: 'https://your-backend.example.com',
})

const result: AnalyzeResponse = await sdk.analyzeImages([file1, file2])

for (const r of result.results) {
  if (isVehicleResult(r)) console.log(r.data.vehicle.license_plate)
  if (isTicketResult(r))  console.log(r.data.totals.total)
}
```

Full type reference: [`sdk/src/types.ts`](sdk/src/types.ts)

---

## Project structure

```
vision-artifical/
├── app/
│   ├── components/
│   │   ├── ImageUploader.vue     # Upload UI (drag-drop / camera snapshot / URL)
│   │   ├── LiveDetector.vue      # Live camera detection UI + results table + detail modal
│   │   └── ResultViewer.vue      # Renders structured results (tickets, vehicles, unknowns)
│   ├── composables/
│   │   ├── useAnalyze.ts         # SDK wrapper — reactive analyze() call
│   │   ├── useCamera.ts          # MediaDevices, stream, zoom, torch, captureFrame()
│   │   ├── useFirebase.ts        # Firebase helpers
│   │   └── useLiveDetection.ts   # Continuous capture → analyze loop + detection history
│   ├── pages/
│   │   └── index.vue             # Main page — Upload / Live Detection tab switcher
│   ├── plugins/
│   │   └── firebase.client.ts
│   ├── types/
│   │   └── analysis.ts           # App-side domain types + isVehicleResult / isTicketResult
│   ├── assets/css/main.css
│   └── app.vue
├── sdk/
│   ├── src/
│   │   ├── client.ts             # VisionAgentSDK class
│   │   ├── types.ts              # Full domain type definitions
│   │   └── index.ts              # Package entry point
│   ├── dist/                     # Built output (ESM + CJS + .d.ts)
│   └── package.json
├── nuxt.config.ts
├── firebase.json
└── package.json
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | Base URL of the AI backend (`POST /analyze`) |
| `SDK_API_KEY` | No | Bearer token sent with every request |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3, `<script setup>`) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| SDK bundler | [tsup](https://tsup.egoist.dev) |
| Hosting | Firebase Hosting |
| Language | TypeScript |

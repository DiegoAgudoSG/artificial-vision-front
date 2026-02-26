# AI Vision Agent

A web application that uses AI to extract structured data from images — receipts/tickets and vehicle photos. Upload one or several images and receive a fully parsed JSON result with line items, totals, merchant info, plate numbers, and more.

---

## Overview

```
User uploads images
       │
       ▼
  Nuxt 4 frontend  ──(vision-agent-sdk)──▶  Backend API  ──▶  AI model
       │
       ▼
  Structured results displayed (tickets / vehicles / unknown)
```

The project has two parts:

| Directory | Description |
|---|---|
| `app/` | Nuxt 4 frontend (Vue 3, Tailwind CSS v4) |
| `sdk/` | `vision-agent-sdk` — standalone npm package used by the frontend to talk to the backend |

---

## Features

- **Three upload modes** — drag & drop files, live camera capture, or URL
- **Multi-image support** — up to 3 images per analysis
- **Duplicate detection** — same filename won't be added twice
- **Ticket parsing** — merchant name, VAT number, line items with categories, tax breakdown, totals, inferred currency
- **Vehicle parsing** — license plate, country, make/model/color, vehicle type, bounding box
- **Collapsible result sections** — tickets (amber), vehicles (sky), unknowns (zinc)
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

# 2. Install dependencies (also builds the SDK via postinstall)
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

Output goes to `.output/`. The static assets served by Firebase Hosting are in `.output/public/`.

---

## Deployment

The app is configured for **Firebase Hosting** (static frontend only — the backend is deployed separately).

```bash
# Build first
npm run build

# Deploy to Firebase
firebase deploy
```

Make sure your Firebase project is initialised (`firebase login`, `firebase use <project-id>`).

---

## Backend API

The SDK calls `POST {BACKEND_URL}/analyze` with a `multipart/form-data` body:

| Field | Type | Description |
|---|---|---|
| `images` | `File` (repeated) | One or more image files (JPEG, PNG, WEBP) |

**Authorization** (if `SDK_API_KEY` is set):

```
Authorization: Bearer <SDK_API_KEY>
```

**Expected response** (`200 OK`, `application/json`):

```jsonc
{
  "meta": {
    "batch_id": "abc123",
    "processed_at": "2026-02-26T12:00:00Z",
    "total_images": 1
  },
  "summary": {
    "total_tickets": 1,
    "total_spent": 42.50,
    "vehicles_detected": 0,
    "vehicle_types": {}
  },
  "results": [
    {
      "type": "ticket",          // "ticket" | "vehicle" | "unknown"
      "confidence": 0.97,
      "data": { /* TicketData — see SDK types */ }
    }
  ]
}
```

**Error response:**

```jsonc
{ "error": "Human-readable error message" }
```

---

## SDK (`vision-agent-sdk`)

Located in `sdk/`. A zero-dependency TypeScript package that wraps the backend API call.

### Build

```bash
cd sdk
npm run build       # produces dist/ (ESM + CJS + .d.ts)
```

### Usage in any project

```bash
# Install from local path
npm install /path/to/sdk

# Or after publishing to npm
npm install @studiogenesis/vision-agent-sdk
```

```typescript
import { VisionAgentSDK } from '@studiogenesis/vision-agent-sdk'
import type { AnalyzeResponse } from '@studiogenesis/vision-agent-sdk'

const sdk = new VisionAgentSDK({
  apiKey: 'your_key',
  baseUrl: 'https://your-backend.example.com',
})

const result: AnalyzeResponse = await sdk.analyzeImages([file1, file2])
```

### Type exports

```typescript
// Type guards
import { isTicketResult, isVehicleResult } from '@studiogenesis/vision-agent-sdk'

for (const r of result.results) {
  if (isTicketResult(r)) {
    console.log(r.data.merchant.name, r.data.totals.total)
  }
  if (isVehicleResult(r)) {
    console.log(r.data.vehicle.license_plate)
  }
}
```

Full type reference: [`sdk/src/types.ts`](sdk/src/types.ts)

---

## Project structure

```
vision-artifical/
├── app/
│   ├── components/
│   │   ├── ImageUploader.vue     # Upload UI (file / camera / URL modes)
│   │   └── ResultViewer.vue      # Renders parsed tickets, vehicles, unknowns
│   ├── composables/
│   │   ├── useAnalyze.ts         # Calls VisionAgentSDK, exposes reactive state
│   │   └── useFirebase.ts        # Firebase helpers
│   ├── pages/
│   │   └── index.vue             # Main page — wires uploader + results
│   ├── types/
│   │   └── analysis.ts           # App-side domain types (mirrors SDK types)
│   ├── assets/css/main.css
│   └── app.vue
├── sdk/                          # vision-agent-sdk package
│   ├── src/
│   │   ├── client.ts             # VisionAgentSDK class
│   │   ├── types.ts              # Full domain type definitions
│   │   └── index.ts              # Package entry point
│   ├── dist/                     # Built output (committed or generated)
│   └── package.json
├── nuxt.config.ts
├── firebase.json
└── package.json
```

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | Base URL of the AI backend API |
| `SDK_API_KEY` | No | Bearer token sent with every request |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| SDK bundler | [tsup](https://tsup.egoist.dev) |
| Hosting | Firebase Hosting |
| Language | TypeScript |

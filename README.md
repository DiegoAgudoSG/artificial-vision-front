# AI Vision Agent

Extracción estructurada de datos desde imágenes mediante inteligencia artificial.

> Stack: **Nuxt 4 · Vue 3 · TypeScript · Firebase Hosting**

---

## 01 — Demo funcional

La aplicación tiene dos modos de uso accesibles desde la misma pantalla principal.

### Modo Upload

Sube una o varias imágenes (hasta 3 por análisis) para extraer datos estructurados.

- **Origen flexible** — arrastra archivos, toma una captura de cámara o pega una URL
- **Tipos soportados** — tickets/recibos y fotografías de vehículos
- **Detección de duplicados** — el mismo archivo no se añade dos veces
- **Múltiples documentos** — los resultados se muestran por imagen con acordeón colapsable
- **JSON raw** — toggle al final de la vista para inspeccionar la respuesta completa de la API

**Tickets / recibos devuelven:**
- Nombre del comercio, dirección, NIF/VAT
- Líneas de producto con categoría, precio unitario y total
- Desglose de impuestos (IVA, retenciones…)
- Totales: subtotal, impuestos, total
- Moneda inferida con aviso visual si no figuraba explícitamente

**Vehículos devuelven:**
- Matrícula y país
- Marca, modelo, color y tipo de vehículo
- Bounding box de detección (normalizado 0–1)

### Modo Live Detection

Detección continua desde la cámara sin necesidad de pulsar ningún botón.

- **Loop automático** — captura un frame JPEG cada 750 ms y lo envía a `/analyze`
- **Thumbnail del frame exacto** — la miniatura se captura *antes* de la llamada a la API, por lo que siempre coincide con la imagen analizada
- **Toast de notificación** — aparece brevemente en la esquina al detectar un vehículo; incluye miniatura, ID y matrícula
- **Historial en tabla** — ID · miniatura · matrícula · marca · modelo · color · tipo · confianza · acciones
- **Modal de detalle** — el icono 👁 abre la ficha completa de la detección
- **Overlay en tiempo real** — guía de bounding box sobre el vídeo; se pone verde al detectar
- **Cooldown automático** — pausa de 4 s tras una detección positiva, luego reanuda solo

---

## 02 — Explicación técnica

### Pipeline de análisis

```
📷 Captura          →    📦 SDK              →    🌐 POST /analyze
Frame JPEG                multipart/form-data       Backend REST API
o imagen subida

   →    🤖 AI Model         →    ✅ JSON response
        Vision + NLP              AnalysisResponse tipado
```

### Ciclo de detección (Live)

1. El loop espera 750 ms entre iteraciones
2. Si ya hay una petición en vuelo, el frame se descarta (no hay concurrencia)
3. Se captura el thumbnail del frame actual (antes del POST)
4. Se llama a `captureFrame()` para obtener el `File` y se envía a `analyze()`
5. Si `type !== 'unknown'` y `confidence >= 0.5` → detección positiva
6. Se añade la entrada al historial y se dispara el toast
7. El loop duerme 4 s (cooldown) y vuelve al paso 1

### Extracción (Upload)

- Hasta **3 imágenes** por batch
- Tipos posibles: `ticket` · `vehicle` · `unknown`
- Cuando los tickets del batch tienen distintas monedas, el total combinado **no se suma** y se muestra un aviso ámbar
- La confianza (`null` posible) se normaliza a porcentaje para la barra visual

### Modelo y endpoint

| Campo | Valor |
|---|---|
| Endpoint | `POST /analyze` |
| Formato | `multipart/form-data`, campo `images[]` |
| Auth | `Authorization: Bearer {SDK_API_KEY}` |
| Input | JPEG · PNG · WEBP, hasta 3 imágenes |
| Output | `AnalysisResponse` — JSON tipado con `confidence` |

---

## 03 — Arquitectura

```
Usuario           Nuxt 4 Frontend              SDK                Backend API       Modelo IA
(browser)  ─HTTPS─▶  ImageUploader.vue          │                    │                  │
                      LiveDetector.vue           ├── multipart ──────▶ POST /analyze ──▶ Vision
                      ResultViewer.vue           │   POST                                + NLP
                      ──────────────────         │                    │                  │
                      useLiveDetection.ts        │                    │                  │
                      useCamera.ts              │                    │                  │
                      useAnalyze.ts ─────────────┘                    │                  │
                              ◀─────────────────── JSON response ─────┘◀─────────────────┘

Hosting: Firebase Hosting                    Auth: Bearer token           Inferencia cloud
```

### Flujo de datos

| Capa | Detalle |
|---|---|
| **Auth** | `Authorization: Bearer {SDK_API_KEY}` |
| **Request** | `multipart/form-data` · campo: `images[]` |
| **Response** | `{ meta, summary, results[] }` |

### Estructura de carpetas

```
vision-artifical/
├── app/
│   ├── components/
│   │   ├── ImageUploader.vue     # UI de carga (drag-drop / cámara / URL)
│   │   ├── LiveDetector.vue      # Cámara en vivo, tabla de historial, modal, toast
│   │   └── ResultViewer.vue      # Renderiza tickets, vehículos y desconocidos
│   ├── composables/
│   │   ├── useAnalyze.ts         # Envuelve el SDK; estado reactivo del análisis
│   │   ├── useCamera.ts          # MediaDevices, zoom, torch, captureFrame()
│   │   ├── useFirebase.ts        # Helpers de Firebase
│   │   └── useLiveDetection.ts   # Loop de captura continua + historial de detecciones
│   ├── pages/
│   │   ├── index.vue             # Página principal — selector de pestañas Upload / Live
│   │   └── presentation.vue      # Presentación de diapositivas (/presentation)
│   └── types/
│       └── analysis.ts           # Tipos de dominio + isVehicleResult / isTicketResult
├── sdk/
│   └── src/
│       ├── client.ts             # Clase VisionAgentSDK
│       ├── types.ts              # Definiciones de tipos completas
│       └── index.ts              # Punto de entrada del paquete
├── nuxt.config.ts
└── firebase.json
```

---

## 04 — Escalabilidad

### Rendimiento

Firebase Hosting sirve los assets desde un CDN global. El SDK no tiene dependencias externas y pesa ~4 kB en el bundle. El frontend es compatible con SSG, lo que minimiza el JavaScript que llega al cliente.

- Firebase Hosting CDN global
- SDK sin dependencias (bundle ~4 kB)
- Compatible con SSG, hidratación mínima

### Extensibilidad

El diseño modular permite añadir nuevos tipos de análisis (documentos de identidad, facturas, señales de tráfico…) sin modificar el frontend: basta con que el backend devuelva un nuevo `type` y se añada el tipo TypeScript correspondiente.

- El tipo `"unknown"` actúa de base para nuevos modelos
- El SDK está versionado e independiente del frontend
- Los composables están desacoplados y son testeables unitariamente

### Viabilidad

El modelo de negocio natural es **SaaS B2B de pago por uso**: las empresas consumen la API según sus necesidades y pagan por volumen de llamadas. No hay infraestructura fija hasta que la demanda lo justifique.

- Precio por API call (pay-as-you-go)
- Planes por volumen para empresas
- Cero infraestructura fija al inicio

### Métricas clave

| Indicador | Valor |
|---|---|
| Latencia típica end-to-end | < 800 ms |
| Dependencias del SDK | 0 |
| Tipos de imagen soportados | sin límite (extensible) |
| Cobertura TypeScript | 100 % |

---

## 05 — Próximos pasos

### Corto plazo (3 – 6 meses)

| | Feature | Descripción |
|---|---|---|
| 🔐 | **Autenticación de usuarios** | Login, workspaces y historial persistente por cuenta |
| 📊 | **Dashboard de analytics** | Gráficas de gasto, número de detecciones por día/semana |
| 🔔 | **Alertas configurables** | Webhook o email al detectar matrículas concretas |
| 📱 | **PWA con notificaciones push** | Instalable en móvil, modo offline básico |

### Largo plazo (6 – 18 meses)

| | Feature | Descripción |
|---|---|---|
| 🔗 | **Integraciones ERP / CRM** | Exportar automáticamente a SAP, Salesforce, Odoo |
| 🌍 | **API pública con marketplace** | Los desarrolladores pueden publicar modelos personalizados |
| 🤝 | **White-label para flotas** | Plataforma de control de accesos para parkings |
| 🧠 | **Fine-tuning propio** | Modelo especializado entrenado con datos de clientes reales |

### Si se convierte en producto real

Modelo **SaaS B2B** con facturación por API calls, integraciones ERP/CRM y app móvil nativa.

---

## Instalación y uso local

### Requisitos

- Node.js 18+
- Backend activo con `POST /analyze`
- Firebase CLI (solo para despliegue)

### Configuración

```bash
git clone <repo-url>
cd vision-artifical
npm install
```

Crea el fichero `.env`:

```env
# URL del backend (obligatorio)
BACKEND_URL=https://tu-backend.ejemplo.com

# Token de autenticación (opcional)
SDK_API_KEY=tu_clave_secreta
```

### Desarrollo

```bash
npm run dev
# → http://localhost:3000
```

### Build de producción

```bash
npm run build
```

### Despliegue en Firebase

```bash
npm run build
firebase deploy
```

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `BACKEND_URL` | Sí | URL base del backend AI (`POST /analyze`) |
| `SDK_API_KEY` | No | Bearer token enviado en cada petición |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Nuxt 4 (Vue 3, `<script setup>`) |
| Estilos | Tailwind CSS v4 vía `@tailwindcss/vite` |
| SDK bundler | tsup (ESM + CJS + `.d.ts`) |
| Hosting | Firebase Hosting |
| Lenguaje | TypeScript (100 %) |

---

*AI Vision Agent · Hackathon Build · 2026*

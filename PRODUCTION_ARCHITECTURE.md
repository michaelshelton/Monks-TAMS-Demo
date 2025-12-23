# 🏗️ Production Architecture (TAMS Frontend + Monks TAMS API)

## 📋 Overview

This document describes the **current intended production architecture** for the TAMS demo:

- A **React frontend** (`@frontend/`) served by nginx.
- A **Monks TAMS API backend** (`@monks_tams_api/`) providing TAMS entities (sources, flows, segments, etc.).
- Supporting services such as **MongoDB** and **MinIO/S3-compatible storage**.
- Deployment on **Kubernetes**, typically managed via **Helm charts**.

Previous versions of this document focused on VAST‑specific components (VAST database, QR services, Hydrolix analytics). Those are now considered **exploratory** and are no longer the primary architecture for this project.

---

## 🏛️ System Architecture (High Level)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐        ┌─────────────────────────────┐                 │
│  │   FRONTEND      │  HTTP  │        TAMS API             │                 │
│  │   (React +      │◄──────►│   (@monks_tams_api/        │                 │
│  │    nginx)       │        │   Helm chart: tams-api)    │                 │
│  └─────────────────┘        └─────────────────────────────┘                 │
│                                              │                              │
│                                   ┌──────────┴───────────┐                  │
│                                   │                      │                  │
│                         ┌─────────────────┐    ┌─────────────────┐         │
│                         │    MongoDB      │    │   MinIO / S3    │         │
│                         │ (metadata DB)   │    │ (media storage) │         │
│                         └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key points:**

- The **frontend** is a static SPA bundled by Vite and served by nginx.
- The **frontend never talks directly to databases or object storage**. It only speaks HTTP to the **Monks TAMS API**.
- The **TAMS API** is responsible for:
  - Defining the public API surface (sources, flows, segments, markers, QC stats, etc.).
  - Talking to **MongoDB** for metadata.
  - Talking to **MinIO/S3** for media objects.
- Kubernetes + Helm provide the deployment, scaling, and networking glue between these services.

---

## 🔄 Frontend ↔ Backend Integration

### Frontend (`@frontend/`)

In production the frontend behaves as:

- A static bundle created by `npm run build` into the `dist/` directory.
- Served by nginx in the `node:18-alpine → nginx:alpine` multi‑stage Dockerfile.
- A reverse proxy for API calls, forwarding `/api/` and `/api/proxy/` to the TAMS API.

**Key files:**

- `Dockerfile`
  - Stage 1: builds the React app with Node.
  - Stage 2: serves static assets with nginx on port **80**.
- `nginx.conf`
  - Serves `index.html` and assets from `/usr/share/nginx/html`.
  - Defines:

    ```nginx
    location /api/ {
        proxy_pass ${BACKEND_URL};
        # ...
    }

    location /api/proxy/ {
        proxy_pass ${BACKEND_URL};
        # ...
    }
    ```

  - Exposes a `/health` endpoint for Kubernetes liveness/readiness probes.
- `docker-entrypoint.sh`
  - Reads `BACKEND_URL` from the container environment (with a sensible default).
  - Uses `envsubst` to inject that value into `nginx.conf` at container start.
  - Starts nginx in the foreground.
- `src/config/apiConfig.ts`
  - Chooses the backend base URL for the React app, defaulting to the Monks TAMS API.
  - In production, the app uses `/api/...` paths which are then proxied by nginx to `BACKEND_URL`.

**Runtime contract:**

- The **only requirement** for the frontend container is that `BACKEND_URL` points at the TAMS API Service:

  ```text
  BACKEND_URL = http://tams-api:3000
  ```

  (This matches the `tams-api` chart’s HTTP port.)

### Backend (`@monks_tams_api/`)

The Monks TAMS API stack is deployed via its own Helm charts:

- `charts/tams-api/` – core Node‑based API.
- `charts/mongodb/` – MongoDB instance for metadata.
- `charts/minio/` – MinIO providing S3‑compatible object storage.

**tams-api chart highlights:**

- Listens on:
  - HTTP: **3000** (API + `/health`).
  - WebSocket: **3001** (if used).
- Environment in `charts/tams-api/values.yaml` configures:
  - `MONGODB_URI`
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - Kafka topics and brokers (where enabled)
- The Deployment defines `/health` probes which Kubernetes uses to manage pod health.

The frontend is designed to work with whatever schema the Monks TAMS API exposes for sources, flows, segments, QC, etc., and recent frontend work has been aligned to that schema (for example `Sources.tsx`, `Flows.tsx`, and `FlowDetails.tsx`).

---

## 🚀 Kubernetes & Helm Deployment Model

### Backend Charts (Existing in `@monks_tams_api/`)

- **`charts/tams-api/`**
  - Deploys the TAMS API Deployment and Service.
  - Exposes port 3000 for HTTP, port 3001 for WebSockets.
  - Configures environment variables for DB, storage, and messaging.
- **`charts/mongodb/`**
  - Deploys MongoDB with credentials and a Service.
- **`charts/minio/`**
  - Deploys MinIO with credentials and a Service for internal S3‑style access.

These three charts together provide the full backend for the TAMS demo.

### Frontend Chart (Stubbed in `@frontend/`)

To integrate with the same cluster, a **stub Helm chart** for the frontend lives at:

- `frontend/charts/tams-frontend/`

This chart is intentionally minimal and meant to be wired into a larger umbrella chart or environment chart.

**Chart contents (summary):**

- `Chart.yaml`
  - Standard Helm `apiVersion: v2` chart metadata.
- `values.yaml`
  - `image.repository` / `image.tag` for the frontend container.
  - `service.port: 80`.
  - `env.BACKEND_URL: "http://tams-api:3000"` by default.
- `templates/deployment.yaml`
  - Runs the nginx container, listening on port 80.
  - Injects `BACKEND_URL` into the environment for `docker-entrypoint.sh`.
  - Uses `/health` for liveness and readiness probes.
- `templates/service.yaml`
  - ClusterIP Service exposing port 80.
- `templates/ingress.yaml`
  - Optional basic Ingress stub, controlled via values.

**Cluster view:**

```text
User → Ingress / Load Balancer → tams-frontend Service (80) → nginx
                                         │
                                         ▼
                                   /api/... proxy
                                         │
                                         ▼
                                  tams-api Service (3000)
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
              MongoDB Service                           MinIO Service
```

---

## 📊 Data & Request Flow

### 1. User Interaction

1. User opens `tams.example.com` (or similar).
2. The Ingress / Load Balancer routes to the `tams-frontend` Service.
3. nginx serves the compiled React app.
4. User interactions (navigation, filters, etc.) trigger HTTP requests to `/api/...`.

### 2. API Requests

1. The browser sends `GET /api/sources`, `GET /api/flows/{id}`, `POST /api/flows/{id}/segments`, etc.
2. nginx forwards these to `${BACKEND_URL}` (typically `http://tams-api:3000`).
3. The TAMS API:
   - Executes queries against MongoDB.
   - Generates or resolves S3/MinIO object keys.
   - Returns JSON responses aligned with the TAMS schema.

### 3. Media & Derived Data

- Segment, flow, and QC data returned by the API may reference:
  - Media URLs or manifests stored in MinIO/S3.
  - Derived objects like thumbnails or compiled clips.
- The frontend is responsible only for rendering and simple client‑side logic; **all storage and heavy computation live behind the TAMS API**.

---

## 🔐 Security & Configuration Considerations

- **API access:**
  - External clients talk only to:
    - The frontend (for HTML/JS/CSS).
    - The API endpoints exposed via Ingress/Gateway.
  - No direct access to MongoDB or MinIO from the public internet.
- **Secrets:**
  - MongoDB and MinIO credentials, JWT secrets, and any API keys are:
    - Defined in the `tams-api` chart, ideally through Kubernetes Secrets.
    - Not embedded in the frontend bundle.
- **Environment separation:**
  - Different environments (dev/stage/prod) can be modelled by:
    - Different Helm values for `tams-api` (e.g., DB URIs, MinIO endpoints).
    - Different image tags in the frontend and backend charts.
    - Different `BACKEND_URL` settings for the frontend.

---

## 📈 Scaling and Resilience

- **Frontend:**
  - Stateless; can be horizontally scaled by increasing replicas in the `tams-frontend` Deployment.
  - nginx serves static assets efficiently and can sit behind a CDN if desired.
- **Backend:**
  - `tams-api` replicas can be scaled based on CPU/memory or custom metrics.
  - MongoDB and MinIO can be scaled or replaced with managed equivalents in cloud environments.
- **Health checks:**
  - nginx exposes `/health` for the frontend pods.
  - TAMS API exposes `/health` for API pods.
  - Both are wired into Kubernetes probes via their respective Helm charts.

---

## 🎯 Summary

- The **authoritative architecture** for this project is:
  - **React/nginx frontend (`@frontend/`)** →
  - **Monks TAMS API (`@monks_tams_api/`)** →
  - **MongoDB + MinIO/S3**.
- Both frontend and backend are **Helm‑deployable**:
  - Backend via existing charts in `@monks_tams_api/charts/`.
  - Frontend via a new stub chart in `@frontend/charts/tams-frontend/`.
- VAST‑specific, QR code, and Hydrolix concepts from earlier documents are **no longer the primary production plan** and can be reintroduced later if the backend grows in that direction.

---

**Last Updated**: December 2025  
**Next Review**: After the first Kubernetes/Helm deployment of the full stack



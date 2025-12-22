# TAMS API Endpoints Summary

This document summarizes all available API endpoints in the `monks_tams_api` service and how the frontend uses them.

## Base URL
- Development: `http://localhost:3000` (via Vite proxy at `/api`)
- Production: `/api/proxy` (via Vercel proxy)

## Available Endpoints

### Service & Health
- `GET /health` - Health check
  - Returns: `{ status: "healthy|degraded", timestamp: string, services: {...} }`
  - Status: ✅ Working
- `GET /service` - Service information
  - Returns: `{ name: string, version: string, capabilities: {...} }`
  - Status: ✅ Working
- `GET /service/storage-backends` - Storage backend information
  - Returns: `{ storage_backends: [...] }`
  - Status: ✅ Working

### Sources
- `GET /sources` - List sources
  - Query params: `limit`, `page`, `format`, `label`, `tag.<name>`, `tag_exists.<name>`
  - Returns: `{ sources: [...], count: number }`
  - Status: ✅ Working
  - Frontend: `Sources.tsx` uses this endpoint
- `GET /sources/:id` - Get source details
  - Returns: Source object with flows
  - Status: ✅ Working
- `POST /sources/:id` - Create/update source
  - Body: Source object (requires `id` and `format` fields)
  - Returns: Created/updated source
  - Status: ✅ Working
  - Frontend: `Sources.tsx` uses this for creating sources
- `PUT /sources/:id` - Update source metadata
  - Status: ✅ Working
- `PUT /sources/:id/label` - Update source label
  - Status: ✅ Working
- `DELETE /sources/:id/label` - Delete source label
  - Status: ✅ Working
- `PUT /sources/:id/tags/:name` - Update source tags
  - Status: ✅ Working
- `DELETE /sources/:id/tags/:name` - Delete source tag
  - Status: ✅ Working
- `DELETE /sources/:id` - Delete source
  - Query params: `cascade` (boolean)
  - Status: ✅ Working
- `POST /sources/from-flows` - Create source from existing flows
  - Status: ✅ Working

### Flows
- `GET /flows` - List flows
  - Query params: `limit`, `page`, `format`, `codec`, `source_id`, `label`, `tag.<name>`, `timerange`
  - Returns: Array of flows (when working)
  - Status: ❌ **BROKEN** - Returns `InternalError: Cannot read properties of undefined (reading 'flowsService')`
  - Frontend: `Landing.tsx` tries to use this but handles error gracefully
  - **Backend Fix Required**: Controller method binding issue
- `GET /flows/:id` - Get flow details
  - Returns: Flow object with segment statistics
  - Status: ✅ Working (assumed, not tested)
- `POST /flows/:id` - Create/update flow
  - Body: Flow object (requires `id`, `source_id`, `format`, `codec`, `essence_parameters`)
  - Returns: Created/updated flow
  - Status: ✅ Working (used by seed script)
- `PUT /flows/:id` - Update flow
  - Status: ✅ Working
- `PUT /flows/:id/tags/:name` - Update flow tags
  - Status: ✅ Working
- `DELETE /flows/:id/tags/:name` - Delete flow tag
  - Status: ✅ Working
- `DELETE /flows/:id` - Delete flow
  - Status: ✅ Working
- `GET /flows/:id/stats` - Get flow statistics
  - Status: ✅ Working (legacy endpoint)
- `POST /flows/:id/storage` - Get presigned upload URL
  - Returns: `{ object_id: string, upload_url: string, expires: string }`
  - Status: ✅ Working

### Segments
- `GET /flows/:id/segments` - List flow segments
  - Query params: `duration`, `from`, `to`, `limit`
  - Returns: `{ segments: [...], total_duration: number, count: number }`
  - Status: ✅ Working
- `POST /flows/:id/segments` - Register segment
  - Body: Segment metadata
  - Returns: Segment with download URL
  - Status: ✅ Working
- `GET /flows/:id/segments/:segmentId` - Get segment details
  - Returns: Segment with download URL
  - Status: ✅ Working
- `GET /flows/:id/segments/:segmentId.mp4` - Proxy segment file (MP4)
  - Status: ✅ Working
- `GET /flows/:id/segments/:segmentId.ts` - Proxy segment file (TS)
  - Status: ✅ Working
- `PATCH /flows/:id/segments/:segmentId` - Update segment
  - Status: ✅ Working

### Search
- `GET /search` - Keyword search
  - Query params: `query`, `limit`, `skip`
  - Returns: `{ query: string, search_type: string, items: [...], count: number, total: number }`
  - Status: ✅ Working
- `GET /api/v1/search` - Legacy search endpoint
  - Status: ✅ Working (same as `/search`)

### QC (Quality Control)
- `GET /api/v1/qc/statistics` - QC statistics
  - Status: ✅ Working (assumed)

### Objects
- `GET /objects` - List objects
  - Status: ⚠️ **Not Implemented** - Endpoint mentioned in service root but no routes found
  - Frontend: `Landing.tsx` tries to use this but handles error gracefully

### Webhooks
- `GET /service/webhooks` - List webhooks
  - Status: ⚠️ **Not Implemented** - Schemas exist but no routes found
  - Frontend: `Landing.tsx` tries to use this but handles error gracefully

## Response Format Handling

The frontend's `bbcTamsGet` method normalizes different response formats:

1. **Direct Array**: `[...]` → Normalized to `{ data: [...], pagination: { count: N } }`
2. **BBC TAMS Format**: `{ data: [...], pagination: {...} }` → Passed through
3. **New API Format**: `{ sources: [...], count: N }` → Normalized to `{ data: [...], pagination: { count: N } }`
4. **Alternative Format**: `{ flows: [...], count: N }` → Normalized similarly

## Known Issues

### Critical
1. **Flows List Endpoint Broken** (`GET /flows`)
   - Error: `InternalError: Cannot read properties of undefined (reading 'flowsService')`
   - Impact: Cannot display flow statistics on Landing page
   - Location: `monks_tams_api/src/routes/flows.routes/flows.routes.ts:30`
   - Fix: Ensure controller method is properly bound

### Medium Priority
2. **Query Parameter Type Validation**
   - Issue: `limit` parameter must be integer, but query strings are strings
   - Impact: Cannot use `?limit=10` in query string
   - Fix: Backend should convert string query params to integers where schema expects integers

### Low Priority
3. **Objects Endpoint Not Implemented**
   - Endpoint mentioned in service root but no implementation found
   - Frontend handles gracefully

4. **Webhooks Endpoint Not Implemented**
   - Schemas exist but no routes found
   - Frontend handles gracefully

## Frontend Usage

### Landing.tsx
- Uses: `/health`, `/service`, `/service/storage-backends`, `/sources`, `/flows`, `/objects`, `/service/webhooks`
- Handles: All endpoints gracefully, shows placeholders when data unavailable

### Sources.tsx
- Uses: `/sources` (GET, POST)
- Handles: Response format normalization, pagination, filtering
- Filters: Format, label, tags (server-side), search (client-side)

## Testing

To test endpoints:
```bash
# Health check
curl http://localhost:3000/health

# List sources
curl http://localhost:3000/sources

# List flows (currently broken)
curl http://localhost:3000/flows

# Get source details
curl http://localhost:3000/sources/{source-id}

# Search
curl "http://localhost:3000/search?query=test"
```


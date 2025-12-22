# Frontend Gap Analysis

## Overview
This document identifies gaps between the available TAMS API endpoints in `@monks_tams_api/` and the frontend implementation. Last updated after Observability page cleanup and flow stats integration.

## ✅ Fully Implemented Features

### 1. Sources Management
- **List Sources** (`GET /sources`) - ✅ Implemented in `Sources.tsx`
- **Get Source Details** (`GET /sources/:id`) - ✅ Implemented in `SourceDetails.tsx`
- **Create Source** (`POST /sources/:id`) - ✅ Implemented in `Sources.tsx`
- **Update Source** (`PUT /sources/:id`) - ✅ Implemented in `SourceDetails.tsx`
- **Delete Source** (`DELETE /sources/:id`) - ✅ Implemented in `SourceDetails.tsx`
- **Update Source Label** (`PUT /sources/:id/label`) - ✅ Implemented in `SourceDetails.tsx`
- **Delete Source Label** (`DELETE /sources/:id/label`) - ✅ Available in backend, not exposed in UI (low priority)
- **Update Source Description** (`PUT /sources/:id/description`) - ✅ Available in backend, not exposed in UI (low priority)
- **Delete Source Description** (`DELETE /sources/:id/description`) - ✅ Available in backend, not exposed in UI (low priority)
- **Source Tags Management** (`PUT/DELETE /sources/:id/tags/:name`) - ✅ Implemented via `SourceTagsManager` component
- **Create Source from Flows** (`POST /sources/from-flows`) - ⚠️ Available in backend, not used in frontend

### 2. Flows Management
- **List Flows** (`GET /flows`) - ✅ Implemented in `Flows.tsx`
- **Get Flow Details** (`GET /flows/:id`) - ✅ Implemented in `FlowDetails.tsx`
- **Create Flow** (`POST /flows/:id`) - ✅ Implemented in `Flows.tsx`
- **Update Flow** (`PUT /flows/:id`) - ✅ Implemented in `FlowDetails.tsx` (via `FlowReadOnlyManager`)
- **Delete Flow** (`DELETE /flows/:id`) - ✅ Implemented in `FlowDetails.tsx`
- **Flow Tags Management** (`PUT/DELETE /flows/:id/tags/:name`) - ✅ Implemented via `FlowTagsManager` component
- **Flow Stats** (`GET /flows/:id/stats`) - ✅ Implemented in `Observability.tsx` (aggregates stats from sample flows)
- **Flow Live Status** (`GET /flows/:id/live`) - ⚠️ Available in backend, not used in frontend
- **Flow Cleanup** (`DELETE /flows/:id/cleanup`) - ⚠️ Available in backend, not used in frontend

### 3. Segments Management
- **List Segments** (`GET /flows/:id/segments`) - ✅ Implemented in `FlowDetails.tsx`
- **Get Segment** (`GET /flows/:id/segments/:segmentId`) - ✅ Available via proxy endpoints
- **Create Segment** (`POST /flows/:id/segments`) - ✅ Implemented in `FlowDetails.tsx` upload modal
- **Update Segment** (`PATCH /flows/:id/segments/:segmentId`) - ⚠️ Available in backend, not exposed in UI
- **Get Storage URL** (`POST /flows/:id/storage`) - ✅ Used in segment upload flow
- **Segment Proxy** (`GET /flows/:id/segments/:segmentId.mp4`, `.ts`) - ✅ Available in backend, used by video players

### 4. Search
- **Keyword Search** (`GET /search` or `GET /api/v1/search`) - ✅ Implemented in `Search.tsx`

### 5. QC (Quality Control)
- **QC Statistics** (`GET /api/v1/qc/statistics`) - ✅ Implemented in `QCStatistics.tsx` and `Observability.tsx`
- **Failed Chunks** (`GET /api/v1/qc/failed-chunks`) - ✅ Implemented in `QCStatistics.tsx`
- **QC By Quality Range** (`GET /api/v1/qc/by-quality?min=0&max=100`) - ✅ Implemented in `QCStatistics.tsx`
- **QC Markers for Flow** (`GET /api/v1/flows/:flowId/qc-markers`) - ✅ Implemented in `FlowDetails.tsx` QC tab

### 6. Service Information & Health
- **Health Check** (`GET /health`) - ✅ Implemented in `Landing.tsx`, `Observability.tsx`
- **Service Info** (`GET /service`) - ✅ Available in backend, removed from Observability (static config, not observability data)
- **Storage Backends** (`GET /service/storage-backends`) - ✅ Available in backend, removed from Observability (static config, not observability data)

### 7. Observability
- **System Health** (`GET /health`) - ✅ Implemented in `Observability.tsx`
- **Flow Statistics** (`GET /flows/:id/stats`) - ✅ Implemented in `Observability.tsx` (aggregates from sample flows)
- **QC Statistics** (`GET /api/v1/qc/statistics`) - ✅ Implemented in `Observability.tsx`
- **Sources & Flows Counts** - ✅ Implemented via `GET /sources` and `GET /flows`

## ⚠️ Partially Implemented / Available but Not Used

### 1. Source Description Management
**Status**: ✅ **AVAILABLE IN BACKEND** - Not exposed in UI

**Available API Endpoints**:
- ✅ `PUT /sources/:id/description` - Available in backend
- ✅ `DELETE /sources/:id/description` - Available in backend

**Current Implementation**:
- ⚠️ Endpoints exist in backend but not exposed in `SourceDetails.tsx` UI
- Source description is displayed but not editable

**Gap**: 
- Could add description editing UI similar to label editing
- Low priority - description editing is less critical than label editing

### 2. Flow Live Status
**Status**: ⚠️ **AVAILABLE IN BACKEND** - Not used in frontend

**API Endpoint**: `GET /flows/:id/live`

**Current Implementation**:
- Endpoint exists in backend (`flows.routes.ts` line 86-89)
- Not used in frontend

**Gap**: 
- Could display live status indicator in `FlowDetails.tsx`
- Would show if a flow is currently live/active

**Recommendation**: 
- Add live status badge/indicator in flow details if needed

### 3. Flow Cleanup
**Status**: ⚠️ **AVAILABLE IN BACKEND** - Not used in frontend

**API Endpoint**: `DELETE /flows/:id/cleanup`

**Current Implementation**:
- Endpoint exists in backend (`flows.routes.ts` line 95-100)
- Not used in frontend

**Gap**: 
- Could add cleanup action in `FlowDetails.tsx` for cleaning up old segments
- Different from delete - cleanup removes segments while keeping flow metadata

**Recommendation**: 
- Add cleanup button/action if segment cleanup functionality is needed

### 4. Segment Update
**Status**: ⚠️ **AVAILABLE IN BACKEND** - Not exposed in UI

**API Endpoint**: `PATCH /flows/:id/segments/:segmentId`

**Current Implementation**:
- Endpoint exists in backend (`segments.routes.ts` line 23-27)
- Not exposed in frontend UI

**Gap**: 
- Could add segment metadata editing in `FlowDetails.tsx`
- Would allow updating segment description, tags, etc.

**Recommendation**: 
- Add segment edit functionality if metadata updates are needed

### 5. Create Source from Flows
**Status**: ⚠️ **AVAILABLE IN BACKEND** - Not used in frontend

**API Endpoint**: `POST /sources/from-flows`

**Current Implementation**:
- Endpoint exists in backend (`sources.routes.ts` line 31-35)
- Not used in frontend

**Gap**: 
- Could add functionality to create a source from existing flows
- Useful for grouping flows into sources

**Recommendation**: 
- Add "Create Source from Flows" action if this workflow is needed

## ❌ Missing Features (Not Available in Backend)

### 1. Objects Endpoint
**Status**: ❌ **NOT IMPLEMENTED IN BACKEND**

**API Endpoint**: `GET /objects`

**Current Implementation**:
- `Objects.tsx` page exists and is ready
- Endpoint is not implemented in backend (documented in `BACKEND_FIXES_NEEDED.md` Issue #5)

**Gap**: 
- Backend needs to implement the `/objects` endpoint
- Frontend is ready once backend is implemented

### 2. HLS Streaming
**Status**: ❌ **COMMENTED OUT IN BACKEND**

**API Endpoint**: `GET /flows/:id/stream.m3u8`

**Backend Status**:
- Endpoint is commented out in `flows.routes.ts` (lines 111-115)
- Controller method `controller.manifest` may not be implemented

**Current Implementation**:
- `HLSVideoPlayer` component exists in frontend
- Used in `FlowDetails.tsx` and `HLSTestPage.tsx`
- Will fail if endpoint is not available

**Gap**: 
- Backend needs to uncomment and implement HLS manifest endpoint
- Frontend is ready once backend is implemented

**Recommendation**: 
- Document as backend gap
- Frontend will work once backend implements the endpoint

### 3. Webhooks Management
**Status**: ❌ **NOT AVAILABLE IN BACKEND**

**API Endpoints**:
- `GET /service/webhooks` - ❌ Not found in backend routes
- `POST /service/webhooks` - ❌ Not found in backend routes
- `PUT /service/webhooks/:id` - ❌ Not found in backend routes
- `DELETE /service/webhooks/:id` - ❌ Not found in backend routes

**Current Implementation**:
- ✅ `Webhooks.tsx` page exists
- ⚠️ Uses `apiClient.getWebhooks()`, `createWebhook()`, etc.
- ❌ Backend routes don't exist (only type definitions found)

**Gap**: 
- Backend needs to implement webhook management endpoints
- Frontend is ready once backend is implemented

**Recommendation**: 
- Document as backend gap
- Frontend implementation exists but will fail until backend endpoints are added

### 4. Source Collection Management
**Status**: ❌ **NOT AVAILABLE IN BACKEND**

**API Endpoints**:
- `PUT /sources/:id/source_collection` - ❌ Not found in backend routes
- `DELETE /sources/:id/source_collection` - ❌ Not found in backend routes

**Current Implementation**:
- ❌ Source collection endpoints are not implemented in the `@monks_tams_api/` backend
- ❌ No source collection management UI in `SourceDetails.tsx`

**Gap**: 
- Backend needs to implement source collection endpoints if this feature is required
- Frontend implementation would be needed once backend endpoints are available


## 📋 Summary of Gaps

### High Priority (Core Functionality - Backend Gaps)
1. **Objects Endpoint** - ❌ **Backend Gap**
   - Frontend ready, waiting for backend implementation
   - Documented in `BACKEND_FIXES_NEEDED.md` Issue #5

2. **HLS Streaming** - ❌ **Backend Gap**
   - Endpoint commented out in backend
   - Frontend ready, waiting for backend implementation

3. **Webhooks** - ❌ **Backend Gap**
   - No backend routes found (only type definitions)
   - Frontend ready, waiting for backend implementation

### Medium Priority (Enhancement Features - Can Implement)
4. **Source Description Editing** - ⚠️ **Available but Not Exposed**
   - Backend endpoints exist (`PUT/DELETE /sources/:id/description`)
   - Could add UI similar to label editing
   - Low priority enhancement

5. **Flow Live Status** - ⚠️ **Available but Not Used**
   - Backend endpoint exists (`GET /flows/:id/live`)
   - Could add live status indicator in flow details
   - Low priority enhancement

6. **Flow Cleanup** - ⚠️ **Available but Not Used**
   - Backend endpoint exists (`DELETE /flows/:id/cleanup`)
   - Could add cleanup action for removing old segments
   - Low priority enhancement

7. **Segment Update** - ⚠️ **Available but Not Exposed**
   - Backend endpoint exists (`PATCH /flows/:id/segments/:segmentId`)
   - Could add segment metadata editing
   - Low priority enhancement

8. **Create Source from Flows** - ⚠️ **Available but Not Used**
   - Backend endpoint exists (`POST /sources/from-flows`)
   - Could add workflow for creating sources from existing flows
   - Low priority enhancement

### Low Priority (Not Available in Backend)
9. **Source Collection Management** - ❌ **Not Available in Backend**
   - Backend endpoints don't exist
   - Would need backend implementation first


## 📝 Notes

- **Most core functionality is well implemented** - Sources, Flows, Segments, Search, and QC are fully functional
- **Backend gaps documented** - Objects, HLS, and Webhooks are documented as backend gaps
- **Frontend aligns with backend** - Flow collections, flow label/description editing removed to match backend capabilities
- **Observability page cleaned up** - Removed static service discovery info, focuses on dynamic metrics
- **Enhancement opportunities** - Several backend endpoints exist but aren't exposed in UI (low priority)

## 🎯 Action Items

### For Backend Team (Cannot Modify)
1. Implement `/objects` endpoint (Issue #5 in `BACKEND_FIXES_NEEDED.md`)
2. Uncomment and implement HLS manifest endpoint (`GET /flows/:id/stream.m3u8`)
3. Implement webhook management endpoints if webhooks are required

### For Frontend Team (Can Implement)
1. **Source Description Editing** (Medium Priority)
   - Add description editing UI in `SourceDetails.tsx` similar to label editing
   - Use `PUT /sources/:id/description` endpoint

2. **Flow Live Status Indicator** (Low Priority)
   - Add live status badge in `FlowDetails.tsx`
   - Use `GET /flows/:id/live` endpoint

3. **Flow Cleanup Action** (Low Priority)
   - Add cleanup button in `FlowDetails.tsx` if segment cleanup is needed
   - Use `DELETE /flows/:id/cleanup` endpoint

4. **Segment Metadata Editing** (Low Priority)
   - Add segment edit functionality in `FlowDetails.tsx`
   - Use `PATCH /flows/:id/segments/:segmentId` endpoint

5. **Create Source from Flows** (Low Priority)
   - Add workflow for creating sources from existing flows
   - Use `POST /sources/from-flows` endpoint

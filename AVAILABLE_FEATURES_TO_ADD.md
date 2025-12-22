# Available Backend Features to Add to Frontend

## Summary

Based on review of `@monks_tams_api/` backend and `@frontend/FRONTEND_GAP_ANALYSIS.md`, here are features that are **fully available in the backend** but **not yet implemented** in the frontend.

---

## ✅ Already Implemented

1. **Source Description Management** - ✅ **ALREADY IMPLEMENTED**
   - `PUT /sources/:id/description` - ✅ Implemented in `SourceDetails.tsx`
   - `DELETE /sources/:id/description` - ✅ Implemented in `SourceDetails.tsx`
   - Status: Fully functional, no action needed

2. **Flow Cleanup** - ✅ **IMPLEMENTED**
   - `DELETE /flows/:id/cleanup?hours=24` - ✅ Implemented in `FlowDetails.tsx`
   - Cleanup button in Quick Actions section
   - Modal with hours input (default 24)
   - Results display showing deleted segments and freed storage
   - Status: Fully functional, no action needed

3. **Segment Update** - ❌ **REMOVED** (Backend Limitation)
   - `PATCH /flows/:id/segments/:segmentId` - Backend expects ObjectId format, but segments use UUIDs
   - Backend limitation: `segments.repo.ts` uses `new ObjectId(id)` which fails for UUID segment IDs
   - Similar to Issue #6 for flows - backend cannot handle UUID-based segment IDs
   - Status: Removed from UI as functionality is not supported by backend

---

## 🎯 Recommended to Add (High Value)

_No remaining high-value features to add._

---

## ⚠️ Optional to Add (Lower Priority)

### 3. Flow Live Status (`GET /flows/:id/live`)
**Status**: ✅ **FULLY AVAILABLE IN BACKEND** - Not used in frontend

**Backend Endpoint**: `GET /flows/:id/live`

**What it returns**:
```json
{
  "protocol": "websocket",
  "url": "ws://localhost:3001/live/{flowId}",
  "hls_fallback": "http://localhost:3000/hls/{flowId}.m3u8"
}
```

**Current State**:
- `FlowDetails.tsx` has "Live Mode" toggle, but it's just UI state
- Not actually calling `GET /flows/:id/live` endpoint
- Could display live status badge/indicator

**Implementation Location**: `FlowDetails.tsx`

**Suggested UI**:
- Call `GET /flows/:id/live` on flow load
- Display "Live" badge if flow is active
- Show websocket/HLS URLs if available

**Priority**: **Low** - Informational only, current UI toggle is sufficient

---

### 4. Create Source from Flows (`POST /sources/from-flows`)
**Status**: ✅ **FULLY AVAILABLE IN BACKEND** - Not implemented in frontend

**Backend Endpoint**: `POST /sources/from-flows`

**Request Body**:
```json
{
  "flow_ids": ["flow-id-1", "flow-id-2"],
  "source_id": "source-id-optional",
  "label": "Source Label",
  "description": "Source Description",
  "tags": {}
}
```

**What it does**:
- Creates a new source from existing flows
- Groups multiple flows into a single source
- Updates all flows to reference the new source

**Implementation Location**: `Flows.tsx` or new workflow page

**Suggested UI**:
- Multi-select flows in `Flows.tsx`
- "Create Source from Selected Flows" action
- Modal with form:
  - Source ID (optional, auto-generated)
  - Label
  - Description
  - Tags
- Shows list of selected flows
- On success, navigate to new source

**Priority**: **Low** - Workflow feature, less commonly used

---

## ❌ Should Remove (Not Available in Backend)

### Webhooks Page
**Status**: ❌ **NOT AVAILABLE IN BACKEND** - Should be removed

**Current State**:
- `Webhooks.tsx` page exists
- Navigation link in `App.tsx` (line 72)
- API client methods exist but will fail
- Backend has type definitions but no routes

**Action Required**:
1. Remove `Webhooks.tsx` page
2. Remove webhook navigation link from `App.tsx`
3. Remove webhook route from `App.tsx`
4. Optionally remove webhook API client methods (or leave for future)

**Priority**: **High** - Remove non-functional feature

---

## 📊 Summary Table

| Feature | Backend Status | Frontend Status | Priority | Action |
|---------|---------------|----------------|----------|--------|
| Source Description | ✅ Available | ✅ Implemented | - | None |
| Flow Cleanup | ✅ Available | ✅ **IMPLEMENTED** | - | **Complete** |
| Segment Update | ⚠️ Limited | ❌ **REMOVED** | - | **Backend Limitation** |
| Flow Live Status | ✅ Available | ⚠️ Partial | Low | Enhance |
| Create Source from Flows | ✅ Available | ❌ Missing | Low | Add |
| Webhooks | ❌ Not Available | ⚠️ Exists | **High** | Remove |

---

## 🎯 Recommended Implementation Order

1. **Remove Webhooks** (High Priority)
   - Clean up non-functional feature
   - Quick win

2. ~~**Add Flow Cleanup**~~ ✅ **COMPLETED**
   - ✅ Implemented in `FlowDetails.tsx`
   - ✅ Added cleanup button in Quick Actions
   - ✅ Modal with hours input and results display

3. ~~**Add Segment Update**~~ ❌ **REMOVED**
   - Backend limitation: Cannot update segments with UUID IDs (backend expects ObjectId format)
   - Removed from UI as functionality is not supported by backend
   - Similar to Issue #6 for flows - documented in `BACKEND_FIXES_NEEDED.md`

4. **Enhance Flow Live Status** (Low Priority)
   - Nice to have
   - Current UI toggle may be sufficient

5. **Add Create Source from Flows** (Low Priority)
   - Workflow feature
   - Less commonly used

---

## 📝 Notes

- All listed features are **fully implemented** in the backend
- No backend changes needed
- Frontend can implement these immediately
- Webhooks should be removed as backend doesn't support it


# Backend API Fixes Required

This document lists backend API issues that need to be fixed in `@monks_tams_api/`. Issues are prioritized by impact.

**Recent Updates:**
- ✅ **Issue #1 (Flow ID Missing)** - Fixed in PR #7 (December 2025)

---

## 🔴 **CRITICAL PRIORITY** - Blocks Core Functionality

### Issue #1: Flow ID Missing in Source Response

**Status**: ✅ **FIXED** (PR #7 - December 2025)

**Issue**: When calling `GET /sources/:id`, the returned `flows` array contains flow objects that are missing the `id` field.

**Expected Response**: 
```json
{
  "id": "source-id",
  "flows": [
    {
      "id": "flow-id",
      "label": "Flow Label",
      "format": "urn:x-nmos:format:video"
    }
  ]
}
```

**Actual Response**:
```json
{
  "id": "source-id",
  "flows": [
    {
      "label": "Flow Label",
      "format": "urn:x-nmos:format:video"
      // Missing "id" field
    }
  ]
}
```

**Root Cause**: 
The service mapped `f.id` from Flow objects returned by `flowsRepo.findBySourceId()`, but the Flow objects from MongoDB have `_id` instead of `id`. The mapping needed to handle `_id` fields.

**Fix Applied** (PR #7):
Updated the flow mapping in `getSourceWithFlows()` to use `f._id`:
```typescript
flows: flows.map((f: Flow) => ({
  id: f._id,  // Fixed: Now correctly uses _id from MongoDB
  label: f.label,
  format: f.format,
  tags: f.tags,
  created: f.created_at,
  updated: f.updated_at,
})),
```

**Files Modified**:
- `monks_tams_api/src/services/sources.service.ts` - `getSourceWithFlows()` method (line 94-95)

**Frontend Impact**:
- Frontend `SourceDetails.tsx` has been updated with comments noting the fix is in place
- Defensive workaround code remains for edge cases but should rarely be needed

---

### Issue #2: Flow Details Endpoint (`GET /flows/:id`) - Broken for Non-ObjectId IDs

**Status**: ❌ **BROKEN**

**Issue**: When calling `GET /flows/:id` with a flow ID that is not a MongoDB ObjectId (e.g., "webcam-main" or UUIDs), the API returns:
```json
{
  "error": "InternalError",
  "message": "input must be a 24 character hex string, 12 byte Uint8Array, or an integer"
}
```

**Root Cause**: 
The `flows.repo.ts` `findById()` method tries to convert the flowId to a MongoDB ObjectId when it doesn't find a match by `id` field. This fails for string IDs that aren't valid ObjectIds.

**Current Implementation**:
```typescript
async findById(flowId: string): Promise<Flow | null> {
  const flow = await this.collection.findOne({ id: flowId });
  if (flow) return flow as Flow;
  return this.collection.findOne({ _id: new ObjectId(flowId) }); // Fails for string IDs
}
```

**Expected Behavior**:
- Should handle both ObjectId format (24-char hex) and string IDs (like "webcam-main" or UUIDs)
- Should query `_id` field as a string when ObjectId conversion fails
- Should work for all flow IDs returned by `GET /flows`

**Impact**:
- Flow Details page cannot load flows with non-ObjectId IDs (UUIDs)
- **Flow updates cannot be performed** - `PUT /flows/:id` also uses `findById()` which fails for UUIDs
- **Description/label updates fail** - Even schema-compliant flows with UUID IDs cannot be updated
- Frontend workaround: Use `GET /flows` and filter client-side (not ideal for performance)

**Suggested Fix**:
Update `findById()` to handle both ObjectId and string IDs:
```typescript
async findById(flowId: string): Promise<Flow | null> {
  // First try to find by id field
  const flow = await this.collection.findOne({ id: flowId });
  if (flow) return flow as Flow;
  
  // Try to find by _id as ObjectId (for legacy ObjectId IDs)
  if (ObjectId.isValid(flowId) && flowId.length === 24) {
    try {
      const flowByObjectId = await this.collection.findOne({ _id: new ObjectId(flowId) });
      if (flowByObjectId) return flowByObjectId as Flow;
    } catch (e) {
      // ObjectId conversion failed, continue to string search
    }
  }
  
  // Finally, try to find by _id as string (for UUIDs and other string IDs)
  return this.collection.findOne({ _id: flowId });
}
```

**Files to Modify**:
- `monks_tams_api/src/repositories/flows.repo.ts` - `findById()` method (line 23-28)

---

### Issue #3: Flow Update Validation Too Strict - Prevents Partial Updates

**Status**: ❌ **BROKEN**

**Issue**: When calling `PUT /flows/:id` with partial updates (e.g., just `{ description: "..." }`), the API returns:
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "body": [
      {
        "instancePath": "",
        "schemaPath": "#/required",
        "keyword": "required",
        "params": {
          "missingProperty": "id"
        },
        "message": "must have required property 'id'"
      },
      {
        "instancePath": "",
        "schemaPath": "#/required",
        "params": {
          "missingProperty": "source_id"
        },
        "message": "must have required property 'source_id'"
      }
    ]
  }
}
```

**Root Cause**: 
The JSON schema validation (`flow.json` schema) requires `id` and `source_id` as required fields in the request body. The validation happens BEFORE the service method is called, so partial updates fail even though the `updateFlow` service method supports them.

**Current Implementation**:
- Schema validation (line 54 in `flows.routes.ts`): Validates against `flow.json` schema which requires `id` and `source_id`
- Service method (`flows.service.ts` line 49-74): Supports partial updates by merging with existing flow
- Problem: Validation runs first, so partial updates are rejected

**Expected Behavior**:
- Should accept partial updates (e.g., `{ description: "..." }`)
- Service method already supports this by merging with existing flow
- Schema validation should allow partial updates or use a different schema for PUT requests

**Impact**:
- Cannot update individual fields (description, label, read_only) without sending full flow object
- Frontend workaround: Must fetch full flow object and send it back with only the changed field
- Inefficient and error-prone

**Suggested Fix**:
Create a separate schema for PUT requests that allows partial updates:

1. Create `schemas/internal/flow-update.json`:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" },
    "source_id": { "type": "string", "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" },
    "label": { "type": "string" },
    "description": { "type": "string" },
    "format": { "type": "string" },
    "read_only": { "type": "boolean" },
    "tags": { "type": "object" }
  },
  "additionalProperties": true
}
```

2. Update `flows.routes.ts` to use the update schema for PUT requests:
```typescript
router.put(
  '/:id',
  ...authMiddleware,
  validator.validate({
    body: schemas['internal/flow-update.json'], // Use partial update schema
    params: schemas['internal/id-param.json'],
  }),
  controller.update || controller.create
);
```

**Alternative Fix**:
Make `id` and `source_id` optional in `flow.json` schema, but this may affect POST requests. Better to use separate schemas.

**Files to Modify**:
- `monks_tams_api/src/routes/flows.routes/flows.routes.ts` - Use different schema for PUT (line 50-58)
- Create: `monks_tams_api/schemas/internal/flow-update.json` - Partial update schem

---

## 🟡 **MEDIUM PRIORITY** - Performance/Scalability Issue

### Issue #4: Query Parameter Validation for `limit`

**Status**: ❌ **BROKEN**

**Issue**: When calling `/flows?limit=10` or `/sources?limit=10`, the API returns:
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "query": [
      {
        "instancePath": "/limit",
        "schemaPath": "#/properties/limit/type",
        "keyword": "type",
        "params": {
          "type": "integer"
        },
        "message": "must be integer"
      }
    ]
  }
}
```

**Root Cause**:
Query string parameters are always strings in HTTP, but the JSON schema validation (using AJV via `express-json-validator-middleware`) expects an integer type. The backend validator doesn't convert string query parameters to integers before validation.

**Expected Behavior**:
- Should accept `limit` as integer in query string (e.g., `?limit=10`)
- Query parameters should be parsed and converted to integers where schema expects integers
- Should work for both `/sources` and `/flows` endpoints

**Suggested Fix**:
Add a middleware to coerce query parameters before validation (convert string numbers to integers):

1. Create middleware in `monks_tams_api/src/middleware/coerce-query-params.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export function coerceQueryParams(req: Request, res: Response, next: NextFunction) {
  const query = req.query;
  
  // Coerce numeric query parameters
  if (query.limit && typeof query.limit === 'string') {
    const limit = parseInt(query.limit, 10);
    if (!isNaN(limit)) {
      query.limit = limit as any;
    }
  }
  
  if (query.page && typeof query.page === 'string') {
    const page = parseInt(query.page, 10);
    if (!isNaN(page)) {
      query.page = page as any;
    }
  }
  
  next();
}
```

2. Apply middleware before validation in routes:
```typescript
router.get(
  '/',
  coerceQueryParams,  // Add before validator
  validator.validate({
    query: schemas['internal/flows-query.json'],
  }),
  controller.list || controller.get
);
```

**Alternative Fix**:
Update JSON schemas to accept both string and integer types for `limit`:
```json
{
  "limit": {
    "type": ["string", "integer"],
    "pattern": "^\\d+$",
    "transform": ["trim"]
  }
}
```
Then add custom validation to convert string to integer.

**Files to Modify**:
- Create: `monks_tams_api/src/middleware/coerce-query-params.ts`
- `monks_tams_api/src/routes/flows.routes/flows.routes.ts` - Add middleware before validation (line 25-31)
- `monks_tams_api/src/routes/sources.routes.ts` - Add middleware before validation (line 22-28)

---

### Issue #5: Additional Query Parameters Not Allowed

**Status**: ❌ **BROKEN**

**Issue**: The API schemas for `/sources` and `/flows` have `"additionalProperties": false`, which means they reject any query parameters that aren't explicitly defined in the schema. This prevents passing custom parameters like `show_deleted` to filter deleted sources/flows.

**Error Response**:
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "query": [
      {
        "instancePath": "",
        "schemaPath": "#/additionalProperties",
        "keyword": "additionalProperties",
        "params": {
          "additionalProperty": "show_deleted"
        },
        "message": "must NOT have additional properties"
      }
    ]
  }
}
```

**Suggested Fix**:
1. **Option 1 (Recommended)**: Add `show_deleted` as a boolean query parameter to both sources and flows query schemas:
   - `monks_tams_api/schemas/internal/sources-query.json` - Add `"show_deleted": { "type": "boolean" }`
   - `monks_tams_api/schemas/internal/flows-query.json` - Add `"show_deleted": { "type": "boolean" }`

2. **Option 2**: Change `"additionalProperties": false` to `true` to allow extensibility (if appropriate):
   - `monks_tams_api/schemas/internal/sources-query.json` (line 40)
   - `monks_tams_api/schemas/internal/flows-query.json` (line 79)

**Files to Modify**:
- `monks_tams_api/schemas/internal/sources-query.json` (line 40)
- `monks_tams_api/schemas/internal/flows-query.json` (line 79)

---

## 🟢 **LOW PRIORITY** - Nice to Have

### Issue #6: Objects Endpoint Not Implemented

**Status**: ❌ **NOT IMPLEMENTED**

**Issue**: The `/objects` endpoint is mentioned in the service root (`GET /`) but is not actually implemented in the backend. Currently returns 404 (HTML error page).

**Expected Behavior**:
- Should return a list of objects: `[{ id: string, referenced_by_flows: string[], first_referenced_by_flow?: string }, ...]`
- Objects represent media files stored in the object store (MinIO/S3)
- Each object can be referenced by multiple flows through segments
- Should support query parameters for filtering and pagination

**Suggested Implementation**:
Implement the `/objects` endpoint according to BBC TAMS v6.0 specification:
- Objects should be derived from segments (each segment has an `object_id`)
- Aggregate objects from segments and include `referenced_by_flows` array
- Return objects in the format specified by `schemas/object.json`

**Files to Create**:
- `monks_tams_api/src/controllers/objects.controller.ts` - Controller for objects
- `monks_tams_api/src/services/objects.service.ts` - Service for aggregating objects from segments
- `monks_tams_api/src/repositories/objects.repo.ts` - Repository (if needed, or use segments repo)
- `monks_tams_api/src/routes/objects.routes.ts` - Routes for objects endpoint

**Files That Already Exist**:
- Schema: `monks_tams_api/schemas/object.json`
- Type definition: `monks_tams_api/src/types/object.d.ts`
- Endpoint mentioned in: `monks_tams_api/src/app.ts` (line 153) - service root response

**Implementation Approach**:
1. Query all segments from database
2. Extract unique `object_id` values from segments
3. For each object, find all flows that reference it (via segments)
4. Return objects with `referenced_by_flows` array

---

## Recommended Fix Order

1. ~~**Issue #1** (Flow ID Missing) - **FIXED** ✅~~ - Fixed in PR #7 (December 2025)
2. **Issue #2** (Flow Details Endpoint) - **CRITICAL** - Blocks Flow Details page AND flow updates
3. **Issue #3** (Flow Update Validation) - **HIGH PRIORITY** - Prevents partial updates (but Issue #2 blocks all updates anyway)
4. **Issue #4** (Query Parameter Validation) - **MEDIUM PRIORITY** - Improves performance and scalability
5. **Issue #5** (Additional Properties) - **LOW PRIORITY** - If server-side filtering is desired
6. **Issue #6** (Objects Endpoint) - **LOW PRIORITY** - If objects management is needed

---

## Testing

To verify fixes work:
```bash
# Test source with flows (should include flow IDs) - Issue #1 ✅ FIXED
curl http://localhost:3000/sources/658fea74-9e55-4ca3-bc84-73bd523c286e
# Expected: flows array should include "id" field for each flow

# Test flow details (should work for both ObjectId and UUID IDs) - Issue #2
curl http://localhost:3000/flows/webcam-main
curl http://localhost:3000/flows/cbf7a084-98f9-41b9-a66a-01eb1255b8ad

# Test flow update (should accept partial updates) - Issue #3
curl -X PUT http://localhost:3000/flows/cbf7a084-98f9-41b9-a66a-01eb1255b8ad \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'

# Test flows with limit (should accept integer) - Issue #4
curl "http://localhost:3000/flows?limit=10"

# Test sources with limit (should accept integer) - Issue #4
curl "http://localhost:3000/sources?limit=10"

# Test objects (should return list of objects) - Issue #6
curl http://localhost:3000/objects
```

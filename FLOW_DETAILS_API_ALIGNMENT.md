# FlowDetails API Alignment

## Summary
Updated `FlowDetails.tsx` to match the actual data structure returned by the `@monks_tams_api/` service. Removed fields that don't exist in the API and corrected the structure of nested fields.

## Key Changes

### 1. Flow Interface Updated
**Before**: Fields were at top level (e.g., `frame_width`, `frame_height`, `sample_rate`)
**After**: Video/audio fields are nested in `essence_parameters` object

**Removed Fields** (not in API):
- `status` - No status field in flow-core.json
- `collection_id` / `collection_label` - Not in API
- `storage` object - Not in API (only `total_segments` and `total_duration` from controller)
- `deleted`, `deleted_at`, `deleted_by` - Soft delete fields not in API
- `color_sampling`, `color_space`, `color_primaries` - Not in API (use `colorspace` and `transfer_characteristic` instead)
- `updated` - API uses `metadata_updated` and `segments_updated` instead

**Corrected Fields**:
- `frame_width`, `frame_height` → `essence_parameters.frame_width`, `essence_parameters.frame_height`
- `frame_rate` → `essence_parameters.frame_rate` (object with `numerator`/`denominator`, not string)
- `interlace_mode` → `essence_parameters.interlace_mode`
- `colorspace` → `essence_parameters.colorspace` (not `color_space`)
- `transfer_characteristic` → `essence_parameters.transfer_characteristic` (not `transfer_characteristics`)
- `sample_rate`, `channels`, `bit_depth` → `essence_parameters.sample_rate`, etc. (for audio)
- `updated` → `metadata_updated` and `segments_updated`

**Available Fields** (from flow-core.json):
- `id`, `source_id`, `label`, `description`
- `created_by`, `updated_by`
- `created`, `metadata_updated`, `segments_updated`
- `tags` (can be arrays or strings)
- `read_only`, `codec`, `container`
- `avg_bit_rate`, `max_bit_rate` (in 1000 bits/second)
- `flow_collection`, `collected_by`
- `total_segments`, `total_duration` (added by controller)

### 2. Technical Details Tab
- **Video fields**: Now correctly reads from `flow.essence_parameters.frame_width`, etc.
- **Audio fields**: Now correctly reads from `flow.essence_parameters.sample_rate`, etc.
- **Frame rate**: Displays as "25/1 fps" from `{numerator: 25, denominator: 1}` object
- **Removed**: `color_sampling`, `color_space`, `color_primaries` (don't exist)
- **Added**: Conditional rendering - only shows video/audio specs if format matches and essence_parameters exist

### 3. Overview Tab
- **Date fields**: Changed from `flow.updated` to `flow.metadata_updated`
- **Collection Management**: Updated to use `flow.flow_collection` (array) and `flow.collected_by` (read-only array)
- **Removed**: `collection_id` and `collection_label` references
- **Optional fields**: Added null checks for `created_by`, `updated_by`, `created`, `codec`

### 4. Analytics Tab
- **Removed**: Calls to non-existent `/api/analytics/*` endpoints
- **Updated**: Now shows only data available from the flow itself:
  - `total_segments` (from controller)
  - `total_duration` (from controller)
  - `avg_bit_rate` (from flow metadata)
  - `max_bit_rate` (from flow metadata)
- **Added**: Alert explaining that analytics endpoints don't exist in the API

### 5. Status Field Removed
- Removed all references to `flow.status`
- Replaced status badges with `read_only` badge where appropriate
- Removed status field from edit modal

### 6. Mock Data Updated
- Updated `createMockFlowData()` to match actual API structure
- Uses `essence_parameters` nested structure
- Uses `metadata_updated` instead of `updated`
- Removed non-existent fields

## API Structure Reference

### Video Flow Response Structure
```json
{
  "id": "uuid",
  "source_id": "uuid",
  "format": "urn:x-nmos:format:video",
  "codec": "video/h264",
  "label": "Flow Label",
  "description": "Flow Description",
  "created_by": "user",
  "updated_by": "user",
  "created": "2024-01-01T00:00:00Z",
  "metadata_updated": "2024-01-01T00:00:00Z",
  "segments_updated": "2024-01-01T00:00:00Z",
  "tags": { "key": "value" },
  "read_only": false,
  "essence_parameters": {
    "frame_width": 1920,
    "frame_height": 1080,
    "frame_rate": { "numerator": 25, "denominator": 1 },
    "interlace_mode": "progressive",
    "colorspace": "BT709",
    "transfer_characteristic": "SDR",
    "bit_depth": 8
  },
  "container": "video/mp4",
  "avg_bit_rate": 5000000,
  "max_bit_rate": 8000000,
  "total_segments": 15,
  "total_duration": 150
}
```

### Audio Flow Response Structure
```json
{
  "id": "uuid",
  "source_id": "uuid",
  "format": "urn:x-nmos:format:audio",
  "codec": "audio/aac",
  "essence_parameters": {
    "sample_rate": 44100,
    "channels": 2,
    "bit_depth": 16
  },
  "container": "audio/mp4",
  "avg_bit_rate": 128000,
  "max_bit_rate": 192000
}
```

## Verification
All displayed fields now match the actual API response structure from `GET /flows/:id`. The page will correctly display:
- ✅ Flow core fields (id, source_id, label, description, etc.)
- ✅ Video essence parameters (nested in essence_parameters)
- ✅ Audio essence parameters (nested in essence_parameters)
- ✅ Flow properties (codec, container, bit rates)
- ✅ Segment statistics (total_segments, total_duration from controller)
- ✅ Flow collection data (flow_collection, collected_by)
- ✅ QC markers (from `/api/v1/flows/:flowId/qc-markers`)

## Removed/Not Available
- ❌ `status` field
- ❌ `collection_id` / `collection_label`
- ❌ `storage` object
- ❌ `deleted`, `deleted_at`, `deleted_by`
- ❌ `color_sampling`, `color_space`, `color_primaries` (top-level)
- ❌ Analytics endpoints (`/api/analytics/*`)
- ❌ `updated` field (use `metadata_updated` instead)


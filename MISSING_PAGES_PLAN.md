# Missing Pages Implementation Plan

## Analysis Summary

Based on the `monks_tams_api` API documentation and current frontend implementation, this document tracks what's still missing or needs work.

**Last Updated:** After reviewing backend API availability and frontend implementation status.

---

## ❌ **BLOCKED** - Waiting for Backend

### Objects Page (`/objects`) - Frontend Ready, Backend Missing
**Status:** Frontend page exists at `src/pages/Objects.tsx` but **backend endpoint is NOT implemented**

**Frontend Implementation:**
- ✅ Page fully implemented with:
  - List view with pagination
  - Error handling for missing endpoint
  - Placeholder UI ready for data
  - Links to flows
  - Storage information display
- ✅ Navigation link exists in main menu
- ✅ Route configured in `App.tsx`

**Backend Status:**
- ❌ `GET /objects` endpoint **NOT IMPLEMENTED** in backend
- Documented in `BACKEND_FIXES_NEEDED.md` Issue #5
- Backend only lists `/objects` in service paths (`app.ts` line 153) but has no actual route handler
- No route handler exists in `monks_tams_api/src/routes/`

**Action Required:**
- Backend team must implement `GET /objects` endpoint
- See `BACKEND_FIXES_NEEDED.md` Issue #5 for implementation details
- Once backend is ready, frontend page will work immediately

---

## 📋 **OPTIONAL ENHANCEMENTS**

### Service Page - Storage Backends Display (Optional)
**Status:** Backend endpoint exists, frontend could better utilize it

**Available Backend Endpoint:**
- ✅ `GET /service/storage-backends` - Implemented in `app.ts` line 174
- Returns storage backend configuration (type, id, etc.)

**Enhancement Option:**
- Add storage backends section to Service page (`src/pages/Service.tsx`)
- Display storage backend info from `/service/storage-backends` endpoint
- Show storage type, configuration, status

**Effort:** Low (1-2 hours - endpoint exists, just needs UI integration)
**Priority:** Low (nice to have, not critical)
**Value:** Medium (improves service information display)

---

## 📊 **Summary**

| Item | Frontend | Backend | Status |
|------|----------|---------|--------|
| Objects Page | ✅ Complete | ❌ Missing | **Blocked - Waiting for Backend** |
| Service Enhancement | ⚠️ Optional | ✅ Available | **Optional Enhancement** |

**Blocked Items:** 1 (Objects - waiting for backend)
**Optional Enhancements:** 1 (Service page storage backends display)

---

## 🔍 **Technical Notes**

### Objects Endpoint
- Backend lists `/objects` in service paths but has no route handler
- Frontend page handles this gracefully with error message
- See `BACKEND_FIXES_NEEDED.md` Issue #5 for backend implementation details

### Service Storage Backends
- Endpoint `/service/storage-backends` is implemented and returns storage configuration
- Current Service page doesn't display this information
- Enhancement would improve service information visibility


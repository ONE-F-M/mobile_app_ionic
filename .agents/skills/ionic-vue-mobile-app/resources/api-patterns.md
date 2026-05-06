# API Patterns — ERPNext Integration

## HTTP Service (`src/api/http.service.ts`)

All API calls go through `httpService`, which wraps `CapacitorHttp` for native HTTP on mobile.

### URL Construction

```
{VITE_BASE_API_URL}{VITE_API_PREFIX}{endpoint}
```

Example with defaults:
```
https://staging.one-fm.com/api/method/one_fm.api.v1.v1.authentication.user_login
```

### Authentication

The `Authorization` header is automatically injected from `useUserStore().token`. No manual token management needed in API modules.

### Request Pattern

```typescript
import { httpService } from "./http.service";

// Define payload types
interface MyPayload {
  employee_id: string;
  some_field: string;
}

// Export named functions
export const getMyData = async (payload: MyPayload) =>
  await httpService.post(`v1.module.endpoint_name`, {
    data: payload,
  });

export const updateMyData = async (payload: MyPayload) =>
  await httpService.put(`v1.module.update_endpoint`, {
    data: payload,
  });

// Default export as object
export default {
  getMyData,
  updateMyData,
};
```

### Key Rules

1. **Method:** POST for write operations, GET for read-only queries (e.g., `leave.balance`, `leave.types`, `shifts.getShiftsList`). Older modules use POST for everything.
2. **Data format:** POST requests pass `data` in the options object (URL-encoded by default). GET requests pass `params` in the options object.
3. **GET requests:** The `Content-Type` header is automatically removed for GET requests
4. **Error handling:** `httpService` throws on `status >= 400`. Callers should catch and use `showErrorToast`
5. **401 auto-logout:** On a 401 response, `httpService` automatically clears the user session via `useUserStore().logout()` and redirects to `/employee-id`

### Response Format

ERPNext API responses follow this structure:
```json
{
  "message": {
    "status": 1,
    "data": { ... },
    "error": "Error message if any"
  }
}
```

Access data via `response.data.message.data`.

## Existing API Modules

| Module | File | Endpoints |
|--------|------|-----------|
| Authentication | `authentication.ts` | `user_login`, `enrollment_status`, `forgot_password`, `verify_otp`, `change_password` |
| Check-in | `checkin.ts` | `get_site_location`, `checkin_list`, `verify_checkin_checkout` |
| Face Recognition | `face_recognition.ts` | Face enrollment and verification |
| Enrollment | `enrollment.ts` | Employee face enrollment flow |
| Leave | `leave.ts` | `leave_application_list`, `create_new_leave_application`, `get_leave_balance` (GET), `get_leave_types` (GET), `get_leave_detail` (GET), `leave_approver_action`, `get_employees_list` |
| Profile | `profile.ts` | User profile data |
| Shifts | `shifts.ts` | `shift_request_list` (GET), `create_shift_request`, `get_shift_request_detail` (GET), `shift_request_action` |
| Configuration | `configuration.ts` | App configuration |

## Adding a New API Module

1. Create `src/api/<module>.ts`
2. Import `httpService`
3. Define TypeScript interfaces for payloads
4. Export named async functions
5. Export default object with all functions
6. Register in `src/api/index.ts`:

```typescript
// src/api/index.ts
import auth from "./authentication";
import face_recognition from "./face_recognition";
import myModule from "./my_module";

export { auth, face_recognition, myModule };
export default { auth, face_recognition, myModule };
```



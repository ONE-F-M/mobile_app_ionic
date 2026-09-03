---
name: ionic-vue-mobile-app
description: >
  Specialist skill for working on the ONE-F-M Ionic Vue.js mobile app (mobile_app_ionic).
  Use this skill when the user asks to create, modify, debug, or review code in an Ionic Vue 3
  mobile app with Capacitor, Pinia state management, ERPNext backend API,
  Firebase push notifications, or i18n (English/Arabic). Covers views, components, stores,
  API modules, routing, Capacitor plugins, and build/deploy for Android and iOS.
---

# ONE-F-M Ionic Vue Mobile App — Agent Skill

## When to Use This Skill

Activate this skill when the user's request involves:
- Creating or modifying Vue components, views, pages, or layouts for the mobile app
- Working with the ERPNext API layer (`src/api/`)
- Managing state with Pinia stores (`src/store/`)
- Adding or configuring Capacitor plugins (camera, geolocation, push notifications, etc.)
- Routing with `@ionic/vue-router`
- Internationalization (i18n) for English and Arabic (RTL)

- Building or deploying for Android or iOS

## How to Use This Skill

When this skill is activated, read the following resource files for detailed guidance:

1. **[architecture.md](resources/architecture.md)** — Directory tree, module structure, and dependencies
2. **[conventions.md](resources/conventions.md)** — Code style, naming, and patterns used in this codebase
3. **[api-patterns.md](resources/api-patterns.md)** — ERPNext API integration via `httpService`

---

## Project Overview

**App:** ONE-F-M Mobile App (One Facilities Management)
**Repo:** `mobile_app_ionic`
**Stack:** Ionic 7 + Vue 3 + Capacitor 6 + Vite 5
**Backend:** ERPNext via `one_fm.api.v1` REST API
**Platforms:** Android, iOS, PWA

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@ionic/vue` + `@ionic/vue-router` | Mobile UI framework and routing |
| `@capacitor/core` + platform packages | Native device APIs |
| `vue` 3.3+ | Reactive UI framework |
| `pinia` + `pinia-plugin-persistedstate` | State management with persistence |
| `vue-i18n` 9 | Internationalization (en, ar) |
| `firebase` | Push notification token management |
| `@mdi/js` | Tree-shakeable Material Design Icons (replaced `@mdi/font` webfont) |
| `dayjs` | Date manipulation |
| `v-calendar` | Calendar component (locally imported, not globally registered) |

---

## Architecture Rules

### 1. File Organization

All source code lives under `src/` with the `@` alias:

```
src/
├── api/          # TypeScript API modules (one per domain)
├── components/   # Reusable Vue components (feature-grouped folders)
├── composable/   # Vue 3 composables (use* naming)
├── layouts/      # Page layout wrappers
├── locale/       # i18n translation JS files (en, ar)
├── middleware/    # Route guards
├── plugins/      # Vue plugin setup (pinia, i18n)
├── router/       # Route definitions
├── services/     # Firebase, notifications, service worker
├── store/        # Pinia stores (one per domain)
├── theme/        # CSS variables, fonts, global styles
├── types/        # TypeScript interfaces and enums
├── views/        # Page-level Vue components (feature-grouped folders)
├── App.vue       # Root component
└── main.js       # App bootstrap
```

### 2. HTTP Layer

**All API calls use `CapacitorHttp` via `src/api/http.service.ts`**, not browser `fetch` or `axios`.

```typescript
import { httpService } from "./http.service";

export const getItems = async (payload: MyPayload) =>
  await httpService.post(`v1.module.endpoint`, { data: payload });
```

- Base URL: `VITE_BASE_API_URL` (e.g., `https://staging.one-fm.com`)
- API prefix: `VITE_API_PREFIX` (default: `/api/method/one_fm.api.v1.`)
- Auth token injected automatically from `useUserStore().token`
- **401 auto-logout**: On 401 response, the service auto-clears the user session and redirects to `/employee-id`

### 3. State Management

Pinia stores with `persist: true`. Stores also handle **data prefetching** with caching:

```javascript
import { defineStore } from "pinia";

export const useMyStore = defineStore("my-store", {
  state: () => ({
    items: [],
    loading: false,
    // Cached data pattern
    cachedList: null,
    lastFetch: 0,
  }),
  persist: true,
  getters: {
    // Computed properties derived from state
    hasItems: (state) => state.items.length > 0,
  },
  actions: {
    setItems(items) { this.items = items; },
    async prefetchData(employeeId) {
      // Background prefetch with silent error handling
      try {
        const { data } = await api.getList({ employee_id: employeeId });
        this.cachedList = data.data;
        this.lastFetch = Date.now();
      } catch (error) {
        console.warn("Prefetch failed:", error);
      }
    },
    reset() {
      this.items = [];
      this.cachedList = null;
      this.lastFetch = 0;
    },
  },
});

### 4. Routing

Uses `@ionic/vue-router` with `createWebHistory`. Authentication is handled via a **global navigation guard** + route `meta` fields:

```javascript
// Route definition — use meta.requiresAuth instead of per-route beforeEnter
{
  path: "/my-feature",
  component: () => import("@/views/myfeature/MyFeaturePage.vue"),
  meta: { requiresAuth: true },
}
```

The global `router.beforeEach` guard in `src/router/index.js` checks `to.meta.requiresAuth` and redirects unauthenticated users. Public routes (login, language select) use `beforeEnter: isLoggedInForbidden` to redirect already-logged-in users to `/home`.

### 5. UI Component Strategy

- **Ionic components** (`<ion-*>`): Use for all mobile UI — pages, navigation, tabs, forms, inputs, buttons, action sheets, modals, gestures, haptics, pull-to-refresh
- **Custom components**: Place in `src/components/<feature>/`

### 6. Internationalization

```javascript
import { useI18n } from "vue-i18n";
const { t } = useI18n();
// In template: {{ t("module.key") }}
```

Translations are NOT single files. Each language keeps per-module JS files under `src/locale/en/<module>/...` and `src/locale/ar/<module>/...` (e.g. `src/locale/en/user/leaves.js` and `src/locale/ar/user/leaves.js`). Each language's `index.js` barrel (`src/locale/en/index.js`, `src/locale/ar/index.js`, plus per-area barrels like `src/locale/en/user/index.js`) imports and merges those per-module files into the object handed to `vue-i18n`. Every key added to one language's module file must have a matching key added to the corresponding module file in the other language. The app supports RTL layout via the `rtl` state in the lang store.

### 7. Composables

Follow the `use*` naming convention. Always return an object:

```javascript
export const useMyHelper = () => {
  const doSomething = () => { /* ... */ };
  return { doSomething };
};
```

---

---

## Common Tasks

### Adding a New Feature Module

1. **API module**: Create `src/api/<feature>.ts` — define typed functions using `httpService`
2. **Types**: Add interfaces to `src/types/api.ts` or create `src/types/<feature>.ts`
3. **Store**: Create `src/store/<feature>.js` — Pinia store with `persist: true`
4. **Views**: Create `src/views/<feature>/` folder with `<Feature>Page.vue`
5. **Components**: Create `src/components/<feature>/` for reusable sub-components
6. **Route**: Add to `src/router/index.js` with `meta: { requiresAuth: true }`
7. **i18n**: Create (or extend) a per-module JS file for the feature under `src/locale/en/<feature>...` and the matching file under `src/locale/ar/<feature>...`, then wire each into that language's `index.js` barrel. Every new key must be added in BOTH English and Arabic — a key present in only one language renders as its own key name.
8. **Export**: Add API module to `src/api/index.ts`

### Adding a Capacitor Plugin

1. Install: `yarn add @capacitor/<plugin-name>`
2. Configure in `capacitor.config.ts` if needed
3. Add native permissions in `android/app/src/main/AndroidManifest.xml` and `ios/App/App/Info.plist`
4. Sync: `npx cap sync`
5. Create a wrapper composable in `src/composable/use<Plugin>.ts`

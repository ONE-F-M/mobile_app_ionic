# ONE-F-M Mobile App — Agent Instructions

## Project Identity

This is the **ONE-F-M Mobile App** — a facilities management mobile application built with **Ionic Vue 3 + Capacitor 6**, targeting **Android** and **iOS**. It connects to an **ERPNext** backend via the `one_fm.api.v1` REST API.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | Ionic 7 + Vue 3 |
| UI Components | Ionic (`<ion-*>`) |
| State Management | Pinia with persisted state |
| HTTP | CapacitorHttp (native) via `src/api/http.service.ts` |
| Routing | `@ionic/vue-router` with auth guards |
| i18n | vue-i18n 9 (English + Arabic/RTL) |
| Push Notifications | Firebase Cloud Messaging + Capacitor Push |
| Build | Vite 5 |
| Native | Capacitor 6 (Camera, Geolocation, Keyboard, Haptics, etc.) |
| Testing | Vitest (unit) + Cypress (e2e) |
| Backend | ERPNext (`one_fm.api.v1`) |

## Key Conventions

- **Imports**: Always use `@/` alias (resolves to `src/`)
- **API calls**: Use `httpService` from `src/api/http.service.ts` — NOT `fetch` or `axios`
- **Stores**: Pinia with `persist: true`, `use<Name>Store` naming
- **Views**: Feature-grouped in `src/views/<feature>/`, PascalCase with `Page` suffix
- **Components**: Feature-grouped in `src/components/<feature>/`
- **New UI**: Use Ionic components (`<ion-*>`) for all mobile UI

## Build & Deploy

- **Dev**: `yarn dev` (Vite dev server with HMR)
- **Build**: `yarn build` → `npx cap sync` → open in Android Studio / Xcode
- **Shortcut**: `yarn sync` (build + cap sync)
- **Test**: `yarn test:unit` (Vitest) · `yarn test:e2e` (Cypress) · `yarn lint` (ESLint)

## Code Style

- Vue SFCs with `<script setup>` (Composition API)
- TypeScript for API modules, types, middleware
- JavaScript for stores, router, views, plugins
- SCSS for component styles, CSS custom properties for Ionic theming
- kebab-case routes, PascalCase components, camelCase variables

## Important Paths

| Path | Purpose |
|------|---------|
| `src/api/` | ERPNext API modules (TypeScript) |
| `src/store/` | Pinia stores |
| `src/views/` | Page components |
| `src/components/` | Reusable components |
| `src/composable/` | Vue composables |
| `src/router/index.js` | Route definitions |
| `src/locale/` | i18n JSON files (en, ar) |
| `src/services/` | Firebase, notifications |
| `src/middleware/` | Route guards |
| `capacitor.config.ts` | Capacitor native config |

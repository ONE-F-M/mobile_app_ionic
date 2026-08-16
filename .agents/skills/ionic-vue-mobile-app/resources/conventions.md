# Coding Conventions

## Vue Single File Component (SFC) Structure

Use `<script setup>` syntax (Composition API). Order: `<template>` → `<script setup>` → `<style>`.

```vue
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("module.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- content -->
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { useCustomToast } from "@/composable/toast";

const { t } = useI18n();
const { showErrorToast, showSuccessToast } = useCustomToast();

// reactive state
const items = ref([]);

// lifecycle
onMounted(async () => {
  // fetch data
});
</script>

<style scoped lang="scss">
/* component styles */
</style>
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Vue files (views) | PascalCase + `Page` suffix | `LeaveDetailsPage.vue` |
| Vue files (components) | PascalCase | `InputBox.vue`, `Header.vue` |
| Pinia stores | `use<Name>Store` | `useAuthStore`, `useUserStore` |
| Composables | `use<Name>` | `useCustomToast`, `useDateHelper` |
| API modules | lowercase snake_case `.ts` | `authentication.ts`, `face_recognition.ts` |
| Store files | lowercase `.js` | `auth.js`, `user.js` |
| Type files | lowercase `.ts` | `api.ts`, `enums.ts` |
| Route paths | kebab-case | `/checkin/geolocation`, `/leaves/add` |
| i18n keys | dot-notation `module.subkey` | `utils.toast.error`, `leaves.title` |
| CSS classes | kebab-case | `toast-error`, `toast-success` |

## Import Patterns

Always use the `@/` alias (resolves to `src/`):

```javascript
import { useUserStore } from "@/store/user.js";
import { httpService } from "@/api/http.service";
import { useCustomToast } from "@/composable/toast";
```

## Pinia Store Pattern

```javascript
import { defineStore } from "pinia";

export const useFeatureStore = defineStore("feature", {
  state: () => ({
    items: [],
    selectedItem: null,
    loading: false,
  }),
  persist: true,
  actions: {
    setItems(items) {
      this.items = items;
    },
    setSelectedItem(item) {
      this.selectedItem = item;
    },
    reset() {
      this.items = [];
      this.selectedItem = null;
      this.loading = false;
    },
  },
});
```

Key rules:
- Always export with `use<Name>Store` naming
- Always use `persist: true` for state survival across app restarts
- Use simple setter actions (no getters used in current codebase)
- Include a `reset()` action to clear state on logout

## Composable Pattern

```javascript
export const useMyHelper = () => {
  // private state / imports
  const { t } = useI18n();

  const helperFunction = async (param) => {
    // logic
  };

  // always return an object
  return {
    helperFunction,
  };
};
```

## TypeScript vs JavaScript Usage

| File type | Language | Notes |
|-----------|----------|-------|
| API modules | TypeScript (`.ts`) | Typed payloads and return types |
| Types/enums | TypeScript (`.ts`) | Shared interfaces |
| Middleware | TypeScript (`.ts`) | Route guard functions |
| Some composables | TypeScript (`.ts`) | `useDateHelper.ts`, `useDisplayImage.ts` |
| Stores | JavaScript (`.js`) | State definitions |
| Router | JavaScript (`.js`) | Route config |
| Views/Components | Vue SFC (`.vue`) | `<script setup>` (no lang="ts") |
| Plugins | JavaScript (`.js`) | i18n and pinia setup |

**Rule:** New API modules, types, and middleware should use TypeScript. New stores and views follow the existing JS convention unless the team decides to migrate.

## Component Organization

Components are organized by feature domain:

```
components/
├── auth/        # Login form, OTP input, etc.
├── base/        # Shared/generic components
├── checkin/     # Check-in UI components
├── icon/        # Custom icon components
├── leaves/      # Leave-related components
├── service/     # Service page components
├── Header.vue   # Global header
└── InputBox.vue  # Reusable input wrapper
```

New feature components go in `components/<feature-name>/`.

## Error Handling

Use the `useCustomToast` composable for user-facing errors:

```javascript
const { showErrorToast, showSuccessToast } = useCustomToast();

try {
  const response = await apiCall(payload);
  showSuccessToast("Operation completed");
} catch (error) {
  showErrorToast(null, null, error.status);
}
```

## RTL Support

The app supports Arabic (RTL). The `App.vue` sets `dir="rtl"` based on the lang store. Ensure:
- Use logical CSS properties (`margin-inline-start` instead of `margin-left`)
- Test layout with both `en` and `ar` languages
- The `rtl` class is added to `<ion-app>` when active

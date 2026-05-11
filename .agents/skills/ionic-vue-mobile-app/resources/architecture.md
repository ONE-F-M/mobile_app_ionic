# Architecture Reference

## Directory Tree

```
mobile_app_ionic/
├── .github/                    # GitHub workflows
├── .vscode/                    # VS Code settings
├── android/                    # Android native project (Capacitor-managed)
├── ios/                        # iOS native project (Capacitor-managed)
├── public/                     # Static assets served as-is
├── src/
│   ├── api/                    # ERPNext API integration layer
│   │   ├── http.service.ts     # Core HTTP wrapper using CapacitorHttp
│   │   ├── index.ts            # API barrel export
│   │   ├── authentication.ts   # Login, registration, password reset
│   │   ├── checkin.ts          # Employee check-in/check-out
│   │   ├── configuration.ts    # App configuration endpoints
│   │   ├── enrollment.ts       # Face enrollment
│   │   ├── face_recognition.ts # Face recognition verification
│   │   ├── leave.ts            # Leave application CRUD
│   │   ├── profile.ts          # User profile endpoints
│   │   ├── shifts.ts           # Shift request CRUD
│   │   └── utils.ts            # Shared API utilities
│   │
│   ├── components/             # Reusable UI components
│   │   ├── auth/               # Authentication-related components
│   │   ├── base/               # Base/shared components
│   │   ├── checkin/            # Check-in feature components
│   │   ├── icon/               # Custom icon components (MdiIcon.vue for tree-shakeable @mdi/js)
│   │   ├── leaves/             # Leave-related components
│   │   ├── service/            # Service-related components
│   │   ├── Header.vue          # Shared header component
│   │   └── InputBox.vue        # Shared input component
│   │
│   ├── composable/             # Vue 3 composable functions
│   │   ├── toast.js            # Toast notification helpers
│   │   ├── useDateHelper.ts    # Date formatting utilities
│   │   ├── useDisplayImage.ts  # Image display/conversion
│   │   └── useNotification.js  # Push notification helpers
│   │
│   ├── layouts/                # Page layout wrappers
│   │
│   ├── locale/                 # i18n translation files
│   │   ├── en.json             # English translations
│   │   └── ar.json             # Arabic translations (RTL)
│   │
│   ├── middleware/             # Route navigation guards
│   │   └── loggedIn.ts         # Auth guards (isAuthenticated, isLoggedInForbidden)
│   │
│   ├── plugins/                # Vue plugin configurations
│   │   ├── i18n.js             # vue-i18n setup
│   │   └── pinia.js            # Pinia + persistence plugin setup
│   │
│   ├── router/                 # Application routing
│   │   └── index.js            # Route definitions + global beforeEach auth guard
│   │
│   ├── services/               # External service integrations
│   │   ├── firebase.js         # Firebase initialization
│   │   ├── notifications.js    # Push notification handling
│   │   └── serviceWorker.js    # PWA service worker registration
│   │
│   ├── store/                  # Pinia state stores
│   │   ├── auth.js             # Auth flow state (employeeId, OTP, etc.)
│   │   ├── checkin.js          # Check-in state
│   │   ├── lang.js             # Language/RTL preference
│   │   ├── registration.js     # Registration flow state
│   │   └── user.js             # User session, token, and data prefetch caching
│   │
│   ├── theme/                  # Styling
│   │   ├── variables.css       # Ionic CSS custom properties
│   │   ├── fonts.scss          # Font definitions
│   │   └── global.scss         # Global styles
│   │
│   ├── types/                  # TypeScript types
│   │   ├── api.ts              # API payload types (ApiUrlParams, LocationPayload)
│   │   └── enums.ts            # Enums (LEAVE_STATUS, etc.)
│   │
│   ├── views/                  # Page-level components
│   │   ├── authentication/     # Login, OTP, set-password pages
│   │   ├── checkin/            # Check-in list, geolocation pages
│   │   ├── enrollment/        # Face enrollment flow
│   │   ├── hr/                 # HR-related pages
│   │   ├── leaves/             # Leave list, create, details pages
│   │   ├── legal/penalty/      # Legal penalty pages
│   │   ├── shifts/             # Shift request list, create, details pages
│   │   ├── user/               # Dashboard, profile, notifications, tabs
│   │   ├── HomePage.vue        # Main home page
│   │   └── SelectLanguage.vue  # Language selection page
│   │
│   ├── App.vue                 # Root component (RTL support, platform detection)
│   └── main.js                 # Bootstrap: plugins, router, i18n, Firebase
│
├── capacitor.config.ts         # Capacitor configuration
├── vite.config.ts              # Vite build configuration
├── package.json                # Dependencies and scripts
├── ionic.config.json           # Ionic CLI config
└── index.html                  # HTML entry point
```

## Module Dependency Flow

```
Views → Components → Composables
  ↓         ↓            ↓
Stores ← ← ← ← ← ← ← ←
  ↓
API Modules → http.service.ts → CapacitorHttp → ERPNext
  ↓
Types (shared interfaces/enums)
```

- **Views** import stores, API modules, and components
- **Components** can import composables and stores
- **Stores** import API modules and other stores
- **API modules** only import `http.service.ts` and types
- **http.service.ts** imports `useUserStore` for auth token injection

## Feature Modules

| Feature | Views | Components | Store | API | Routes |
|---------|-------|------------|-------|-----|--------|
| Authentication | `views/authentication/` (4 pages) | `components/auth/` | `auth.js` | `authentication.ts` | `/login`, `/employee-id`, `/register/*` |
| Enrollment | `views/enrollment/` (2 pages) | — | `registration.js` | `enrollment.ts`, `face_recognition.ts` | `/enrollment`, `/enroll-*` |
| Check-in | `views/checkin/` (2 pages) | `components/checkin/` | `checkin.js` | `checkin.ts` | `/checkin`, `/checkin/geolocation` |
| Leaves | `views/leaves/` (3 pages) | `components/leaves/` | — | `leave.ts` | `/leaves`, `/leaves/add`, `/leaves/:id` |
| Shifts | `views/shifts/` (3 pages) | — | — | `shifts.ts` | `/shifts`, `/shifts/add`, `/shifts/:id` |
| User/Profile | `views/user/` (4 tabs) | — | `user.js` | `profile.ts` | `/dashboard`, `/service`, `/notification`, `/profile` |
| HR | `views/hr/` | — | — | — | — |
| Legal/Penalty | `views/legal/penalty/` | — | — | — | — |

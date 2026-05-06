---
description: Start the Vite development server for the mobile app
---

# Start Dev Server

## Prerequisites
- Ensure dependencies are installed: `yarn install`
- Copy `.env.example` to `.env` and configure:
  - `VITE_BASE_API_URL` — ERPNext server URL (e.g., `https://staging.one-fm.com`)
  - `VITE_API_PREFIX` — API prefix (default: `/api/method/one_fm.api.v1.`)
  - `VITE_BASE_URL` — Base URL path (default: `/`)

## Steps

1. Start the development server:
// turbo
```
yarn dev
```

2. Access the app in browser at the URL shown in terminal output (default: `http://localhost:5173`)

## Notes
- The `yarn dev` command runs `vite --host` which exposes the server on all network interfaces
- Hot Module Replacement (HMR) is enabled for instant updates
- The dev server does NOT include PWA support (PWA only enabled in production builds)
- For testing on a physical device, use the `--host` flag to access via your machine's IP address

---
description: Run unit tests (Vitest) and end-to-end tests (Cypress) for the mobile app
---

# Run Tests

## Unit Tests (Vitest)

1. Run all unit tests:
// turbo
```
yarn test:unit
```

## End-to-End Tests (Cypress)

1. Ensure the dev server is running first (see `/dev-server` workflow)

2. Run Cypress tests headlessly:
// turbo
```
yarn test:e2e
```

3. Or open the Cypress UI for interactive testing:
```
npx cypress open
```

## Linting

1. Run ESLint:
// turbo
```
yarn lint
```

## Notes
- Unit tests use Vitest with jsdom environment (configured in `vite.config.ts`)
- E2E tests use Cypress (config in `cypress.config.ts`)
- ESLint is configured with Vue and Prettier plugins

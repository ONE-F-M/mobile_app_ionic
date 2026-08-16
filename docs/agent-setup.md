# ONE-F-M Mobile App — Antigravity Agent Setup

Custom [Google Antigravity](https://antigravity.google/docs) agent configuration for the **ONE-F-M Ionic Vue 3 + Capacitor 6** mobile app (`mobile_app_ionic`). Copy these files into the mobile-app workspace to give the agent deep knowledge of the codebase.

> **Docs**: [https://antigravity.google/docs/rules-workflows](https://antigravity.google/docs/rules-workflows)

---

## Directory Structure

Antigravity supports **workspace-level** and **global** configuration. This agent package provides workspace-level files only:

| Path | Scope | Purpose |
|---|---|---|
| `<workspace-root>/GEMINI.md` | Workspace | Always-loaded agent context (tech stack, conventions, important paths) |
| `<workspace-root>/.agents/skills/<skill>/` | Workspace | Skill modules (read on-demand per task) |
| `<workspace-root>/.agents/workflows/<name>.md` | Workspace | Workflow definitions (invoked via `/slash-command`) |

---

## Setup

1. **GEMINI.md** — Copy `GEMINI.md` to the root of the mobile-app workspace:

   ```
   <workspace-root>/
   └── GEMINI.md
   ```

   This file is loaded automatically on every conversation and provides the agent with the project identity, tech stack, key conventions, build commands, code style, and important paths.

2. **Skills directory** — Copy the `.agents/skills/` folder to the workspace root:

   ```
   <workspace-root>/
   └── .agents/
       └── skills/
           └── ionic-vue-mobile-app/
               ├── SKILL.md
               └── resources/
                   ├── architecture.md
                   ├── conventions.md
                   ├── api-patterns.md
                   └── frappe-ui-guide.md
   ```

   Each skill folder must contain a `SKILL.md` with YAML frontmatter (`name`, `description`) and markdown instructions. The `resources/` sub-folder holds detailed reference docs loaded on demand.

3. **Workflows directory** — Copy the `.agents/workflows/` folder to the workspace root:

   ```
   <workspace-root>/
   └── .agents/
       └── workflows/
           ├── build-mobile.md
           ├── dev-server.md
           ├── run-tests.md
           └── add-capacitor-plugin.md
   ```

   Each workflow file is a markdown file with YAML frontmatter (`description`) followed by step-by-step instructions. Workflow files are limited to **12,000 characters** each.

---

## Available Skills

| Skill | Description |
|---|---|
| `ionic-vue-mobile-app` | Specialist skill for the ONE-F-M Ionic Vue 3 mobile app — covers views, components, stores, API modules, routing, Capacitor plugins, i18n, and build/deploy for Android and iOS |

### Skill Resources

| Resource | Purpose |
|---|---|
| `architecture.md` | Full directory tree, module structure, and dependency flow |
| `conventions.md` | Vue SFC patterns, naming conventions, import patterns, store/composable patterns |
| `api-patterns.md` | `httpService` usage, ERPNext response format, error handling |
| `frappe-ui-guide.md` | Frappe UI vs Ionic decision matrix, component reference, migration strategy |

---

## Available Workflows

Workflows are invoked via `/workflow-name` slash commands in the agent chat.

| Workflow | Slash Command | Description |
|---|---|---|
| `build-mobile` | `/build-mobile` | Build web assets → sync with Capacitor → open in native IDE |
| `dev-server` | `/dev-server` | Start the Vite dev server with HMR |
| `run-tests` | `/run-tests` | Run Vitest unit tests, Cypress e2e tests, and ESLint |
| `add-capacitor-plugin` | `/add-capacitor-plugin` | Install, configure, sync, and wrap a new Capacitor plugin |

**Turbo annotations** — Workflow steps can include special annotations that auto-approve terminal commands:

- `// turbo` above a single step → auto-run only that step's terminal command.
- `// turbo-all` anywhere in the file → auto-run **every** terminal command in the workflow.

### Creating New Workflows

**Via the UI:**

1. Open the **Customizations** panel (click the `...` menu at the top of the agent panel).
2. Navigate to the **Workflows** panel.
3. Click **+ Global** to create a workflow available across all workspaces, or **+ Workspace** to create one for the current workspace only.
4. Add a title, description, and step-by-step instructions.

**Manually:**

Create a `.md` file in `.agents/workflows/` (workspace-level) with this format:

```markdown
---
description: 'Short description of what this workflow does'
---

# Workflow Title

## Steps

### 1. First step
Instructions for the agent...

### 2. Second step
Instructions for the agent...
```

**Agent-generated workflows** — You can also ask the agent to generate a workflow for you. This works best after manually walking through a series of steps with the agent, since it can use the conversation history to create the workflow.

---

## Terminal Command Allowlist

Antigravity asks for approval before running terminal commands. You can pre-approve safe commands via the **allowlist** so the agent auto-executes them without prompting.

**How to configure:**

1. Open the **Customizations** panel (click the `...` menu at the top of the agent panel).
2. Go to **Settings → Agent** tab.
3. Scroll to **Terminal Command Auto Execution → Allow List**.
4. Add each command prefix below.

> **Note:** When **Strict Mode** is enabled, the allowlist is ignored and the agent prompts for every command.

**Recommended allowlist for Ionic Vue / Capacitor development:**

```
yarn dev
yarn build
yarn sync
yarn test:unit
yarn test:e2e
yarn lint
yarn install
npx cap sync
npx cap open
npx cap copy
npx cap update
npx cypress open
node -v
cat
ls
head
tail
wc
grep
find
which
whoami
pwd
echo
git status
git log
git diff
git branch
git stash list
git remote -v
npm list
npm outdated
```

---

## How It Works

- On startup, Antigravity loads `GEMINI.md` from the workspace root as always-on context (project identity, tech stack, conventions).
- When a task involves the mobile app (creating views, working with APIs, Capacitor plugins, etc.), the agent discovers the `ionic-vue-mobile-app` skill and reads `SKILL.md` and relevant resource files.
- Workflows are invoked on-demand via `/workflow-name` slash commands, guiding the agent through multi-step processes like building, testing, or adding plugins.
- Together, `GEMINI.md` + `.agents/skills/` + `.agents/workflows/` give the agent deep knowledge of the Ionic Vue + Capacitor + ERPNext codebase for correct, convention-compliant code generation.

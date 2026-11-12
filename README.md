# Director Cut

**Director Cut** is a local-first desktop production console built for managing the **16-step audiovisual production workflow** (from initial research and thesis selection through script drafting, multi-agent evaluation, visual/voice planning, assembly, and final QA).

Designed with a page-based interface inspired by DaVinci Resolve, Director Cut behaves as a structured **workflow state machine** rather than an unconstrained chat interface: every stage tracks upstream dependencies, resolves typed prompt contracts, preserves immutable artifact versions as Markdown snapshots, and requires explicit human creative approval before unlocking downstream steps.

---

## Key Features

- **16-Step Controlled Production Pipeline**
  - **Phase 1 — Creative & Prep:** `01 Research Brief` → `02 Angle & Thesis` → `03 Angle Evaluator` → `04 Script Blueprint`
  - **Phase 2 — Drafting & Polish:** `05 Script Versions` → `06 Multi-Agent Evaluator` → `07 Master Cut` → `08 Layered Rewrite & Polish`
  - **Phase 3 — Sound & Visual Design:** `09 Visual Layer` → `10 Voice Plan` → `11 AI Narration` → `12 Audio Cleanup & Master`
  - **Phase 4 — Sourcing & Publishing:** `13 Asset Sourcing & Rights` → `14 Long-Form Assembly` → `15 Derivatives Package` → `16 Final QA & Publish`
- **Local-First Persistence & Immutable Snapshots**
  - SQLite (`director_cut.db`) acts as the source of truth for episodes, channels, step states, human reviews, variables, and audit events.
  - Every generated output and rendered prompt is saved as an immutable versioned Markdown snapshot (`EP001_S01_<type>_v001.md`).
- **Explicit Human Review Console**
  - Side-by-side version comparison, quality checklists per step, manual output editing, creative feedback notes, version locking, rejection/regeneration tracking, and strict upstream dependency gating.
- **Structured Prompt Registry & Variable Assistant**
  - Supports Global, Channel-level, and Episode-level prompt overrides with automatic `[PLACEHOLDER]` detection, live context injection from approved upstream artifacts, and unresolved-variable validation before execution.
- **Flexible AI Execution + Offline Manual Paste Mode**
  - Built-in provider abstraction supporting **OpenAI**, **Google Gemini**, **DeepSeek**, **Kimi (Moonshot)**, and **Qwen (DashScope)**.
  - Works 100% offline or without API keys via **Manual Paste Mode**: render and copy the compiled prompt into any external AI tool, then paste the response back into the tracked artifact pipeline.
- **Optional LAN Multi-User Sync & Studio Chat**
  - Includes a lightweight Node/Express companion server (`server/`) so two team members on the same private Wi-Fi network can collaborate on shared episodes, snapshots, and built-in Studio Chat.
- **Optional Google Drive / Docs Mirror**
  - Connect via OAuth 2.0 to create episode folders and mirror approved step deliverables into Google Docs.

---

## Architecture & Repository Structure

```text
Director Cut/
├── src/                      # React + TypeScript + Tailwind frontend
│   ├── components/           # Shell, bottom 16-step nav, dashboard, review console, chat, modals
│   ├── config/               # 16-step metadata & per-step quality checklists
│   ├── hooks/                # Workflow state & step execution hooks
│   ├── lib/                  # Workflow engine, prompt engine, SQLite client, LLM & Drive services
│   ├── prompts/seed/         # Seed Markdown prompt contracts for steps 01–16
│   └── types/                # Shared TypeScript workflow & data contracts
├── src-tauri/                # Tauri v2 Rust desktop shell, SQL/FS plugins, CSP & capabilities
├── server/                   # Optional Express + SQLite LAN companion server for multi-machine sync
├── docs/                     # Architecture, state machine, data model, prompt contracts & UI specs
├── agents/skills/            # Domain operating guides
├── USER_MANUAL.md            # Detailed user guide
└── package.json
```

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Rust & Cargo** + OS WebView prerequisites for Tauri v2 (see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/))

---

## Getting Started

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Run in Desktop Development Mode (Tauri)

```bash
npm run tauri dev
```

Or run the Vite frontend only (note: SQLite / FS persistence requires either Tauri or the companion server):

```bash
npm run dev
```

### 3. Build Desktop Installer

```bash
npm run tauri build
```

---

## How to Use Director Cut

1. **Create or Select a Channel Profile**
   Configure default language, region, target audience, tone, narrator voice, duration, spoiler/adaptation policies, outro template, and sponsor guidelines.
2. **Create an Episode**
   In the Episode Dashboard, create a new episode (`Title`, `Topic`, `Primary Work`, assignee, and optional episode-level overrides). All 16 steps initialize automatically with Step `01` unlocked and Steps `02–16` gated until their dependencies are approved.
3. **Prepare Inputs & Variables (Left Panel)**
   Inspect the active step's required placeholders and upstream dependencies. Use the **Variable Assistant** to review inherited Channel/Episode parameters and add human creative decisions or feedback notes.
4. **Render Prompt & Generate Output (Center Panel)**
   - **AI Generator Mode:** Choose a configured provider/model (OpenAI, Gemini, DeepSeek, Kimi, or Qwen) in **Developer Settings** (gear icon) and run generation directly.
   - **Manual Paste Mode:** Inspect the rendered prompt, click **Copy Rendered Prompt**, run it in any external tool (ChatGPT, Claude, Gemini web, local Ollama, etc.), and paste the output back to save version `v001`.
5. **Review & Approve (Right Panel / Review Console)**
   Verify the output against the step quality checklist, compare versions if regenerated, optionally edit manually, and click **Approve** (or **Reject** / **Request Regeneration** with feedback). Approving unlocks the downstream workflow steps that depend on it.
6. **Optional: LAN Collaboration & Google Drive**
   Open **Developer Settings** (gear icon) → **Sync & Profiles** to connect two computers to the companion server, or **Google Drive** to mirror approved Markdown artifacts to Google Docs.

---

## Optional LAN Collaboration Server (`server/`)

By default, Director Cut stores everything locally on your machine via Tauri SQLite and `AppLocalData`. If two team members want to share a single workspace over a private home/studio LAN:

```bash
cd server
npm install
```

- **Localhost only (default):**
  ```bash
  npm start
  ```
- **LAN Wi-Fi mode (listens on `0.0.0.0:5000`):**
  ```bash
  npm run start:lan
  ```
  *(Optional but strongly recommended on shared networks)* Set a shared bearer token before starting:
  ```bash
  # PowerShell
  $env:SERVER_AUTH_TOKEN="choose-a-strong-secret-token"
  npm run start:lan
  ```
  In the desktop app (**Settings → Sync & Profiles**), enable LAN Sync and point both machines to `http://<HOST-LAN-IP>:5000`. If using `SERVER_AUTH_TOKEN`, store the matching token in `localStorage.setItem('serverAuthToken', '<token>')` in the client WebView or keep the server strictly on a trusted private LAN / VPN.

Run companion server security tests:

```bash
cd server
npm test
```

---

## Security & Privacy Notes

- **Local-First Data:** Databases (`*.db`), generated episode `snapshots/`, `.env*`, and OAuth credentials are excluded via `.gitignore` and remain strictly local to your workstation.
- **Companion Server Hardening:** `server/index.js` binds to `127.0.0.1` by default, restricts CORS origins, blocks path traversal on `/api/snapshots`, rejects multi-statement/dangerous SQL directives on `/api/db/*`, supports Bearer token authentication (`SERVER_AUTH_TOKEN`), and omits SQL parameter values from error logs.
- **API Key Handling:** Gemini requests pass credentials via the `x-goog-api-key` header rather than URL query parameters. Note that when LAN Sync is enabled, client `app_settings` (including provider keys configured inside the app) reside in the shared server SQLite database, so LAN Sync should only be used on trusted private networks.
- **Tauri CSP:** `src-tauri/tauri.conf.json` configures an explicit Content Security Policy restricting script execution and disabling `<object>`/`base` injection.

---

## License

Private / Studio production workflow software. See repository documentation in [`docs/`](docs/) and [`USER_MANUAL.md`](USER_MANUAL.md) for full technical specifications.

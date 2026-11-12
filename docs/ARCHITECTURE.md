\# docs/ARCHITECTURE.md



\# Architecture



\## Purpose



This document defines the technical architecture of the Project Mina-Ale Production Workflow App.



The app is a local-first desktop system that orchestrates a 16-step AI-assisted audiovisual production workflow using:



\- structured prompt templates stored in Google Docs;

\- local workflow state stored in SQLite;

\- versioned local snapshots;

\- optional Google Drive / Google Docs synchronization;

\- human approval checkpoints;

\- AI provider abstraction;

\- a DaVinci Resolve-inspired page-based interface.



\---



\## Architectural Position



This app is not a web SaaS product.



It is a local-first desktop application.



The local app owns:



\- workflow state;

\- episode state;

\- prompt metadata cache;

\- artifact metadata;

\- version history;

\- human review state;

\- local snapshots;

\- sync status.



Google Drive owns:



\- human-readable prompt templates;

\- mirrored output documents;

\- optional shared episode folders;

\- external collaboration documents.



AI providers own:



\- generation requests;

\- model responses;

\- provider-specific metadata.



No external service should be required for the app to open, inspect existing episodes, review prior outputs, or continue working in manual mode.



\---



\## Recommended Stack



```text id="5y6f01"

Desktop shell: Tauri

Frontend: React

Language: TypeScript

Styling: Tailwind CSS

Component system: local React components

Backend runtime: Rust through Tauri commands

Local database: SQLite

Local snapshots: filesystem

Prompt source: Google Docs

Remote mirror: Google Drive / Google Docs

AI providers: OpenAI, Gemini, manual paste mode

````



\---



\## High-Level System Diagram



```text id="cgg676"

┌──────────────────────────────────────────────────────────────┐

│                      Local Desktop App                        │

│                                                              │

│  ┌──────────────────────┐    ┌────────────────────────────┐  │

│  │ React / TypeScript UI │    │ Tauri Rust Backend         │  │

│  │                      │    │                            │  │

│  │ - Bottom navigation  │◄──►│ - Commands                 │  │

│  │ - Step workspaces    │    │ - Workflow engine          │  │

│  │ - Review console     │    │ - SQLite access            │  │

│  │ - Diff views         │    │ - Filesystem snapshots     │  │

│  │ - Prompt renderer    │    │ - Drive / Docs clients     │  │

│  └──────────────────────┘    └────────────────────────────┘  │

│                                      │                       │

│                                      ▼                       │

│                        ┌────────────────────────┐            │

│                        │ Local SQLite Database  │            │

│                        └────────────────────────┘            │

│                                      │                       │

│                                      ▼                       │

│                        ┌────────────────────────┐            │

│                        │ Local Snapshot Store   │            │

│                        └────────────────────────┘            │

└──────────────────────────────────────┬───────────────────────┘

&#x20;                                      │

&#x20;                 ┌────────────────────┼────────────────────┐

&#x20;                 ▼                    ▼                    ▼

&#x20;        ┌────────────────┐   ┌────────────────┐   ┌────────────────┐

&#x20;        │ Google Drive   │   │ Google Docs    │   │ AI Providers   │

&#x20;        │ folder sync    │   │ doc read/write │   │ OpenAI/Gemini  │

&#x20;        └────────────────┘   └────────────────┘   └────────────────┘

```



\---



\## Core Architectural Rule



The app must never treat AI generation as the source of truth.



The source of truth is:



```text id="ot85ma"

approved human-reviewed artifact version

```



AI-generated output is only a candidate artifact until a human approves it.



\---



\## Main Architectural Layers



\### 1. UI Layer



Location:



```text id="jhyr1a"

src/app/

src/components/

src/features/

```



Responsibilities:



\* render the local desktop interface;

\* display the 16-step bottom navigation;

\* show step-specific workspaces;

\* render prompt inputs and variables;

\* display generated outputs;

\* allow human review actions;

\* show sync status;

\* display diffs and version history;

\* communicate with Tauri backend through typed commands.



The UI must not directly access Google APIs, SQLite, or filesystem snapshots.



\---



\### 2. Workflow Layer



Location:



```text id="5uq1qd"

src-tauri/src/workflow/

src/features/workflow/

```



Responsibilities:



\* define all 16 workflow steps;

\* enforce dependencies;

\* enforce human review checkpoints;

\* control step state transitions;

\* prevent invalid execution;

\* generate next allowed actions;

\* resolve upstream approved outputs;

\* create step runs;

\* create artifact records;

\* coordinate prompt rendering and AI execution.



The workflow layer is the conceptual heart of the application.



\---



\### 3. Prompt Contract Layer



Location:



```text id="1b7dr8"

src-tauri/src/docs/

src-tauri/src/workflow/

src/features/prompts/

```



Responsibilities:



\* import prompt templates from Google Docs;

\* extract raw text;

\* detect prompt number and title;

\* detect placeholders;

\* map placeholders to canonical variables;

\* validate required inputs;

\* render final executable prompts;

\* cache prompt template versions;

\* warn when a remote prompt changes.



Prompts are structured contracts, not plain text blobs.



\---



\### 4. Artifact Layer



Location:



```text id="op7x67"

src-tauri/src/storage/

src-tauri/src/db/

src/features/review/

```



Responsibilities:



\* store generated outputs as immutable local snapshots;

\* track metadata in SQLite;

\* maintain artifact versions;

\* link artifacts to workflow steps;

\* link local snapshots to Google Docs mirrors;

\* preserve approved, rejected, superseded, and locked versions;

\* support diff and comparison.



No approved artifact may be overwritten.



\---



\### 5. Google Drive / Docs Sync Layer



Location:



```text id="zx5emr"

src-tauri/src/drive/

src-tauri/src/docs/

src-tauri/src/sync/

```



Responsibilities:



\* authenticate with Google OAuth;

\* list and select Drive folders;

\* read Google Docs prompt templates;

\* create Google Docs output documents;

\* write generated output into Google Docs;

\* mirror local artifacts to Drive;

\* track sync status;

\* detect remote changes;

\* queue sync operations;

\* support dry-run before destructive actions.



Drive is not the only source of truth.



\---



\### 6. AI Provider Layer



Location:



```text id="j3ady2"

src-tauri/src/ai/

src/features/prompts/

```



Responsibilities:



\* support manual paste mode;

\* support OpenAI API;

\* support Gemini API;

\* provide a provider-neutral generation interface;

\* record provider metadata;

\* record model metadata;

\* estimate token/cost metadata where available;

\* return generated output as candidate artifact text.



The workflow engine must call the provider interface, not raw vendor SDKs.



\---



\### 7. Security Layer



Location:



```text id="lmio78"

src-tauri/src/security/

src-tauri/capabilities/

```



Responsibilities:



\* store secrets safely;

\* protect OAuth tokens;

\* avoid logging private content unnecessarily;

\* avoid exposing API keys;

\* define Tauri capabilities;

\* limit filesystem and shell access;

\* restrict destructive Drive actions;

\* support local-only operation.



\---



\## Runtime Flow



\### Step Execution Flow



```text id="3e0abf"

1\. User opens an episode.

2\. User selects a workflow step.

3\. App checks step dependencies.

4\. App loads required approved upstream artifacts.

5\. App loads prompt template contract.

6\. App maps variables into placeholders.

7\. App validates unresolved placeholders.

8\. User reviews rendered prompt.

9\. User chooses manual mode or provider execution.

10\. App generates or receives output.

11\. App saves output as a local candidate artifact version.

12\. App optionally mirrors output to Google Docs.

13\. Step enters awaiting\_human\_review.

14\. User approves, rejects, edits, or regenerates.

15\. Approved version becomes dependency for downstream steps.

```



\---



\## Data Ownership



\### SQLite Owns



```text id="zxh4v4"

projects

channels

episodes

workflow step definitions

workflow step runs

prompt template metadata

prompt template versions

artifact metadata

artifact version metadata

human reviews

sync events

audit events

settings

```



\### Local Filesystem Owns



```text id="zdm2xl"

markdown snapshots

raw rendered prompts

AI response snapshots

JSON debug manifests

optional exported documents

backup bundles

```



\### Google Drive Owns



```text id="ngvqvo"

prompt source documents

mirrored output documents

episode folders

shared human-readable artifacts

asset folders

external production folders

```



\### AI Providers Own



```text id="8jj3jv"

request execution

model inference

provider-specific response metadata

```



\---



\## Local Snapshot Strategy



Every significant text artifact must be saved locally before remote sync.



Recommended local snapshot structure:



```text id="x8y142"

.local-data/

├── db/

│   └── project-mina-ale.sqlite

├── snapshots/

│   └── episodes/

│       └── EP001/

│           ├── S01/

│           │   ├── EP001\_S01\_ResearchBrief\_v001.md

│           │   ├── EP001\_S01\_ResearchBrief\_v002.md

│           │   └── rendered\_prompt\_v002.md

│           ├── S02/

│           └── S16/

├── exports/

├── logs/

└── backups/

```



Snapshots are append-only.



Approved versions are never overwritten.



\---



\## Google Drive Sync Strategy



The app should support three sync modes.



\### 1. Manual Sync



The user explicitly clicks:



```text id="ekt0dz"

Sync to Drive

Import from Drive

Refresh prompt templates

```



This is safest for MVP.



\### 2. Assisted Sync



The app detects changes and recommends actions:



```text id="0p9qsk"

Remote prompt changed.

Local output not mirrored.

Drive document missing.

Sync conflict detected.

```



The user approves actions.



\### 3. Automatic Safe Sync



The app automatically performs non-destructive sync:



```text id="x14qzg"

read prompt metadata

create new output doc

write new artifact mirror

update local sync status

```



Destructive actions remain manual.



\---



\## Google Docs Strategy



Prompt templates are read from Google Docs.



Generated outputs may be written to new Google Docs.



The app should not edit prompt template documents unless explicitly requested.



Output documents should be created per artifact version or per approved artifact depending on user setting.



Recommended default:



```text id="y8v7hm"

Create a Google Doc for each approved artifact.

Keep rejected/regenerated versions local unless user chooses to sync them.

```



Optional advanced mode:



```text id="mmboju"

Mirror every version to Drive.

```



\---



\## Prompt Contract Strategy



Each prompt template has a contract.



A prompt contract defines:



```text id="5g9yrw"

step\_number

step\_title

source\_doc\_id

source\_doc\_url

input\_variables

required\_upstream\_artifacts

optional\_upstream\_artifacts

human\_questions

output\_artifact\_type

review\_requirement

default\_model\_settings

regeneration\_rules

drive\_output\_folder

```



Prompt contracts may be inferred from templates but should also be stored as explicit metadata.



\---



\## Workflow Model



The app must model two workflow layers.



\### 1. Linear Editorial Layer



```text id="8ljx18"

01 → 02 → 03 → 04 → 05 → 06 → 07 → 08

```



This layer requires strict sequential approval.



\### 2. Production Planning Layer



```text id="tfg7zl"

08 → 09

08 → 10 → 11 → 12

09 + 13 → 14

12 + 13 + 14 → 15

13 + 15 → 16

```



This layer is still ordered, but dependencies are not purely linear.



The app must support dependency graphs, not only next-step navigation.



\---



\## Dependency Graph



```text id="n0lf0f"

S01 Research Brief

&#x20; ↓

S02 Angle List

&#x20; ↓

S03 Angle Decision

&#x20; ↓

S04 Blueprint

&#x20; ↓

S05 Script Versions

&#x20; ↓

S06 Script Evaluation

&#x20; ↓

S07 Master Cut

&#x20; ↓

S08 Final Polished Script

&#x20; ├── S09 Visual Layer

&#x20; └── S10 Voice Production

&#x20;         ↓

&#x20;       S11 AI Narration Generation

&#x20;         ↓

&#x20;       S12 Audio Master Plan



S09 Visual Layer

&#x20; ↓

S13 Asset Rights



S12 Audio Master Plan + S13 Asset Rights

&#x20; ↓

S14 Long-Form Assembly



S14 Long-Form Assembly

&#x20; ↓

S15 Derivatives



S13 Asset Rights + S15 Derivatives

&#x20; ↓

S16 Final QA Publish

```



\---



\## State Management



Frontend state should be divided into:



```text id="is0kzg"

ephemeral UI state

server/backend state from SQLite

sync state

generation state

review state

```



The database remains the durable state.



The frontend may use a local state library, but it must not become the canonical workflow store.



\---



\## Tauri Command Boundary



Frontend should communicate with Rust through typed Tauri commands.



Example command categories:



```text id="x88ted"

project\_create

project\_open

episode\_create

episode\_get

workflow\_get\_status

workflow\_run\_step

workflow\_approve\_step

workflow\_reject\_step

workflow\_regenerate\_step

prompt\_import\_templates

prompt\_render\_step

drive\_connect

drive\_list\_folders

drive\_sync\_artifact

docs\_create\_output

settings\_update

```



Commands should return typed results and structured errors.



\---



\## Error Model



Every backend command should return errors with:



```text id="mxac45"

code

message

detail

recoverable

suggested\_action

source

```



Example:



```json id="fhf0g8"

{

&#x20; "code": "UNRESOLVED\_PLACEHOLDERS",

&#x20; "message": "The prompt cannot be executed because required placeholders are unresolved.",

&#x20; "detail": \["\[PASTE RESEARCH BRIEF HERE]", "\[INSERT LANGUAGE AND REGION]"],

&#x20; "recoverable": true,

&#x20; "suggested\_action": "Complete the missing input fields before running the step.",

&#x20; "source": "prompt\_renderer"

}

```



\---



\## Execution Modes



\### Manual Paste Mode



Default safe mode.



```text id="22gzoe"

Render prompt → copy externally → paste output → save artifact → review

```



\### Assisted API Mode



```text id="eviakg"

Render prompt → call provider → save output → review

```



\### Semi-Automated Mode



Only for low-risk production planning steps after explicit user configuration.



Never bypass approval for editorial steps 01–08.



\---



\## Folder Structure



Recommended repository structure:



```text id="h7p3ls"

project-mina-ale-app/

├── README.md

├── AGENTS.md

├── docs/

│   ├── ARCHITECTURE.md

│   ├── PROMPT\_CONTRACTS.md

│   ├── WORKFLOW\_STATE\_MACHINE.md

│   ├── DATA\_MODEL.md

│   ├── DRIVE\_SYNC.md

│   ├── UI\_MAP.md

│   ├── MVP\_SCOPE.md

│   └── TEST\_STRATEGY.md

├── agents/

│   └── skills/

│       ├── drive-sync.md

│       ├── prompt-contracts.md

│       ├── workflow-engine.md

│       ├── ui-shell.md

│       └── security-qa.md

├── src/

│   ├── app/

│   ├── components/

│   ├── features/

│   │   ├── prompts/

│   │   ├── workflow/

│   │   ├── drive/

│   │   ├── review/

│   │   └── publishing/

│   ├── hooks/

│   └── lib/

├── src-tauri/

│   ├── src/

│   │   ├── commands/

│   │   ├── drive/

│   │   ├── docs/

│   │   ├── sync/

│   │   ├── workflow/

│   │   ├── db/

│   │   ├── storage/

│   │   ├── ai/

│   │   └── security/

│   ├── capabilities/

│   ├── migrations/

│   ├── Cargo.toml

│   └── tauri.conf.json

├── tests/

│   ├── e2e/

│   ├── integration/

│   └── fixtures/

└── scripts/

```



\---



\## Feature Boundaries



\### `features/prompts`



Owns:



```text id="aa17e9"

prompt list UI

prompt template details

placeholder validation UI

rendered prompt preview

prompt sync status

```



\### `features/workflow`



Owns:



```text id="3c4b3w"

16-step navigation

step status

dependency status

step execution controls

workflow graph

```



\### `features/review`



Owns:



```text id="cuokz6"

output review

approve/reject actions

version comparison

human feedback

decision log

```



\### `features/drive`



Owns:



```text id="k26wl1"

Drive connection status

folder selection

template import

output sync

conflict warnings

```



\### `features/publishing`



Owns:



```text id="4obzve"

steps 13–16 dashboards

asset tracking

QA tracking

derivatives tracking

publish readiness

```



\---



\## Key Domain Entities



```text id="nflx29"

Project

Channel

Episode

WorkflowStepDefinition

WorkflowStepRun

PromptTemplate

PromptTemplateVersion

PromptVariable

Artifact

ArtifactVersion

HumanReview

DriveFileLink

SyncEvent

AuditEvent

ExternalTask

AppSetting

```



\---



\## External Task Model



Some steps create plans for external work.



Examples:



```text id="szpr98"

generate audio in ElevenLabs

clean audio in Audacity or DaVinci Resolve

collect visual assets

edit long-form video

export podcast master

publish to YouTube

```



The app should represent these as `ExternalTask` records rather than pretending the workflow has completed the real production action.



\---



\## MVP Architecture



The MVP should implement:



```text id="fwhjy8"

Tauri shell

React UI

SQLite database

prompt registry

manual mode

workflow engine

human review console

local snapshots

Drive prompt import

Docs output creation

bottom navigation for 16 steps

steps 01–05 fully operational

```



Steps 06–16 may appear in the UI but can initially be disabled or marked as “planned” until the core loop is proven.



\---



\## Non-Goals



Do not build these into the architecture for MVP:



```text id="y6dzxn"

cloud backend

multi-user real-time collaboration

video editing automation

YouTube direct publishing

podcast direct publishing

DaVinci Resolve automation

large-scale analytics

complex legal rights system

semantic memory engine

```



\---



\## Architectural Risks



\### Risk 1: Treating Drive as Database



Mitigation:



```text id="f2k7yw"

SQLite is canonical.

Drive is mirror and template source.

```



\### Risk 2: Over-Automating Editorial Judgment



Mitigation:



```text id="80dj0k"

Mandatory human checkpoints.

No auto-approval.

```



\### Risk 3: Prompt Template Drift



Mitigation:



```text id="ig9sn3"

Cache prompt template versions.

Detect remote changes.

Warn before execution.

```



\### Risk 4: Output Overwrite



Mitigation:



```text id="1gjvub"

Append-only artifact versions.

Approved versions cannot be overwritten.

```



\### Risk 5: Placeholder Mismatch



Mitigation:



```text id="mxxhf8"

Extract placeholders.

Map to canonical variables.

Block execution if unresolved.

```



\### Risk 6: Sync Conflicts



Mitigation:



```text id="8dkgmt"

Track remote modified times and hashes.

Use sync\_pending and sync\_conflict states.

Require human resolution.

```



\---



\## Implementation Phases



\### Phase 1 — Local Core



```text id="psrdf4"

Set up Tauri + React.

Create SQLite schema.

Create workflow step registry.

Implement local episode creation.

Implement local snapshots.

Implement manual paste mode.

```



\### Phase 2 — Prompt Contracts



```text id="3to18l"

Import prompt templates.

Extract placeholders.

Define contracts for 16 steps.

Render executable prompts.

Validate missing inputs.

```



\### Phase 3 — Human Review



```text id="e3l2ki"

Implement output review console.

Approve/reject/regenerate actions.

Create version history.

Create diff view.

Lock approved versions.

```



\### Phase 4 — Google Drive / Docs



```text id="9svyqe"

Add OAuth.

Select root Drive folder.

Read prompt docs.

Create output docs.

Sync approved artifacts.

Track sync status.

```



\### Phase 5 — AI Providers



```text id="rreys3"

Add provider abstraction.

Implement OpenAI provider.

Implement Gemini provider.

Record provider metadata.

Keep manual mode available.

```



\### Phase 6 — Full Production Workflow



```text id="54sy6t"

Enable all 16 steps.

Add external task tracking.

Add asset and QA dashboards.

Add final package inventory.

Add production status overview.

```



\---



\## Architecture Standard



The architecture is correct when:



```text id="d94t9f"

the app runs locally;

the user can work without deployment;

Google Drive can disconnect without destroying workflow state;

prompts are rendered from contracts;

unresolved placeholders block execution;

AI outputs are versioned;

human approval is mandatory;

approved outputs become dependencies;

Drive sync is non-destructive by default;

the 16-step workflow is visible and navigable;

the app feels like a production console, not a chatbot.

```



```

```




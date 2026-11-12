\# docs/WORKFLOW\_STATE\_MACHINE.md



\# Workflow State Machine



\## Purpose



This document defines the workflow state machine for the Project Mina-Ale Production Workflow App.



The app manages a 16-step AI-assisted audiovisual production workflow.



The workflow must be controlled, explicit, reviewable, recoverable, and human-approved.



The state machine exists to prevent:



\- running steps too early;

\- using unapproved outputs as dependencies;

\- overwriting approved versions;

\- losing creative decisions;

\- confusing drafts with final artifacts;

\- syncing unstable work to Google Drive by accident;

\- advancing through the process without human judgment.



\---



\## Core Rule



A workflow step can only unlock downstream steps when it has at least one approved artifact version.



Generated output is not approved by default.



Every AI-generated or manually pasted output must pass through human review before it becomes a dependency.



\---



\## Workflow Steps



The canonical 16 steps are:



```text

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

06 — Multi-Agent Script Evaluator

07 — Master Cut Builder

08 — Layered Rewrite \& Final Polish

09 — Visual Layer Builder

10 — Voice Production Plan

11 — AI Narration Generation

12 — Audio Cleanup \& Podcast Master

13 — Asset Sourcing \& Rights Check

14 — Long-Form Video Assembly

15 — Derivatives Package

16 — Final QA, Export \& Publish

````



\---



\## Step Keys



```text

research\_brief

angle\_generator

angle\_evaluator

script\_blueprint

script\_version\_generator

multi\_agent\_script\_evaluator

master\_cut\_builder

final\_polish

visual\_layer\_builder

voice\_production\_plan

ai\_narration\_generation

audio\_cleanup\_podcast\_master

asset\_sourcing\_rights\_check

longform\_video\_assembly

derivatives\_package

final\_qa\_export\_publish

```



\---



\## Workflow State List



Each step run must use one of the following states:



```text

not\_started

blocked

ready

input\_missing

input\_ready

running

output\_generated

awaiting\_human\_review

approved

rejected

regeneration\_requested

superseded

locked

failed

sync\_pending

synced

sync\_conflict

```



\---



\## State Definitions



\### `not\_started`



The step exists but has not been prepared.



The user has not yet started this step for the current episode.



Allowed transitions:



```text

not\_started → blocked

not\_started → ready

not\_started → input\_missing

```



\---



\### `blocked`



The step cannot run because one or more required dependencies are unavailable.



Common reasons:



```text

required upstream step not approved

required artifact missing

prompt template missing

Google Drive template not imported

episode configuration missing

```



Allowed transitions:



```text

blocked → ready

blocked → input\_missing

```



\---



\### `ready`



The step is available and dependencies are satisfied, but required human inputs may not yet be fully completed.



Allowed transitions:



```text

ready → input\_missing

ready → input\_ready

```



\---



\### `input\_missing`



The step is unlocked, but one or more required inputs are missing.



Examples:



```text

target language missing

spoiler policy missing

human editorial decision missing

available asset list missing

known audio issues missing

```



Allowed transitions:



```text

input\_missing → input\_ready

input\_missing → blocked

```



\---



\### `input\_ready`



All required dependencies and variables are available.



The prompt can be rendered and reviewed.



Allowed transitions:



```text

input\_ready → running

input\_ready → failed

```



\---



\### `running`



The step is currently being executed.



Execution may happen through:



```text

manual\_paste

openai\_api

gemini\_api

```



Allowed transitions:



```text

running → output\_generated

running → failed

```



\---



\### `output\_generated`



A candidate output has been created and saved locally.



It is not yet approved.



Allowed transitions:



```text

output\_generated → awaiting\_human\_review

output\_generated → failed

```



\---



\### `awaiting\_human\_review`



The output is waiting for explicit human decision.



The user may approve, reject, regenerate, edit, or save as an alternative.



Allowed transitions:



```text

awaiting\_human\_review → approved

awaiting\_human\_review → rejected

awaiting\_human\_review → regeneration\_requested

awaiting\_human\_review → output\_generated

awaiting\_human\_review → locked

```



\---



\### `approved`



The output has been accepted by the human user.



At least one artifact version from this step can now serve as a dependency for downstream steps.



Allowed transitions:



```text

approved → locked

approved → regeneration\_requested

approved → sync\_pending

approved → synced

approved → superseded

```



\---



\### `rejected`



The current output was rejected.



Rejected outputs remain in history but cannot be used as downstream dependencies.



Allowed transitions:



```text

rejected → regeneration\_requested

rejected → input\_ready

```



\---



\### `regeneration\_requested`



The user requested a new output version.



Allowed transitions:



```text

regeneration\_requested → input\_ready

regeneration\_requested → running

```



\---



\### `superseded`



A previously approved or candidate version was replaced by a newer selected version.



Superseded artifacts remain in history.



Allowed transitions:



```text

superseded → locked

```



\---



\### `locked`



The step output is intentionally frozen.



Locked versions cannot be overwritten, regenerated over, or silently replaced.



A new version may still be created, but the locked version remains preserved.



Allowed transitions:



```text

locked → sync\_pending

locked → synced

```



\---



\### `failed`



The step failed.



Common causes:



```text

AI provider error

Google Drive error

Google Docs error

local write failure

prompt rendering error

validation error

unexpected exception

```



Allowed transitions:



```text

failed → input\_ready

failed → running

failed → blocked

```



\---



\### `sync\_pending`



The local artifact is approved or saved but has not yet been mirrored to Google Drive.



Allowed transitions:



```text

sync\_pending → synced

sync\_pending → sync\_conflict

sync\_pending → failed

```



\---



\### `synced`



The local artifact and its remote Google Drive / Google Docs mirror are in sync.



Allowed transitions:



```text

synced → sync\_conflict

synced → regeneration\_requested

synced → locked

```



\---



\### `sync\_conflict`



The app detected a conflict between local and remote state.



Examples:



```text

remote Google Doc edited after local snapshot

remote output missing

local artifact newer than Drive copy

Drive copy newer than local artifact

template changed during execution

```



Allowed transitions:



```text

sync\_conflict → sync\_pending

sync\_conflict → synced

sync\_conflict → failed

```



Conflict resolution must require human decision.



\---



\## State Transition Diagram



```text

not\_started

&#x20;  ↓

blocked ───────────────┐

&#x20;  ↓                   │

ready                  │

&#x20;  ↓                   │

input\_missing          │

&#x20;  ↓                   │

input\_ready            │

&#x20;  ↓                   │

running                │

&#x20;  ↓                   │

output\_generated       │

&#x20;  ↓                   │

awaiting\_human\_review  │

&#x20;  ├── approved ───────┼── sync\_pending → synced

&#x20;  ├── rejected        │

&#x20;  └── regeneration\_requested → input\_ready

```



\---



\## Dependency Rule



A step is considered dependency-ready only when:



```text

step\_state = approved

AND

approved\_artifact\_version\_id exists

AND

artifact\_version is not rejected

AND

artifact\_version is not superseded

```



A synced state is not required for dependency use.



Local approval is sufficient.



However, the UI should warn if an approved artifact is not synced to Drive.



\---



\## Linear Editorial Dependency Chain



Steps 01–08 are strict and sequential.



```text

01 → 02 → 03 → 04 → 05 → 06 → 07 → 08

```



Each step requires the previous editorial output to be approved before continuing.



\---



\## Production Dependency Graph



Steps 09–16 depend on the approved final polished script and production planning artifacts.



```text

08 → 09

08 → 10

10 → 11

11 → 12

09 → 13

12 + 13 → 14

14 → 15

13 + 15 → 16

```



The app must support graph dependencies, not only linear dependencies.



\---



\## Canonical Step Dependencies



\### Step 01



```text

requires: none

produces: research\_brief

```



\### Step 02



```text

requires: research\_brief

produces: angle\_generator\_output

```



\### Step 03



```text

requires: angle\_generator\_output

produces: angle\_evaluator\_output

```



\### Step 04



```text

requires:

\- research\_brief

\- angle\_generator\_output

\- angle\_evaluator\_output



produces: script\_blueprint

```



\### Step 05



```text

requires:

\- research\_brief

\- angle\_evaluator\_output

\- script\_blueprint



produces: script\_versions

```



\### Step 06



```text

requires:

\- research\_brief

\- script\_blueprint

\- script\_versions



produces: multi\_agent\_script\_evaluation

```



\### Step 07



```text

requires:

\- research\_brief

\- script\_blueprint

\- script\_versions

\- multi\_agent\_script\_evaluation



produces: master\_cut\_script

```



\### Step 08



```text

requires:

\- research\_brief

\- script\_blueprint

\- master\_cut\_script



produces: final\_polished\_script

```



\### Step 09



```text

requires:

\- final\_polished\_script

\- research\_brief

\- script\_blueprint



produces: visual\_layer\_plan

```



\### Step 10



```text

requires:

\- final\_polished\_script



produces: voice\_production\_plan

```



\### Step 11



```text

requires:

\- voice\_production\_plan



produces: ai\_narration\_generation\_plan

```



\### Step 12



```text

requires:

\- final\_polished\_script

\- voice\_production\_plan

\- ai\_narration\_generation\_plan



produces: audio\_cleanup\_podcast\_master\_plan

```



\### Step 13



```text

requires:

\- final\_polished\_script

\- visual\_layer\_plan

\- voice\_production\_plan



produces: asset\_sourcing\_rights\_check\_plan

```



\### Step 14



```text

requires:

\- final\_polished\_script

\- voice\_production\_plan

\- ai\_narration\_generation\_plan

\- audio\_cleanup\_podcast\_master\_plan

\- asset\_sourcing\_rights\_check\_plan



produces: longform\_video\_assembly\_plan

```



\### Step 15



```text

requires:

\- final\_polished\_script

\- longform\_video\_assembly\_plan



produces: derivatives\_package\_plan

```



\### Step 16



```text

requires:

\- final\_polished\_script

\- derivatives\_package\_plan

\- asset\_sourcing\_rights\_check\_plan



produces: final\_qa\_export\_publish\_plan

```



\---



\## Transition Rules



\### Rule 1 — No execution without resolved inputs



A step may transition to `running` only if:



```text

current\_state = input\_ready

AND all required variables are resolved

AND all required upstream artifacts are approved

AND prompt template exists

AND prompt has no unresolved required placeholders

```



\---



\### Rule 2 — Generated output is not approved



A step may transition from `output\_generated` only to:



```text

awaiting\_human\_review

failed

```



Generated output must not move directly to `approved`.



\---



\### Rule 3 — Approval requires artifact version



A step may transition to `approved` only if:



```text

artifact\_version\_id exists

AND artifact\_version content exists locally

AND human\_review\_decision = approve

```



\---



\### Rule 4 — Regeneration creates a new version



A regeneration must never overwrite an existing artifact version.



It must create:



```text

new artifact\_version

new rendered\_prompt snapshot if inputs changed

new review record

new audit event

```



\---



\### Rule 5 — Rejection preserves history



Rejected outputs remain stored.



They are marked as rejected and excluded from downstream dependency selection.



\---



\### Rule 6 — Locking protects final decisions



A locked artifact version cannot be:



```text

overwritten

deleted from local history

silently replaced

used as parent for destructive edit

```



Creating a new alternative version is allowed.



\---



\### Rule 7 — Sync is not approval



A Google Drive sync does not imply human approval.



A synced artifact may still be:



```text

candidate

rejected

superseded

approved

locked

```



Approval is an editorial state, not a storage state.



\---



\### Rule 8 — Approval is not sync



An approved artifact may remain local only.



The UI should warn, but the workflow may continue using locally approved artifacts.



\---



\### Rule 9 — Template changes do not invalidate approved artifacts



If a prompt template changes after an artifact has been approved, the approved artifact remains valid.



Future regenerations should use the new template version only if the user chooses to refresh or accept the new template version.



\---



\### Rule 10 — Downstream invalidation warning



If an upstream artifact changes after downstream steps were already generated, the app must warn that downstream steps may be stale.



Do not automatically delete downstream outputs.



Mark affected downstream steps as:



```text

potentially\_stale

```



This may be a secondary flag, not a primary state.



\---



\## Secondary Flags



In addition to the primary state, steps may have secondary flags.



```text

potentially\_stale

has\_unsynced\_changes

has\_remote\_changes

has\_unresolved\_comments

has\_manual\_override

has\_multiple\_versions

requires\_human\_attention

```



Flags should not replace primary states.



\---



\## Human Review Decisions



Allowed decisions:



```text

approve

reject

request\_regeneration

manual\_edit

save\_as\_alternative

lock\_version

return\_to\_previous\_step

```



Each decision must create a review record.



Review record fields:



```text

review\_id

episode\_id

step\_run\_id

artifact\_version\_id

decision

feedback\_text

reviewed\_at

reviewed\_by

created\_followup\_version\_id

```



\---



\## Regeneration Modes



Supported regeneration modes:



```text

same\_inputs\_same\_prompt

same\_inputs\_with\_feedback

edited\_inputs

updated\_prompt\_template

different\_model

manual\_paste\_replacement

```



Each regeneration mode must create a new artifact version.



\---



\## Manual Paste Mode State Flow



```text

input\_ready

&#x20;  ↓

rendered\_prompt\_ready

&#x20;  ↓

awaiting\_manual\_output

&#x20;  ↓

output\_generated

&#x20;  ↓

awaiting\_human\_review

&#x20;  ↓

approved / rejected / regeneration\_requested

```



`rendered\_prompt\_ready` and `awaiting\_manual\_output` may be implemented as secondary execution substates rather than primary workflow states.



\---



\## API Execution State Flow



```text

input\_ready

&#x20;  ↓

running

&#x20;  ↓

output\_generated

&#x20;  ↓

awaiting\_human\_review

&#x20;  ↓

approved / rejected / regeneration\_requested

```



\---



\## Error Recovery



A failed step must preserve:



```text

last known valid state

error message

error code

error source

recoverability

suggested action

```



The user should be able to retry when safe.



Examples:



```text

AI provider timeout → retry running

unresolved placeholder → return to input\_missing

Drive sync failure → stay approved + sync\_pending

local snapshot failure → fail and block approval

```



\---



\## Staleness Rules



A downstream step becomes potentially stale when:



```text

one of its approved dependency artifact versions is superseded

one of its dependency artifacts is manually edited

one of its dependency artifacts is regenerated and newly approved

one of its source prompt templates changes before regeneration

```



The app should display:



```text

This step may be stale because an upstream approved artifact has changed.

```



The user may choose:



```text

keep current output

regenerate this step

duplicate as alternative branch

mark as reviewed anyway

```



\---



\## Branching Rule



The MVP does not need full branching.



However, the data model should not prevent future branching.



Minimum support:



```text

alternative artifact versions

manual selection of approved dependency version

step run history

superseded status

```



Future support:



```text

episode branches

alternate angle branch

alternate script branch

parallel script version branch

```



\---



\## Step Unlocking Logic



A step is unlocked when all required dependencies have approved artifact versions.



Pseudo-logic:



```text

function canUnlockStep(step, episode):

&#x20; for dependency in step.required\_dependencies:

&#x20;   if not exists approved artifact version for dependency:

&#x20;     return false

&#x20; return true

```



A step is executable when:



```text

function canExecuteStep(step, episode):

&#x20; return canUnlockStep(step, episode)

&#x20;   AND all required human inputs exist

&#x20;   AND prompt template exists

&#x20;   AND rendered prompt has no unresolved required placeholders

```



\---



\## UI Status Labels



Map internal states to user-facing labels.



```text

not\_started → Not started

blocked → Blocked

ready → Ready

input\_missing → Needs input

input\_ready → Ready to run

running → Running

output\_generated → Output generated

awaiting\_human\_review → Review needed

approved → Approved

rejected → Rejected

regeneration\_requested → Regeneration requested

superseded → Superseded

locked → Locked

failed → Failed

sync\_pending → Sync pending

synced → Synced

sync\_conflict → Sync conflict

```



\---



\## UI Colors



Suggested status color categories:



```text

not\_started → neutral

blocked → red

ready → blue

input\_missing → yellow

input\_ready → blue

running → purple

output\_generated → blue

awaiting\_human\_review → orange

approved → green

rejected → red

regeneration\_requested → purple

superseded → gray

locked → green/dark

failed → red

sync\_pending → yellow

synced → green

sync\_conflict → red/orange

```



Exact UI colors should be defined in the UI map.



\---



\## Bottom Navigation Behavior



Each of the 16 bottom navigation icons must show:



```text

step number

short label

icon

primary state indicator

unsynced indicator if relevant

review-needed indicator if relevant

stale indicator if relevant

```



Clicking a locked or blocked step should open the step but show why it cannot run.



Do not hide blocked steps.



The full process must remain visible.



\---



\## Step Action Permissions



\### `not\_started`



Allowed actions:



```text

view requirements

```



\### `blocked`



Allowed actions:



```text

view blocking reasons

open required upstream step

refresh dependencies

```



\### `ready`



Allowed actions:



```text

fill inputs

view prompt template

```



\### `input\_missing`



Allowed actions:



```text

fill missing inputs

import data

edit episode settings

```



\### `input\_ready`



Allowed actions:



```text

preview rendered prompt

run step

copy prompt for manual mode

```



\### `running`



Allowed actions:



```text

cancel if safe

view progress

```



\### `awaiting\_human\_review`



Allowed actions:



```text

approve

reject

regenerate

edit manually

save alternative

compare versions

```



\### `approved`



Allowed actions:



```text

continue to next step

sync to Drive

lock version

regenerate alternative

compare versions

```



\### `locked`



Allowed actions:



```text

view only

create alternative version

sync if needed

```



\### `sync\_conflict`



Allowed actions:



```text

compare local and remote

keep local

pull remote

create copy

resolve manually

```



\---



\## Audit Events



Every state transition must create an audit event.



Audit event fields:



```text

audit\_event\_id

episode\_id

step\_run\_id

from\_state

to\_state

event\_type

event\_source

message

created\_at

metadata\_json

```



Examples:



```text

STEP\_UNLOCKED

STEP\_EXECUTION\_STARTED

OUTPUT\_GENERATED

HUMAN\_APPROVED

HUMAN\_REJECTED

REGENERATION\_REQUESTED

ARTIFACT\_LOCKED

SYNC\_STARTED

SYNC\_COMPLETED

SYNC\_CONFLICT

STEP\_FAILED

```



\---



\## Quality Gates



A quality gate is a step-specific checklist shown before approval.



The app does not need to judge quality automatically in MVP.



It should present the checklist to the human reviewer.



Examples:



\### Step 01 Quality Gate



```text

Research brief contains concrete evidence.

Facts are separated from interpretation.

Sources or fact-check warnings are present.

Angle-ready material exists.

Visual opportunities are identified.

```



\### Step 02 Quality Gate



```text

Angles are genuinely different.

Each angle argues something.

Emotional wounds are specific.

Visual potential is identified.

Ranking is decisive.

```



\### Step 08 Quality Gate



```text

Final script preserves thesis.

Script is narrator-ready.

Counterpoint is strong.

Closing does not summarize.

Visual layer can use the script.

```



\### Step 16 Quality Gate



```text

All final files are listed.

Technical QA is complete.

Rights warnings are documented.

Podcast and derivative checks exist.

Go/no-go decision is clear.

```



\---



\## MVP State Machine Scope



For MVP, implement the full state machine, but only require full step execution for:



```text

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

```



Steps 06–16 should exist in the UI and database but may be marked as planned or disabled until implementation expands.



\---



\## Definition of Done



The workflow state machine is complete when:



```text

all 16 steps are registered

dependencies are enforced

missing inputs block execution

unresolved placeholders block execution

outputs become candidate versions

human approval is required

approved artifacts unlock downstream steps

rejected artifacts are preserved but unusable

regeneration creates new versions

locked versions cannot be overwritten

sync state is tracked separately from editorial approval

downstream staleness warnings exist

every state transition is audited

bottom navigation reflects state accurately

```



```

```




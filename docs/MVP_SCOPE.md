\# docs/MVP\_SCOPE.md



\# MVP Scope



\## Purpose



This document defines the minimum viable product for the Project Mina-Ale Production Workflow App.



The MVP must prove the core creative workflow before the app expands into full production management.



The goal is not to build the complete final system immediately.



The goal is to build a local-first application that can reliably manage the first critical part of the process:



```text

Prompt template → rendered prompt → AI/manual output → human review → approved version → next prompt

````



The MVP must validate that the app can preserve creative control, versioning, local ownership, and Google Drive integration.



\---



\## MVP Product Definition



The MVP is a local-first desktop app that allows the user to:



1\. Connect to Google Drive.

2\. Select the Project Mina-Ale root folder.

3\. Import the 16 prompt templates from Google Docs.

4\. Create a new episode.

5\. Configure the episode’s creative settings.

6\. Navigate the 16-step workflow through a DaVinci Resolve-inspired bottom bar.

7\. Execute Steps 01–05.

8\. Save outputs as local versioned artifacts.

9\. Review outputs manually.

10\. Approve, reject, regenerate, or manually edit outputs.

11\. Use approved outputs as dependencies for the next step.

12\. Optionally mirror approved outputs to Google Docs.

13\. Continue the workflow without losing state.



\---



\## MVP Principle



Build the editorial core first.



Do not build advanced media production automation before the first five steps work well.



The app is successful when it can manage:



```text

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

```



from episode creation to approved artifacts.



\---



\## MVP Must-Have Features



\### 1. Local App Shell



The app must run locally.



Recommended stack:



```text id="gmct37"

Tauri

React

TypeScript

Tailwind CSS

SQLite

```



The app must not require deployment.



\---



\### 2. Local Database



The app must create and manage a local SQLite database.



The database must store:



```text id="gxfg1w"

projects

channels

episodes

workflow step definitions

workflow step runs

prompt templates

prompt template versions

episode variables

artifacts

artifact versions

human reviews

Drive links

sync events

audit events

settings

```



\---



\### 3. Project Setup



The user must be able to create or select a local project.



Minimum fields:



```text id="f2hiqg"

project name

local data folder

Google Drive root folder ID

Google Drive root folder URL

```



Default project:



```text id="vp3m2t"

Project Mina-Ale

```



\---



\### 4. Google Drive Connection



The app must allow the user to connect Google Drive.



MVP requirements:



```text id="cy7r3w"

OAuth login

connected account display

root folder selection

prompt folder selection

template import

basic sync status

```



The app must work in manual/local mode even if Google Drive is disconnected.



\---



\### 5. Prompt Template Import



The app must import prompt templates from Google Docs.



MVP import behavior:



```text id="z0edja"

list prompt folder

identify prompt docs by step number

fetch Google Doc text

store local prompt template version

extract placeholders

compute content hash

display missing or duplicate prompts

```



All 16 prompts should be visible in the prompt registry.



Steps 01–05 must be fully mapped.



Steps 06–16 may be imported but not fully executable in MVP.



\---



\### 6. Episode Creation



The user must be able to create a new episode.



Minimum required fields:



```text id="a5pu3c"

episode title

episode topic

primary work

channel

target language

target region

target audience

desired tone

spoiler policy

adaptation policy

research depth

initial notes or sources

```



The app must create:



```text id="ktcxy7"

episode record

workflow step runs for 16 steps

local episode snapshot folder

optional Google Drive episode folder

```



\---



\### 7. Channel Profile



The app must support basic channel profiles.



Minimum fields:



```text id="11v4b5"

channel name

language

region

target audience

desired tone

visual style

narrator mode

default spoiler policy

default adaptation policy

default duration

```



Episode creation may inherit values from the selected channel.



\---



\### 8. Workflow Navigation



The app must show all 16 workflow steps in a persistent bottom navigation bar.



The bottom navigation must show:



```text id="qc4y0g"

step number

short label

icon

state indicator

review-needed indicator

sync indicator

```



All 16 steps must be visible.



Steps not yet executable must still show why they are unavailable.



\---



\### 9. Step Workspace Layout



Each workflow step must use the same base layout:



```text id="b3fznb"

Left panel: inputs, variables, dependencies

Center panel: rendered prompt, output, version comparison

Right panel: state, actions, checklist, sync status

```



\---



\### 10. Prompt Rendering



The app must render prompts by replacing placeholders with:



```text id="1844kd"

episode variables

channel variables

human inputs

approved upstream artifact content

system values

```



The rendered prompt must be previewable before execution.



The app must block execution if required placeholders are unresolved.



\---



\### 11. Manual Paste Mode



Manual paste mode is mandatory in MVP.



Flow:



```text id="pk8m6v"

1\. App renders final prompt.

2\. User copies rendered prompt.

3\. User runs it externally in ChatGPT/Gemini/etc.

4\. User pastes the output back into the app.

5\. App saves output as candidate artifact version.

6\. App sends output to human review.

```



Manual mode ensures the app is usable without paid API integration.



\---



\### 12. AI Provider Placeholder



The MVP should define but not necessarily fully implement AI provider abstraction.



At minimum, the architecture should support:



```text id="0j83y1"

manual\_paste

openai\_api

gemini\_api

```



If time permits, implement OpenAI API after manual mode works.



\---



\### 13. Artifact Versioning



Every output must create an artifact version.



Artifact versions must store:



```text id="19xskg"

step number

artifact type

version number

local snapshot path

content hash

source type

prompt template version used

rendered prompt snapshot path

status

created timestamp

```



No output may overwrite a prior version.



\---



\### 14. Human Review Console



Every generated or manually pasted output must enter review.



Review actions:



```text id="h4j4r8"

approve

reject

request regeneration

edit manually

save as alternative

lock version

```



Only approved artifact versions can unlock downstream steps.



\---



\### 15. Regeneration



The app must support regeneration.



In MVP, regeneration may be manual.



Supported MVP regeneration modes:



```text id="17t1mf"

same prompt, new manual output

same prompt plus human feedback

edited input values

manual edited replacement

```



Each regeneration creates a new artifact version.



\---



\### 16. Local Snapshots



Every rendered prompt and output must be saved locally.



Recommended paths:



```text id="0hjupw"

.local-data/snapshots/episodes/EP001/S01/rendered\_prompt\_v001.md

.local-data/snapshots/episodes/EP001/S01/EP001\_S01\_ResearchBrief\_v001.md

```



\---



\### 17. Google Docs Output Mirror



Approved outputs may be mirrored to Google Docs.



MVP behavior:



```text id="9fdihq"

create a Google Doc for approved artifact

write output content

store Google Doc link

show sync status

```



The app must save locally before syncing remotely.



\---



\### 18. Audit Log



The app must store an audit event for important actions.



Minimum audit events:



```text id="5dghii"

EPISODE\_CREATED

PROMPT\_IMPORTED

PROMPT\_RENDERED

OUTPUT\_CREATED

HUMAN\_APPROVED

HUMAN\_REJECTED

REGENERATION\_REQUESTED

MANUAL\_EDIT\_CREATED

ARTIFACT\_LOCKED

SYNC\_STARTED

SYNC\_COMPLETED

SYNC\_FAILED

STEP\_FAILED

```



\---



\## MVP Workflow Coverage



\### Fully Functional in MVP



```text id="zpq93t"

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

```



\### Visible but May Be Disabled



```text id="5h78iu"

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

```



Disabled steps must explain:



```text id="tbrofb"

This step is planned for a later implementation phase.

```



\---



\## MVP User Flow



\### Flow 1 — First-Time Setup



```text id="uu1ueu"

1\. Open app.

2\. Create local project.

3\. Connect Google Drive.

4\. Select Project Mina-Ale folder.

5\. Select prompt template folder.

6\. Import prompt templates.

7\. Confirm 16 prompts are detected.

8\. Create or import channel profile.

```



\---



\### Flow 2 — Create Episode



```text id="tpai6v"

1\. Click New Episode.

2\. Select channel.

3\. Fill episode topic and creative settings.

4\. Choose whether to create Drive folder.

5\. App creates local episode record.

6\. App initializes 16 step runs.

7\. App opens Step 01.

```



\---



\### Flow 3 — Run Step 01 Manually



```text id="c17wbk"

1\. Fill missing Step 01 inputs.

2\. Preview rendered prompt.

3\. Copy prompt.

4\. Run externally in AI tool.

5\. Paste output into app.

6\. Save as v001.

7\. Review output.

8\. Approve or regenerate.

9\. Approved research brief unlocks Step 02.

```



\---



\### Flow 4 — Run Step 02 Using Step 01



```text id="vruup9"

1\. Open Step 02.

2\. App loads approved Research Brief.

3\. Fill Step 02 creative preferences.

4\. Preview rendered prompt.

5\. Execute manually.

6\. Paste output.

7\. Review angles.

8\. Approve output.

9\. Step 03 unlocks.

```



\---



\### Flow 5 — Human Feedback and Regeneration



```text id="ssfkzu"

1\. User reviews output.

2\. User writes feedback.

3\. User clicks Regenerate.

4\. App renders prompt with feedback.

5\. User executes manually or through API.

6\. New artifact version is created.

7\. User compares versions.

8\. User approves preferred version.

```



\---



\## MVP Screens



Required screens:



```text id="52kvn1"

Project Dashboard

Settings

Google Drive Setup

Prompt Library

Channel Profiles

New Episode

Episode Dashboard

Step Workspace

Prompt Preview

Manual Paste Output

Human Review

Version History

Sync Status

```



\---



\## MVP Bottom Navigation



The bottom navigation must include all items:



```text id="ygeplm"

01 Research

02 Angles

03 Evaluate

04 Blueprint

05 Drafts

06 Board

07 Master

08 Polish

09 Visuals

10 Voice

11 Narration

12 Audio

13 Assets

14 Assembly

15 Derivatives

16 Publish

```



MVP active:



```text id="tx1g6k"

01 Research

02 Angles

03 Evaluate

04 Blueprint

05 Drafts

```



MVP inactive/planned:



```text id="6oeugx"

06 Board

07 Master

08 Polish

09 Visuals

10 Voice

11 Narration

12 Audio

13 Assets

14 Assembly

15 Derivatives

16 Publish

```



\---



\## MVP Quality Gates



Each step should have a checklist shown before approval.



\### Step 01



```text id="2jv260"

Research brief has concrete evidence.

Facts and interpretations are separated.

Angle-ready material exists.

Visual opportunities are present.

Source/fact-check warnings are included.

```



\### Step 02



```text id="yygb6n"

Angles are distinct.

Each angle has a thesis.

Emotional wounds are specific.

Visual potential is described.

Final recommendation is decisive.

```



\### Step 03



```text id="8aaip7"

Evaluation is critical, not generic.

Top angles are stress-tested.

Final recommendation is clear.

Human decision can be extracted.

```



\### Step 04



```text id="3x3stz"

Thesis is clear.

Argument spine exists.

Midpoint turn exists.

Counterpoint exists.

Evidence map is specific.

Execution rules are usable.

```



\### Step 05



```text id="cy9mfp"

Script versions are complete.

Versions differ meaningfully.

All versions preserve thesis.

Post-generation comparison is useful.

```



\---



\## Explicit Non-Goals for MVP



Do not implement these in MVP:



```text id="awy8ny"

direct YouTube upload

direct podcast publishing

direct DaVinci Resolve automation

direct ElevenLabs generation

advanced rights management

real-time multi-user collaboration

cloud backend

mobile app

advanced analytics

semantic search across all episodes

automated full 16-step run

automatic approval

destructive Google Drive operations

```



\---



\## MVP Success Criteria



The MVP is successful when:



```text id="ajyy59"

A user can create an episode.

The app imports the 16 prompt templates.

The user can complete Step 01 manually.

The approved Step 01 output unlocks Step 02.

The user can complete Steps 02–05 manually.

Each output is versioned.

Human review is required.

Approved versions are preserved.

Rejected versions remain in history.

Rendered prompts are saved locally.

Outputs are saved locally.

Approved outputs can be mirrored to Google Docs.

The 16-step bottom navigation is visible.

The app can be closed and reopened without losing state.

```



\---



\## MVP Acceptance Test



A complete MVP test should prove the following scenario:



```text id="0ckfq4"

1\. Launch local app.

2\. Create Project Mina-Ale.

3\. Connect Google Drive.

4\. Select root folder.

5\. Import prompts.

6\. Confirm Steps 01–16 exist.

7\. Create channel profile.

8\. Create episode EP001.

9\. Complete Step 01 in manual mode.

10\. Approve Research Brief.

11\. Complete Step 02 using approved Step 01 output.

12\. Approve Angle Generator output.

13\. Complete Step 03.

14\. Record human decision.

15\. Complete Step 04.

16\. Approve Blueprint.

17\. Complete Step 05.

18\. Compare versions.

19\. Approve one output.

20\. Mirror approved outputs to Google Docs.

21\. Close app.

22\. Reopen app.

23\. Confirm all state, versions, approvals, and sync links remain.

```



\---



\## Implementation Order



Recommended build order:



```text id="41ih4i"

1\. Tauri + React shell

2\. SQLite setup and migrations

3\. Seed 16 workflow step definitions

4\. Project and episode models

5\. Bottom navigation UI

6\. Step workspace UI

7\. Prompt template registry

8\. Manual prompt rendering

9\. Manual paste output capture

10\. Artifact versioning

11\. Human review console

12\. Dependency unlocking

13\. Local snapshots

14\. Google Drive connection

15\. Prompt template import

16\. Google Docs output mirror

17\. Step 01–05 polish

18\. MVP acceptance test

```



\---



\## Phase After MVP



After MVP, implement:



```text id="kcabgo"

Step 06 — Multi-Agent Script Evaluator

Step 07 — Master Cut Builder

Step 08 — Final Polish

OpenAI / Gemini API execution

Version comparison improvements

Drive sync conflict handling

Step 09–16 production planning

External task tracking

Asset and rights dashboards

Final QA dashboard

```



\---



\## Definition of Done



The MVP is done when:



```text id="g3jcpp"

the local app runs reliably

manual mode works

steps 01–05 work end-to-end

all outputs are versioned

approval gates are enforced

Drive prompt import works

approved output sync works

state persists across restarts

the UI shows the complete 16-step workflow

no advanced automation bypasses human review

```



```

```




agents/skills/workflow-engine.md

agents/skills/ui-shell.md

agents/skills/security-qa.md

```



````markdown id="sl8xqb"

\# agents/skills/workflow-engine.md



\# Skill: Workflow Engine



\## Purpose



This skill defines how coding agents must implement, modify, and test the workflow engine for the Project Mina-Ale Production Workflow App.



Use this skill whenever working on:



\- workflow step definitions;

\- state transitions;

\- dependency logic;

\- step unlocking;

\- execution permissions;

\- human approval gates;

\- artifact version selection;

\- regeneration;

\- downstream staleness;

\- audit events;

\- workflow UI state.



\---



\## Core Principle



The workflow engine controls the creative production process.



It must protect the integrity of the 16-step workflow.



The workflow engine must never allow an unapproved output to become the input for a downstream step.



\---



\## Non-Negotiable Rules



1\. Do not bypass human approval.

2\. Do not use candidate outputs as dependencies.

3\. Do not overwrite approved artifact versions.

4\. Do not skip required upstream steps.

5\. Do not mark a step complete without an approved artifact version.

6\. Do not treat Google Drive sync as approval.

7\. Do not treat AI generation as completion.

8\. Do not silently invalidate downstream work.

9\. Do not hide blocked steps from the UI.

10\. Do not create new workflow states without updating documentation and tests.



\---



\## Canonical Workflow Steps



The workflow contains 16 steps.



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



\## Canonical Step Keys



```text id="2hb3ln"

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



\## Canonical States



Use only these primary states unless the state machine documentation is updated.



```text id="1s36gu"

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



\## Dependency Model



A step can depend on one or more approved artifact types.



Example:



```text id="l40057"

Step 04 requires:

\- research\_brief

\- angle\_generator\_output

\- angle\_evaluator\_output

```



The dependency must resolve to an exact approved artifact version.



Do not depend on “latest output” unless latest output is also the approved version.



\---



\## Dependency Graph



```text id="j5rgds"

01 → 02 → 03 → 04 → 05 → 06 → 07 → 08



08 → 09

08 → 10

10 → 11

11 → 12

09 → 13

12 + 13 → 14

14 → 15

13 + 15 → 16

```



\---



\## Required Dependencies by Step



```text id="42k3gq"

01 requires: none

02 requires: research\_brief

03 requires: angle\_generator\_output

04 requires: research\_brief, angle\_generator\_output, angle\_evaluator\_output

05 requires: research\_brief, angle\_evaluator\_output, script\_blueprint

06 requires: research\_brief, script\_blueprint, script\_versions

07 requires: research\_brief, script\_blueprint, script\_versions, multi\_agent\_script\_evaluation

08 requires: research\_brief, script\_blueprint, master\_cut\_script

09 requires: final\_polished\_script, research\_brief, script\_blueprint

10 requires: final\_polished\_script

11 requires: voice\_production\_plan

12 requires: final\_polished\_script, voice\_production\_plan, ai\_narration\_generation\_plan

13 requires: final\_polished\_script, visual\_layer\_plan, voice\_production\_plan

14 requires: final\_polished\_script, voice\_production\_plan, ai\_narration\_generation\_plan, audio\_cleanup\_podcast\_master\_plan, asset\_sourcing\_rights\_check\_plan

15 requires: final\_polished\_script, longform\_video\_assembly\_plan

16 requires: final\_polished\_script, derivatives\_package\_plan, asset\_sourcing\_rights\_check\_plan

```



\---



\## Step Unlocking



A step is unlocked when all required dependencies have approved artifact versions.



Pseudo-logic:



```text id="ubiq0j"

canUnlockStep(step, episode):

&#x20; for dependency in step.required\_dependencies:

&#x20;   if no approved artifact version exists for dependency:

&#x20;     return false

&#x20; return true

```



A step is executable when it is unlocked and all required prompt inputs are resolved.



```text id="654q1e"

canExecuteStep(step, episode):

&#x20; return canUnlockStep(step, episode)

&#x20;   AND required prompt variables are resolved

&#x20;   AND prompt template exists

&#x20;   AND rendered prompt has no unresolved required placeholders

```



\---



\## Approval Gate



Generated output is not approval.



A step becomes approved only after explicit human review.



Required approval conditions:



```text id="2kf12s"

artifact\_version\_id exists

local snapshot exists

human review decision = approve

artifact version status = approved

step state = approved

```



\---



\## Review Actions



Allowed human review actions:



```text id="zmz5yn"

approve

reject

request\_regeneration

manual\_edit

save\_as\_alternative

lock\_version

return\_to\_previous\_step

```



Each action must create a human review record and an audit event.



\---



\## Regeneration



Regeneration must create a new artifact version.



Supported regeneration modes:



```text id="o9e8ef"

same\_inputs\_same\_prompt

same\_inputs\_with\_feedback

edited\_inputs

updated\_prompt\_template

different\_model

manual\_paste\_replacement

manual\_edit\_replacement

```



Regeneration must not overwrite prior versions.



\---



\## Artifact Version Selection



A step may have many artifact versions.



Only one artifact version should normally be selected as approved dependency.



The app must distinguish:



```text id="rpwrmo"

current candidate version

approved version

locked version

rejected version

superseded version

alternative version

```



Downstream steps must reference exact approved artifact version IDs.



\---



\## Downstream Staleness



If an approved upstream artifact changes, downstream steps may become stale.



Do not delete downstream outputs.



Mark affected downstream step runs with:



```text id="ra81pz"

potentially\_stale = true

```



Show a warning:



```text id="2sh2os"

This step may be stale because an approved upstream artifact changed.

```



Allowed user actions:



```text id="dbxsb7"

keep current output

regenerate this step

duplicate as alternative branch

mark as reviewed anyway

```



\---



\## Sync Is Separate



Do not confuse sync state with workflow approval.



Examples:



```text id="yfpq9q"

approved + sync\_pending = valid dependency

synced + awaiting\_human\_review = not valid dependency

synced + rejected = not valid dependency

```



\---



\## Execution Modes



The workflow engine must support:



```text id="2z5izk"

manual\_paste

openai\_api

gemini\_api

```



Manual paste mode is mandatory.



API execution is optional in early MVP.



\---



\## Step Execution Flow



```text id="mjw4d1"

1\. Validate dependencies.

2\. Validate variables.

3\. Validate prompt template.

4\. Render prompt.

5\. Save rendered prompt snapshot.

6\. Execute through selected mode.

7\. Save output as artifact version.

8\. Enter awaiting\_human\_review.

9\. Wait for human decision.

10\. If approved, unlock downstream steps.

```



\---



\## Invalid Transitions



Disallow these transitions:



```text id="gm4sgm"

output\_generated → approved without review

awaiting\_human\_review → downstream\_unlocked without approval

rejected → approved without new review decision

candidate artifact → dependency

sync\_pending → approved without human review

synced → approved without human review

locked → overwritten

```



\---



\## Audit Events



Every important workflow action must create an audit event.



Required events:



```text id="1ru0b1"

STEP\_UNLOCKED

STEP\_BLOCKED

STEP\_INPUT\_UPDATED

PROMPT\_RENDERED

STEP\_EXECUTION\_STARTED

OUTPUT\_GENERATED

OUTPUT\_IMPORTED\_MANUALLY

HUMAN\_APPROVED

HUMAN\_REJECTED

REGENERATION\_REQUESTED

MANUAL\_EDIT\_CREATED

ARTIFACT\_LOCKED

ARTIFACT\_SUPERSEDED

STEP\_MARKED\_STALE

STEP\_FAILED

```



\---



\## UI State Output



The workflow engine should provide a UI-friendly status object.



Example:



```json id="j693uh"

{

&#x20; "stepNumber": 4,

&#x20; "stepKey": "script\_blueprint",

&#x20; "title": "04 — Script Blueprint Builder",

&#x20; "state": "input\_missing",

&#x20; "isUnlocked": true,

&#x20; "canRun": false,

&#x20; "missingInputs": \["human\_editorial\_decision"],

&#x20; "missingDependencies": \[],

&#x20; "approvedArtifactVersionId": null,

&#x20; "currentCandidateVersionId": null,

&#x20; "potentiallyStale": false,

&#x20; "allowedActions": \["fill\_inputs", "view\_prompt\_template"]

}

```



\---



\## Testing Requirements



Test:



```text id="d6ngzc"

Step 01 unlocks without dependency.

Step 02 blocks until Step 01 is approved.

Step 04 requires three approved artifacts.

Unapproved outputs cannot unlock next step.

Rejected outputs cannot unlock next step.

Approved outputs unlock downstream steps.

Regeneration creates a new version.

Locked artifacts cannot be overwritten.

Downstream steps are marked stale after upstream change.

Sync state does not imply approval.

Invalid transitions are rejected.

Audit events are created.

```



\---



\## MVP Scope



For MVP, fully implement workflow execution for:



```text id="g76g8y"

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

```



All 16 steps must exist in the registry and bottom navigation.



Steps 06–16 may be visible but disabled or marked as planned.



\---



\## Definition of Done



Workflow engine work is complete when:



```text id="ax8cof"

all 16 steps are registered

dependency graph exists

step states are enforced

invalid transitions are blocked

required inputs are checked

required upstream artifacts are checked

manual paste mode works

outputs become versioned artifacts

human review is mandatory

approved outputs unlock downstream steps

regeneration preserves prior versions

locked versions are protected

downstream stale warnings exist

audit events are created

UI can display step status clearly

```



```

```




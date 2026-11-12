\# docs/TEST\_STRATEGY.md



\# Test Strategy



\## Purpose



This document defines the testing strategy for the Project Mina-Ale Production Workflow App.



The app manages a local-first, human-reviewed, 16-step AI-assisted audiovisual production workflow.



Testing must prove that the app protects:



\- local ownership;

\- workflow integrity;

\- human approval checkpoints;

\- prompt correctness;

\- version history;

\- dependency rules;

\- Google Drive sync safety;

\- data persistence;

\- recovery from failures.



The app must not merely “work visually.”



It must preserve the creative production process safely.



\---



\## Core Testing Principle



The most important thing to test is not AI output quality.



The most important thing to test is workflow correctness.



The app must never:



```text

use an unapproved output as a dependency;

overwrite an approved version;

skip human review;

run a prompt with unresolved placeholders;

lose local snapshots;

treat Google Drive sync as approval;

silently replace prompt templates;

delete or modify Drive files destructively in MVP;

lose state after restart.

````



\---



\## Test Levels



Use the following test levels:



```text

1\. Unit tests

2\. Integration tests

3\. UI component tests

4\. End-to-end tests

5\. Manual acceptance tests

6\. Regression tests

```



\---



\## Unit Tests



Unit tests should cover isolated logic.



Required unit test areas:



```text

prompt placeholder extraction

placeholder-to-variable mapping

prompt rendering

unresolved placeholder detection

workflow state transitions

dependency unlocking

artifact version numbering

content hashing

file naming generation

episode slug generation

Drive sync status mapping

audit event creation

```



\---



\## Prompt Contract Tests



Prompt contract tests must prove that the app correctly understands structured prompt templates.



Test cases:



```text

extracts placeholders from prompt text

detects repeated placeholders

maps known placeholders to canonical variables

flags unmapped placeholders

blocks rendering when required variables are missing

renders prompt with approved upstream artifact content

stores rendered prompt snapshot

detects remote template hash changes

preserves old prompt template version

```



Example assertions:



```text

\[PASTE RESEARCH BRIEF HERE] maps to research\_brief

\[INSERT LANGUAGE AND REGION] maps to target\_language + target\_region

\[PASTE FINAL POLISHED SCRIPT HERE] maps to final\_polished\_script

```



\---



\## Workflow State Machine Tests



The workflow state machine must be tested thoroughly.



Required tests:



```text

new step starts as not\_started or blocked

Step 01 can become ready without upstream dependencies

Step 02 remains blocked until Step 01 has approved artifact

Step 03 remains blocked until Step 02 has approved artifact

Step 04 requires Research Brief, Angle Generator output, and Angle Evaluator output

generated output enters awaiting\_human\_review

generated output cannot become dependency without approval

rejected output does not unlock next step

approved output unlocks dependent step

regeneration creates new artifact version

locked artifact cannot be overwritten

sync\_pending does not mean approved

synced does not mean approved

failed step can be retried

```



\---



\## Artifact Versioning Tests



Versioning is critical.



Required tests:



```text

first output creates v001

regeneration creates v002

manual edit creates new version

approved version remains preserved

rejected version remains visible

superseded version remains stored

current version can differ from approved version

artifact dependency references exact approved version

new upstream approval marks downstream step potentially stale

```



The app must never overwrite prior versions.



\---



\## Human Review Tests



Human review must be explicit.



Required tests:



```text

output cannot be approved without artifact version

approval creates human review record

rejection creates human review record

regeneration request creates human review record

manual edit creates new artifact version

lock action creates locked version

approved version unlocks downstream step

rejected version does not unlock downstream step

```



\---



\## Local Snapshot Tests



Local snapshots are mandatory.



Required tests:



```text

rendered prompt snapshot is created before execution

output snapshot is created after output capture

snapshot path is stored in database

content hash matches snapshot content

missing snapshot blocks approval

approved artifact has local snapshot

app can reload snapshot after restart

```



\---



\## Google Drive Integration Tests



Use mocks for automated tests.



Do not rely on live Google Drive for routine automated test runs.



Required mocked tests:



```text

connect Drive account

select root folder

list prompt template folder

detect all 16 prompt docs

fetch prompt doc text

create episode folder

create step folder

create output Google Doc

store Drive link

record sync event

handle Drive API failure

handle missing remote folder

handle duplicate prompt documents

detect remote modified time change

```



\---



\## Google Docs Output Tests



Required tests:



```text

creates Google Doc for approved artifact

writes output content to Google Doc

stores remote document ID and URL

updates sync status to synced

handles write failure without losing local artifact

does not mark artifact unapproved if sync fails

```



Important rule:



```text

Drive sync failure must not destroy local approval state.

```



\---



\## Offline Mode Tests



The app must remain useful offline.



Required tests:



```text

opens existing project without Drive connection

opens existing episode without Drive connection

shows cached prompt templates

renders prompt using local cache

manual paste mode works offline

local artifact is created offline

human approval works offline

sync is queued for later

Drive-only actions are disabled offline

```



\---



\## AI Provider Tests



AI provider tests should use mocks.



Required tests:



```text

manual paste mode creates output artifact

OpenAI provider interface returns generated output

Gemini provider interface returns generated output

provider failure returns structured error

provider metadata is stored

token estimates are stored when available

manual mode works without API keys

```



The workflow engine must call the provider abstraction, not vendor APIs directly.



\---



\## UI Component Tests



UI components should be tested for workflow clarity.



Required UI tests:



```text

bottom navigation renders all 16 steps

blocked step is visible

blocked step explains why it is blocked

active step is highlighted

state indicators render correctly

review-needed indicator appears

sync indicator appears

step workspace shows left, center, and right panels

prompt preview disables run button when placeholders are unresolved

review console shows approve/reject/regenerate actions

version list shows all versions

```



\---



\## End-to-End MVP Tests



The core MVP end-to-end test should cover Steps 01–05.



Scenario:



```text

1\. Launch app.

2\. Create local project.

3\. Connect or mock Google Drive.

4\. Import 16 prompt templates.

5\. Create channel profile.

6\. Create episode.

7\. Complete Step 01 in manual mode.

8\. Approve Step 01 output.

9\. Confirm Step 02 unlocks.

10\. Complete Step 02 in manual mode.

11\. Approve Step 02 output.

12\. Confirm Step 03 unlocks.

13\. Complete Step 03.

14\. Approve Step 03 output.

15\. Confirm Step 04 unlocks.

16\. Complete Step 04.

17\. Approve Step 04 output.

18\. Confirm Step 05 unlocks.

19\. Complete Step 05.

20\. Approve one output version.

21\. Close app.

22\. Reopen app.

23\. Confirm all state persists.

```



\---



\## Manual Acceptance Tests



Manual acceptance tests should be performed before each release.



\### Test 1 — Prompt Import



```text

Connect Drive.

Select Project Mina-Ale.

Import prompt templates.

Confirm all 16 prompts appear.

Confirm Steps 01–05 are executable.

Confirm Steps 06–16 are visible.

```



\### Test 2 — Missing Input Blocking



```text

Create episode with incomplete data.

Open Step 01.

Attempt to run prompt.

Confirm app shows missing required inputs.

Fill required inputs.

Confirm run becomes available.

```



\### Test 3 — Human Approval Gate



```text

Generate or paste Step 01 output.

Do not approve it.

Open Step 02.

Confirm Step 02 remains blocked.

Approve Step 01.

Confirm Step 02 unlocks.

```



\### Test 4 — Regeneration



```text

Generate Step 02 v001.

Reject v001.

Add feedback.

Generate v002.

Approve v002.

Confirm v001 remains visible and rejected.

Confirm v002 is approved.

```



\### Test 5 — Drive Sync Failure



```text

Approve an output.

Disconnect internet or mock Drive failure.

Attempt sync.

Confirm local approval remains.

Confirm sync status is failed or pending.

Confirm retry is available.

```



\### Test 6 — Restart Persistence



```text

Create episode.

Complete Step 01.

Approve output.

Close app.

Reopen app.

Confirm project, episode, output, approval, and step unlock state remain.

```



\---



\## Regression Tests



Every change to workflow logic must run regression tests for:



```text

state transitions

dependency unlocking

prompt rendering

artifact versioning

human approval

local snapshots

database migrations

Drive sync safety

```



Any bug involving data loss, skipped approval, or overwritten versions must become a permanent regression test.



\---



\## Test Fixtures



Create fixture data for:



```text

sample project

sample channel

sample episode

sample prompt templates 01–05

sample approved research brief

sample angle generator output

sample angle evaluator output

sample script blueprint

sample script versions

sample Google Drive metadata

sample API response

sample sync conflict

```



Recommended fixture folder:



```text

tests/fixtures/

├── prompts/

│   ├── 01\_research\_brief.md

│   ├── 02\_angle\_generator.md

│   ├── 03\_angle\_evaluator.md

│   ├── 04\_script\_blueprint.md

│   └── 05\_script\_versions.md

├── artifacts/

├── drive/

└── api/

```



\---



\## Mocking Strategy



Mock external systems by default.



Mock:



```text

Google Drive API

Google Docs API

OpenAI API

Gemini API

filesystem failures

network failures

```



Live integration tests may exist but should be optional.



They must not run automatically without explicit user configuration.



\---



\## Test Data Safety



Never use real private Drive files in automated tests.



Never store real OAuth tokens in test fixtures.



Never store real API keys in test fixtures.



Never commit private episode content unless intentionally anonymized.



Use synthetic test data.



\---



\## Migration Tests



Every database migration must be tested.



Required checks:



```text

migration runs on empty database

migration runs on previous version database

foreign keys remain valid

existing artifacts remain readable

existing approvals remain valid

workflow step definitions are not duplicated

```



\---



\## Error Handling Tests



Every structured error should include:



```text

code

message

detail

recoverable

suggested\_action

source

```



Test these error cases:



```text

unresolved placeholders

missing dependency

missing prompt template

failed local snapshot write

failed Drive sync

AI provider failure

sync conflict

database migration failure

invalid state transition

```



\---



\## Performance Expectations



The app does not need enterprise-level scale in MVP.



Reasonable MVP expectations:



```text

open project under 2 seconds

load episode dashboard under 2 seconds

render prompt under 1 second for normal prompt sizes

save local snapshot under 1 second

load version history under 2 seconds

handle at least 100 episodes locally

handle at least 20 versions per step

```



\---



\## Accessibility Checks



Minimum accessibility expectations:



```text

keyboard navigation for primary actions

visible focus states

readable contrast

status indicators not only color-based

buttons have accessible labels

large text areas usable for long prompts and outputs

```



\---



\## Release Checklist



Before releasing an MVP build:



```text

all unit tests pass

workflow state tests pass

artifact versioning tests pass

manual mode tested

Drive import tested

output mirror tested

restart persistence tested

no secrets committed

database migration tested

bottom navigation shows all 16 steps

steps 01–05 complete end-to-end

known limitations documented

```



\---



\## Definition of Done



Testing is sufficient when:



```text

the app cannot run unresolved prompts

the app cannot use unapproved outputs downstream

the app cannot overwrite approved artifact versions

the app preserves local snapshots

the app survives restart with state intact

Drive failures do not destroy local work

manual mode works without API keys

steps 01–05 pass end-to-end

all 16 steps are visible in the UI

human review gates are enforced

```



```

```




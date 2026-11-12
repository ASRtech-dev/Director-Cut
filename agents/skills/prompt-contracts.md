\# agents/skills/prompt-contracts.md



\# Skill: Prompt Contracts



\## Purpose



This skill defines how coding agents must implement, modify, and test prompt template contracts for the Project Mina-Ale Production Workflow App.



Use this skill whenever working on:



\- prompt template import;

\- prompt parsing;

\- placeholder extraction;

\- placeholder mapping;

\- prompt rendering;

\- step input contracts;

\- upstream artifact dependencies;

\- prompt versioning;

\- rendered prompt snapshots;

\- execution blocking rules.



\---



\## Core Principle



Prompt templates are not plain text.



Prompt templates are structured workflow contracts.



Each prompt defines:



```text

what step it belongs to

what inputs it requires

what upstream outputs it depends on

what human decisions it needs

what artifact it produces

what review gate follows it

what downstream step it enables

````



The app must never execute a prompt as a generic text blob without validating its contract.



\---



\## Non-Negotiable Rules



1\. Do not run prompts with unresolved required placeholders.

2\. Do not use unapproved upstream outputs.

3\. Do not silently guess ambiguous placeholder mappings.

4\. Do not overwrite cached prompt template versions.

5\. Do not hardcode only one prompt.

6\. Do not bypass human input requirements.

7\. Do not treat prompt title alone as sufficient identity.

8\. Do not ignore remote prompt changes.

9\. Do not let generated outputs become dependencies without approval.

10\. Do not mutate original Google Docs prompt templates in MVP.



\---



\## Canonical Workflow Steps



The app must represent all 16 prompt steps:



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

```



\---



\## Canonical Step Keys



Use these keys consistently:



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



\## Prompt Template Identity



A prompt template must be identified by:



```text

step\_number

step\_key

title

source\_doc\_id

source\_doc\_url

template\_version

content\_hash

source\_modified\_time

```



Do not rely only on title matching.



\---



\## Prompt Template Versioning



When prompt content changes:



```text

create a new prompt\_template\_version

preserve the old version

store new content hash

extract placeholders again

update active version only after user confirmation if needed

```



Existing episode runs must continue referencing the prompt version that generated them.



\---



\## Placeholder Syntax



Detect placeholders like:



```text

\[PASTE RESEARCH BRIEF HERE]

\[PASTE FINAL POLISHED SCRIPT HERE]

\[INSERT LANGUAGE AND REGION]

\[INSERT HUMAN DECISIONS HERE]

\[ALLOWED / NOT ALLOWED / PARTIAL]

\[PRIMARY VERSION ONLY / CONTROLLED CONTRAST / ADAPTATION-CENTERED / OTHER]

\[SPANISH / TURKISH / ENGLISH / OTHER]

```



Do not assume every bracketed phrase is the same kind of placeholder.



Classify placeholders as:



```text

artifact\_input

human\_input

episode\_setting

channel\_setting

enum\_choice

optional\_context

unknown

```



\---



\## Canonical Variable Groups



\### Episode Variables



```text

episode\_topic

primary\_work

target\_channel

target\_language

target\_region

target\_audience

desired\_tone

spoiler\_policy

adaptation\_policy

research\_depth

visual\_style

source\_material\_policy

available\_tools

human\_editorial\_notes

```



\### Artifact Variables



```text

research\_brief

angle\_generator\_output

angle\_evaluator\_output

script\_blueprint

script\_versions

multi\_agent\_script\_evaluation

master\_cut\_script

final\_polished\_script

visual\_layer\_plan

voice\_production\_plan

ai\_narration\_generation\_plan

audio\_cleanup\_podcast\_master\_plan

asset\_sourcing\_rights\_check\_plan

longform\_video\_assembly\_plan

derivatives\_package\_plan

final\_qa\_export\_publish\_plan

```



\### Production Variables



```text

video\_topic

final\_thesis

target\_duration

generated\_narration\_files

known\_audio\_issues

available\_asset\_list

final\_video\_export\_details

final\_podcast\_export\_details

final\_metadata

known\_concerns\_before\_publishing

```



\---



\## Placeholder Mapping Rules



Use deterministic mapping when possible.



Examples:



```text

\[PASTE RESEARCH BRIEF HERE] → research\_brief

\[PASTE ANGLE \& THESIS GENERATOR OUTPUT HERE] → angle\_generator\_output

\[PASTE OUTPUT FROM MASTER PROMPT 3 HERE] → angle\_evaluator\_output

\[PASTE FULL OUTPUT FROM MASTER PROMPT 4 HERE] → script\_blueprint

\[PASTE FULL MASTER CUT SCRIPT HERE] → master\_cut\_script

\[PASTE FINAL POLISHED SCRIPT HERE] → final\_polished\_script

\[PASTE VISUAL PRODUCTION PLAN HERE] → visual\_layer\_plan

\[PASTE VOICE PRODUCTION PLAN HERE] → voice\_production\_plan

\[PASTE AI NARRATION GENERATION PLAN HERE] → ai\_narration\_generation\_plan

\[PASTE AUDIO MASTER PLAN HERE] → audio\_cleanup\_podcast\_master\_plan

\[PASTE ASSET SOURCING PLAN HERE] → asset\_sourcing\_rights\_check\_plan

\[PASTE LONG-FORM VIDEO ASSEMBLY PLAN HERE] → longform\_video\_assembly\_plan

\[PASTE DERIVATIVES PACKAGE PLAN HERE] → derivatives\_package\_plan

\[PASTE FINAL METADATA HERE] → final\_metadata

\[INSERT LANGUAGE AND REGION] → target\_language + target\_region

\[ALLOWED / NOT ALLOWED / PARTIAL] → spoiler\_policy

\[PRIMARY VERSION ONLY / CONTROLLED CONTRAST / ADAPTATION-CENTERED / OTHER] → adaptation\_policy

```



If mapping is ambiguous, mark it as `unknown` and require human mapping.



\---



\## Prompt Rendering Contract



Rendering must produce:



```text

rendered\_prompt\_text

rendered\_prompt\_hash

resolved\_variable\_map

unresolved\_placeholder\_list

source\_template\_version\_id

dependency\_artifact\_version\_ids

rendered\_prompt\_snapshot\_path

```



The rendered prompt must be saved locally before execution.



\---



\## Execution Blocking



Block prompt execution if:



```text

prompt template missing

prompt template version missing

required upstream artifact missing

upstream artifact not approved

required human input missing

required episode setting missing

required placeholder unresolved

prompt template sync conflict unresolved

step state is blocked

step state is locked

```



The UI must show the blocking reasons.



\---



\## Required Inputs by Step



\### Step 01



Requires no upstream artifact.



Requires human/episode inputs:



```text

episode\_topic

primary\_work

target\_language

target\_region

target\_channel

target\_audience

desired\_tone

spoiler\_policy

adaptation\_policy

research\_depth

sources\_or\_materials\_available

specific\_questions\_or\_suspicions

```



Produces:



```text

research\_brief

```



\---



\### Step 02



Requires:



```text

research\_brief

```



Produces:



```text

angle\_generator\_output

```



\---



\### Step 03



Requires:



```text

angle\_generator\_output

```



Produces:



```text

angle\_evaluator\_output

```



\---



\### Step 04



Requires:



```text

research\_brief

angle\_generator\_output

angle\_evaluator\_output

```



Produces:



```text

script\_blueprint

```



\---



\### Step 05



Requires:



```text

research\_brief

angle\_evaluator\_output

script\_blueprint

```



Produces:



```text

script\_versions

```



\---



\### Step 06



Requires:



```text

research\_brief

script\_blueprint

script\_versions

```



Produces:



```text

multi\_agent\_script\_evaluation

```



\---



\### Step 07



Requires:



```text

research\_brief

script\_blueprint

script\_versions

multi\_agent\_script\_evaluation

```



Produces:



```text

master\_cut\_script

```



\---



\### Step 08



Requires:



```text

research\_brief

script\_blueprint

master\_cut\_script

```



Produces:



```text

final\_polished\_script

```



\---



\### Step 09



Requires:



```text

final\_polished\_script

research\_brief

script\_blueprint

```



Produces:



```text

visual\_layer\_plan

```



\---



\### Step 10



Requires:



```text

final\_polished\_script

```



Produces:



```text

voice\_production\_plan

```



\---



\### Step 11



Requires:



```text

voice\_production\_plan

```



Produces:



```text

ai\_narration\_generation\_plan

```



\---



\### Step 12



Requires:



```text

final\_polished\_script

voice\_production\_plan

ai\_narration\_generation\_plan

```



Produces:



```text

audio\_cleanup\_podcast\_master\_plan

```



\---



\### Step 13



Requires:



```text

final\_polished\_script

visual\_layer\_plan

voice\_production\_plan

```



Produces:



```text

asset\_sourcing\_rights\_check\_plan

```



\---



\### Step 14



Requires:



```text

final\_polished\_script

voice\_production\_plan

ai\_narration\_generation\_plan

audio\_cleanup\_podcast\_master\_plan

asset\_sourcing\_rights\_check\_plan

```



Produces:



```text

longform\_video\_assembly\_plan

```



\---



\### Step 15



Requires:



```text

final\_polished\_script

longform\_video\_assembly\_plan

```



Produces:



```text

derivatives\_package\_plan

```



\---



\### Step 16



Requires:



```text

final\_polished\_script

derivatives\_package\_plan

asset\_sourcing\_rights\_check\_plan

```



Produces:



```text

final\_qa\_export\_publish\_plan

```



\---



\## Artifact Dependency Rule



A prompt must use exact approved artifact versions.



Do not use “latest output” unless it is explicitly the approved version.



Example:



```json

{

&#x20; "step": 4,

&#x20; "uses": \[

&#x20;   {

&#x20;     "artifact\_type": "research\_brief",

&#x20;     "artifact\_version\_id": "artifactver\_ep001\_s01\_v002"

&#x20;   },

&#x20;   {

&#x20;     "artifact\_type": "angle\_generator\_output",

&#x20;     "artifact\_version\_id": "artifactver\_ep001\_s02\_v001"

&#x20;   },

&#x20;   {

&#x20;     "artifact\_type": "angle\_evaluator\_output",

&#x20;     "artifact\_version\_id": "artifactver\_ep001\_s03\_v001"

&#x20;   }

&#x20; ]

}

```



\---



\## Rendered Prompt Snapshot



Every rendered prompt must be saved.



Recommended file path:



```text

.local-data/snapshots/episodes/EP001/S04/rendered\_prompt\_v001.md

```



This preserves reproducibility.



\---



\## Prompt Preview UI



The prompt preview must show:



```text

prompt template title

prompt template version

resolved variables

unresolved placeholders

dependency artifacts used

rendered prompt text

copy button

run button

manual paste button

```



Disable run if unresolved placeholders exist.



\---



\## Manual Paste Mode



Manual paste mode must work for every prompt.



Flow:



```text

render prompt

copy prompt

user executes externally

user pastes output

app saves artifact version

app enters review state

```



Manual paste mode must not require API keys.



\---



\## Regeneration Rules



Regeneration must create a new artifact version.



Allowed regeneration modes:



```text

same prompt same inputs

same prompt plus human feedback

edited inputs

updated prompt template

different model

manual paste replacement

manual edit replacement

```



Never overwrite previous output.



\---



\## Testing Requirements



Test:



```text

placeholder extraction

known placeholder mapping

unknown placeholder detection

required variable validation

upstream dependency validation

rendered prompt generation

rendered prompt snapshot creation

prompt version preservation

execution blocking

manual paste output capture

artifact dependency references

```



\---



\## MVP Scope



For MVP, fully implement prompt contracts for:



```text

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

```



Represent all 16 steps in the registry.



Steps 06–16 may be visible but disabled until later phases.



\---



\## Definition of Done



Prompt contract work is complete when:



```text

all 16 steps exist in the registry

Steps 01–05 can render prompts correctly

placeholders are extracted and mapped

unmapped placeholders are visible

unresolved required placeholders block execution

approved upstream artifacts are inserted correctly

rendered prompts are saved locally

manual paste mode works

outputs become versioned artifacts

human review is required before downstream use

prompt template versions are preserved

```



```

```




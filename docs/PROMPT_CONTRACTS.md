\# docs/PROMPT\_CONTRACTS.md



\# Prompt Contracts



\## Purpose



This document defines how the app must understand, store, validate, render, execute, version, and chain the 16 structured prompt templates used in the Project Mina-Ale production workflow.



The prompts are not simple text snippets.



They are workflow contracts.



Each prompt defines:



\- its position in the production process;

\- the inputs it requires;

\- the previous outputs it depends on;

\- the human decisions it needs;

\- the kind of artifact it produces;

\- the quality constraints of that artifact;

\- the next step it enables.



The app must therefore treat every prompt as a structured production object, not as a generic chatbot message.



\---



\## Core Rule



A prompt may only be executed when all required inputs are available, all required upstream artifacts are approved, and all unresolved placeholders have been replaced with valid content.



The app must block execution if required placeholders remain unresolved.



\---



\## Prompt Source



Prompt templates are stored as Google Docs.



The app imports them from the configured Google Drive project folder.



Expected source folder:



```text

Project Mina-Ale/

└── 00\_System/

&#x20;   └── Templates/

&#x20;       └── Process\_Prompts/

&#x20;           ├── 01 — Research Brief Builder

&#x20;           ├── 02 — Angle \& Thesis Generator

&#x20;           ├── 03 — Angle Evaluator

&#x20;           ├── 04 — Script Blueprint Builder

&#x20;           ├── 05 — Script Version Generator

&#x20;           ├── 06 — Multi-Agent Script Evaluator

&#x20;           ├── 07 — Master Cut Builder

&#x20;           ├── 08 — Layered Rewrite \& Final Polish

&#x20;           ├── 09 — Visual Layer Builder

&#x20;           ├── 10 — Voice Production Plan

&#x20;           ├── 11 — AI Narration Generation

&#x20;           ├── 12 — Audio Cleanup \& Podcast Master

&#x20;           ├── 13 — Asset Sourcing \& Rights Check

&#x20;           ├── 14 — Long-Form Video Assembly

&#x20;           ├── 15 — Derivatives Package

&#x20;           └── 16 — Final QA, Export \& Publish

````



The app should allow the user to map a different folder if needed.



\---



\## Prompt Template Identity



Each prompt template must have:



```text

step\_number

step\_key

title

source\_doc\_id

source\_doc\_url

source\_modified\_time

template\_hash

local\_cache\_path

template\_version

is\_active

```



Example:



```json

{

&#x20; "step\_number": 4,

&#x20; "step\_key": "script\_blueprint",

&#x20; "title": "04 — Script Blueprint Builder",

&#x20; "source\_doc\_id": "google\_doc\_id\_here",

&#x20; "source\_doc\_url": "https://docs.google.com/document/d/...",

&#x20; "source\_modified\_time": "2026-05-16T10:36:46Z",

&#x20; "template\_hash": "sha256\_hash\_here",

&#x20; "local\_cache\_path": ".local-data/prompts/04\_script\_blueprint/template\_v003.md",

&#x20; "template\_version": 3,

&#x20; "is\_active": true

}

```



\---



\## Prompt Template Versioning



Whenever the remote Google Doc changes, the app must detect a new template version.



A new template version should be created when:



\* the remote modified time changed;

\* the content hash changed;

\* the user manually refreshes the template;

\* the user imports a revised prompt;

\* the prompt title or step number changed.



Do not silently overwrite cached prompt templates.



Keep prior prompt template versions so older episode runs remain reproducible.



\---



\## Prompt Contract Structure



Each prompt contract must define:



```text

step\_number

step\_key

title

description

phase

input\_variables

required\_upstream\_artifacts

optional\_upstream\_artifacts

human\_questions

output\_artifact\_type

output\_folder

review\_required

default\_execution\_mode

allowed\_execution\_modes

default\_model\_settings

regeneration\_rules

next\_step\_candidates

quality\_gate

```



\---



\## Step Keys



Use these canonical step keys:



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



\## Prompt Phases



The 16 prompts belong to four major phases.



```text

research\_and\_strategy

script\_development

production\_planning

publishing\_and\_derivatives

```



Mapping:



```text

01 — research\_and\_strategy

02 — research\_and\_strategy

03 — research\_and\_strategy

04 — script\_development

05 — script\_development

06 — script\_development

07 — script\_development

08 — script\_development

09 — production\_planning

10 — production\_planning

11 — production\_planning

12 — production\_planning

13 — production\_planning

14 — production\_planning

15 — publishing\_and\_derivatives

16 — publishing\_and\_derivatives

```



\---



\## Placeholder Detection



The app must scan prompt templates for placeholder patterns.



Supported placeholder syntax:



```text

\[PASTE ... HERE]

\[INSERT ...]

\[ALLOWED / NOT ALLOWED / PARTIAL]

\[PRIMARY VERSION ONLY / CONTROLLED CONTRAST / ...]

\[SPANISH / TURKISH / ENGLISH / OTHER]

\[ADD TOOLS]

```



Examples:



```text

\[PASTE RESEARCH BRIEF HERE]

\[PASTE ANGLE \& THESIS GENERATOR OUTPUT HERE]

\[PASTE OUTPUT FROM MASTER PROMPT 3 HERE]

\[INSERT THE ANGLE YOU CHOSE / ANY HUMAN OVERRIDES / WHAT YOU WANT TO KEEP OR AVOID]

\[INSERT LANGUAGE AND REGION]

\[ALLOWED / NOT ALLOWED / PARTIAL]

\[PRIMARY VERSION ONLY / CONTROLLED CONTRAST / ADAPTATION-CENTERED / OTHER]

```



The app must extract placeholders and map them to canonical variables.



\---



\## Canonical Variables



Use canonical variable names to avoid coupling the app to exact placeholder wording.



Core episode variables:



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



Core artifact variables:



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



Production variables:



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



\## Placeholder Mapping Examples



```text

\[PASTE RESEARCH BRIEF HERE] → research\_brief



\[PASTE ANGLE \& THESIS GENERATOR OUTPUT HERE] → angle\_generator\_output



\[PASTE OUTPUT FROM MASTER PROMPT 3 HERE] → angle\_evaluator\_output



\[PASTE FULL OUTPUT FROM MASTER PROMPT 4 HERE] → script\_blueprint



\[PASTE FULL VERSION A HERE] → script\_version\_a



\[PASTE FULL VERSION B HERE] → script\_version\_b



\[PASTE FULL VERSION C HERE] → script\_version\_c



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



\---



\## Required Human Inputs by Step



\### Step 01 — Research Brief Builder



Required human inputs:



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



Required upstream artifacts:



```text

none

```



Output:



```text

research\_brief

```



\---



\### Step 02 — Angle \& Thesis Generator



Required human inputs:



```text

channel\_style

target\_language

target\_region

desired\_tone

audience

spoiler\_policy

adaptation\_priority

```



Required upstream artifacts:



```text

research\_brief

```



Output:



```text

angle\_generator\_output

```



\---



\### Step 03 — Angle Evaluator



Required human inputs:



```text

channel\_identity

target\_language

target\_region

desired\_tone

audience

strategic\_goals

```



Required upstream artifacts:



```text

angle\_generator\_output

```



Output:



```text

angle\_evaluator\_output

```



\---



\### Step 04 — Script Blueprint Builder



Required human inputs:



```text

human\_editorial\_decision

target\_language

target\_region

spoiler\_policy

adaptation\_policy

channel\_voice\_preferences

```



Required upstream artifacts:



```text

research\_brief

angle\_generator\_output

angle\_evaluator\_output

```



Output:



```text

script\_blueprint

```



\---



\### Step 05 — Script Version Generator



Required human inputs:



```text

human\_editorial\_notes

target\_language

target\_region

spoiler\_policy

adaptation\_policy

desired\_number\_of\_script\_versions

```



Required upstream artifacts:



```text

research\_brief

angle\_evaluator\_output

script\_blueprint

```



Output:



```text

script\_versions

```



\---



\### Step 06 — Multi-Agent Script Evaluator



Required human inputs:



```text

human\_editorial\_preferences

target\_language

target\_region

channel\_voice\_priorities

things\_to\_keep

things\_to\_avoid

```



Required upstream artifacts:



```text

research\_brief

script\_blueprint

script\_versions

```



Output:



```text

multi\_agent\_script\_evaluation

```



\---



\### Step 07 — Master Cut Builder



Required human inputs:



```text

human\_editorial\_decision

target\_language

target\_region

spoiler\_policy

adaptation\_policy

preferred\_base\_version

preferred\_hook

preferred\_tone

preferred\_punchlines

lines\_to\_keep

lines\_to\_remove

sections\_to\_strengthen

sections\_to\_shorten

```



Required upstream artifacts:



```text

research\_brief

script\_blueprint

script\_versions

multi\_agent\_script\_evaluation

```



Output:



```text

master\_cut\_script

```



\---



\### Step 08 — Layered Rewrite \& Final Polish



Required human inputs:



```text

human\_editorial\_notes

target\_language

target\_region

spoiler\_policy

adaptation\_policy

tone\_preferences

target\_audience

final\_polish\_goals

```



Required upstream artifacts:



```text

research\_brief

script\_blueprint

master\_cut\_script

```



Output:



```text

final\_polished\_script

```



\---



\### Step 09 — Visual Layer Builder



Required human inputs:



```text

human\_visual\_preferences

target\_platform

target\_language

target\_region

source\_material\_policy

visual\_style

allowed\_asset\_sources

```



Required upstream artifacts:



```text

final\_polished\_script

research\_brief

script\_blueprint

```



Output:



```text

visual\_layer\_plan

```



\---



\### Step 10 — Voice Production Plan



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

desired\_tone

narration\_language

target\_duration

ai\_voice\_type

```



Required upstream artifacts:



```text

final\_polished\_script

```



Output:



```text

voice\_production\_plan

```



\---



\### Step 11 — AI Narration Generation



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

narration\_language

desired\_tone

target\_duration

ai\_voice\_platform

ai\_voice\_type

```



Required upstream artifacts:



```text

voice\_production\_plan

```



Output:



```text

ai\_narration\_generation\_plan

```



\---



\### Step 12 — Audio Cleanup \& Podcast Master



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

narration\_language

desired\_tone

target\_duration

audio\_tools\_available

podcast\_platforms

generated\_narration\_files

known\_audio\_issues

```



Required upstream artifacts:



```text

final\_polished\_script

voice\_production\_plan

ai\_narration\_generation\_plan

```



Output:



```text

audio\_cleanup\_podcast\_master\_plan

```



\---



\### Step 13 — Asset Sourcing \& Rights Check



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

narration\_language

desired\_tone

target\_duration

visual\_style\_references

available\_asset\_sources

editing\_tool

```



Required upstream artifacts:



```text

final\_polished\_script

visual\_layer\_plan

voice\_production\_plan

```



Output:



```text

asset\_sourcing\_rights\_check\_plan

```



\---



\### Step 14 — Long-Form Video Assembly



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

narration\_language

desired\_tone

target\_duration

primary\_platform

derivative\_formats

editing\_software

visual\_style

available\_asset\_list

```



Required upstream artifacts:



```text

final\_polished\_script

voice\_production\_plan

ai\_narration\_generation\_plan

audio\_cleanup\_podcast\_master\_plan

asset\_sourcing\_rights\_check\_plan

```



Output:



```text

longform\_video\_assembly\_plan

```



\---



\### Step 15 — Derivatives Package



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

narration\_language

desired\_tone

master\_video\_duration

primary\_platform

derivative\_platforms

editing\_tools

available\_exports

final\_transcript

video\_sections\_or\_timestamps

existing\_title\_or\_thumbnail\_ideas

```



Required upstream artifacts:



```text

final\_polished\_script

longform\_video\_assembly\_plan

```



Output:



```text

derivatives\_package\_plan

```



\---



\### Step 16 — Final QA, Export \& Publish



Required human inputs:



```text

video\_topic

final\_thesis

target\_audience

narration\_language

desired\_tone

master\_video\_duration

primary\_platform

derivative\_platforms

editing\_software

short\_form\_tool

podcast\_hosting

final\_video\_export\_details

final\_podcast\_export\_details

final\_metadata

known\_concerns\_before\_publishing

```



Required upstream artifacts:



```text

final\_polished\_script

derivatives\_package\_plan

asset\_sourcing\_rights\_check\_plan

```



Output:



```text

final\_qa\_export\_publish\_plan

```



\---



\## Output Artifact Types



Use these canonical artifact types:



```text

research\_brief

angle\_list

angle\_evaluation

script\_blueprint

script\_versions

script\_evaluation

master\_cut\_script

final\_polished\_script

visual\_layer\_plan

voice\_production\_plan

ai\_narration\_generation\_plan

audio\_cleanup\_master\_plan

asset\_rights\_plan

longform\_assembly\_plan

derivatives\_package

final\_qa\_publish\_plan

```



\---



\## Prompt Rendering



Prompt rendering is the process of replacing placeholders with approved values and artifacts.



Rendering must produce:



```text

rendered\_prompt\_text

rendered\_prompt\_hash

resolved\_variable\_map

unresolved\_placeholder\_list

source\_template\_version\_id

dependency\_artifact\_version\_ids

```



The rendered prompt should be saved locally before execution.



Example local path:



```text

.local-data/snapshots/episodes/EP001/S04/rendered\_prompt\_v001.md

```



\---



\## Execution Blocking Rules



A prompt must be blocked if:



```text

required prompt template missing

required upstream artifact missing

required upstream artifact not approved

required human input missing

required placeholder unresolved

template sync conflict unresolved

step currently locked

step already running

```



The app must display the exact blocking reason.



\---



\## Human Review Requirement



Every step requires human review by default.



The review screen must show:



```text

step number

step title

rendered prompt

generated output

input artifacts used

human inputs used

model/provider metadata

version number

approval actions

feedback field

regeneration options

sync status

```



\---



\## Regeneration Contract



Regeneration creates a new artifact version.



Regeneration may happen from:



```text

same rendered prompt

same prompt with new feedback

same prompt with edited inputs

same prompt with different model

same prompt with updated template

manual replacement output

```



Regeneration must preserve prior versions.



\---



\## Manual Edit Contract



A user may manually edit or replace an output.



Manual edits must create a new artifact version with:



```text

source\_type = manual\_edit

parent\_artifact\_version\_id = previous\_version\_id

human\_editor\_id = local\_user

edit\_reason

created\_at

```



Manual edits may be approved like generated outputs.



\---



\## Dependency Contract



A downstream step must reference exact approved artifact versions, not just step numbers.



Example:



```json

{

&#x20; "step": 4,

&#x20; "uses": \[

&#x20;   {

&#x20;     "artifact\_type": "research\_brief",

&#x20;     "artifact\_version\_id": "av\_001"

&#x20;   },

&#x20;   {

&#x20;     "artifact\_type": "angle\_list",

&#x20;     "artifact\_version\_id": "av\_002"

&#x20;   },

&#x20;   {

&#x20;     "artifact\_type": "angle\_evaluation",

&#x20;     "artifact\_version\_id": "av\_003"

&#x20;   }

&#x20; ]

}

```



This preserves reproducibility.



\---



\## Prompt Contract JSON Shape



Recommended internal shape:



```json

{

&#x20; "step\_number": 4,

&#x20; "step\_key": "script\_blueprint",

&#x20; "title": "04 — Script Blueprint Builder",

&#x20; "phase": "script\_development",

&#x20; "source\_doc\_id": "GOOGLE\_DOC\_ID",

&#x20; "input\_variables": \[

&#x20;   {

&#x20;     "key": "human\_editorial\_decision",

&#x20;     "label": "Human editorial decision",

&#x20;     "required": true,

&#x20;     "source": "human"

&#x20;   },

&#x20;   {

&#x20;     "key": "target\_language",

&#x20;     "label": "Target language",

&#x20;     "required": true,

&#x20;     "source": "episode"

&#x20;   }

&#x20; ],

&#x20; "required\_upstream\_artifacts": \[

&#x20;   "research\_brief",

&#x20;   "angle\_generator\_output",

&#x20;   "angle\_evaluator\_output"

&#x20; ],

&#x20; "output\_artifact\_type": "script\_blueprint",

&#x20; "review\_required": true,

&#x20; "allowed\_execution\_modes": \[

&#x20;   "manual\_paste",

&#x20;   "openai\_api",

&#x20;   "gemini\_api"

&#x20; ],

&#x20; "default\_execution\_mode": "manual\_paste",

&#x20; "next\_step\_candidates": \[

&#x20;   "script\_version\_generator"

&#x20; ]

}

```



\---



\## Placeholder Validation



Validation should return:



```text

is\_valid

missing\_variables

unresolved\_placeholders

blocked\_dependencies

warnings

```



Example:



```json

{

&#x20; "is\_valid": false,

&#x20; "missing\_variables": \["target\_language", "spoiler\_policy"],

&#x20; "unresolved\_placeholders": \["\[INSERT LANGUAGE AND REGION]"],

&#x20; "blocked\_dependencies": \["research\_brief is not approved"],

&#x20; "warnings": \["Template changed remotely since last import."]

}

```



\---



\## Step-Specific Review Emphasis



The review console should adapt by step.



\### Steps 01–04



Focus on:



```text

research quality

angle strength

strategic direction

thesis clarity

creative decision

```



\### Steps 05–08



Focus on:



```text

script quality

voice

structure

emotional force

publishability

```



\### Steps 09–14



Focus on:



```text

production usability

visual clarity

audio workflow

asset completeness

rights awareness

editing feasibility

```



\### Steps 15–16



Focus on:



```text

platform packaging

derivative usefulness

metadata quality

QA completeness

release readiness

```



\---



\## Prompt Contract Quality Rules



A prompt contract is valid when:



```text

step number is unique

step key is unique

source Google Doc exists

output artifact type is defined

required inputs are mapped

required upstream artifacts are defined

placeholders are detected

unresolved placeholders can be shown to the user

review is required

next step is known

```



\---



\## MVP Prompt Contract Scope



For MVP, implement full contracts for:



```text

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

04 — Script Blueprint Builder

05 — Script Version Generator

```



Represent steps 06–16 in the registry, but they may initially be disabled or marked as planned.



The UI should still show all 16 steps.



\---



\## Future Improvements



Later versions may add:



```text

prompt contract editor

visual placeholder mapping

automatic contract inference from prompt text

contract diff when prompt changes

per-channel prompt overrides

per-language prompt variants

prompt quality scoring

template migration tools

shared prompt library export

```



\---



\## Definition of Done



Prompt contract implementation is complete when:



```text

all 16 prompts are registered

Google Docs templates can be imported

placeholders are extracted

placeholders are mapped to canonical variables

unresolved placeholders block execution

required upstream artifacts are enforced

rendered prompts are saved locally

outputs are saved as versioned artifacts

human approval is required before dependency use

template versions are tracked

manual paste mode works

```



```

```




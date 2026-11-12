\# docs/UI\_MAP.md



\# UI Map



\## Purpose



This document defines the user interface structure for the Project Mina-Ale Production Workflow App.



The app should feel like a local creative production console.



The interface is inspired by DaVinci Resolve’s page-based workflow, especially its persistent bottom navigation that allows the user to move between major production modules.



The goal is not to copy DaVinci Resolve visually.



The goal is to adapt its mental model:



```text

different production phases,

one continuous project,

clear bottom module navigation,

specialized workspaces,

persistent status awareness.

````



\---



\## Core UI Principle



The user must always know:



```text

Which episode am I working on?

Which workflow step am I in?

What does this step need?

What input is being used?

What output exists?

Is this output approved?

Is this output synced?

What is the next allowed action?

```



The app must never feel like an endless chat.



It must feel like a controlled production workflow.



\---



\## Main Application Layout



The app uses a persistent shell.



```text id="2n5dnd"

┌──────────────────────────────────────────────────────────────┐

│ Top Bar                                                      │

│ Project / Episode / Channel / Sync / Settings               │

├──────────────────────────────────────────────────────────────┤

│ Main Workspace                                               │

│                                                              │

│ ┌───────────────┬──────────────────────────┬──────────────┐ │

│ │ Left Panel    │ Center Panel              │ Right Panel  │ │

│ │ Inputs        │ Prompt / Output / Review  │ Actions      │ │

│ │ Sources       │ Document / Diff           │ Status       │ │

│ │ Variables     │ Version View              │ Checklist    │ │

│ └───────────────┴──────────────────────────┴──────────────┘ │

├──────────────────────────────────────────────────────────────┤

│ Bottom Workflow Navigation                                   │

│ 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16             │

└──────────────────────────────────────────────────────────────┘

```



\---



\## Top Bar



The top bar is persistent across the whole app.



It should include:



```text id="ot76gv"

Project selector

Episode selector

Channel indicator

Current step title

Google Drive sync status

Local save status

Search button

Settings button

```



Suggested layout:



```text id="ge5riw"

\[Project Mina-Ale]  \[EP001 — Topic Title]  \[Spanish AI/Future]

&#x20;                                     \[Drive: Connected] \[Local: Saved] \[Settings]

```



\---



\## Bottom Navigation



The bottom navigation is the primary workflow map.



It must show all 16 steps at all times.



Each item should include:



```text id="a7iffl"

step number

short label

icon

state indicator

review-needed indicator

sync indicator

stale warning if relevant

```



\---



\## Bottom Navigation Items



```text id="qil7jv"

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



\---



\## Suggested Icons



Use a consistent icon set such as Lucide.



Suggested icon mapping:



```text id="72co3p"

01 Research      → Search / FileSearch

02 Angles        → Lightbulb

03 Evaluate      → Scale / ListChecks

04 Blueprint     → Map / Workflow

05 Drafts        → FilePen

06 Board         → Users / PanelsTopLeft

07 Master        → Scissors / FileCheck

08 Polish        → Sparkles

09 Visuals       → Images

10 Voice         → Mic

11 Narration     → AudioLines

12 Audio         → SlidersHorizontal / Waves

13 Assets        → FolderSearch

14 Assembly      → Clapperboard

15 Derivatives   → Split / Share2

16 Publish       → Rocket / BadgeCheck

```



\---



\## Navigation Behavior



Clicking a bottom icon opens that step workspace.



A blocked step is still clickable.



If a step is blocked, the workspace must show why.



Do not hide unavailable steps.



The full process must remain visible.



\---



\## Step State Indicators



Each bottom navigation item should visually indicate state.



```text id="yzpdox"

not\_started              neutral dot

blocked                  red lock

ready                    blue dot

input\_missing            yellow dot

input\_ready              blue play icon

running                  purple spinner

output\_generated         blue document icon

awaiting\_human\_review    orange review dot

approved                 green check

rejected                 red x

regeneration\_requested   purple refresh

superseded               gray faded icon

locked                   green lock

failed                   red warning

sync\_pending             yellow cloud

synced                   green cloud check

sync\_conflict            orange/red cloud warning

```



\---



\## Main Workspace Panels



Each step workspace uses the same base structure.



\### Left Panel



Purpose:



```text id="uxqcbd"

inputs

source artifacts

prompt variables

human questions

dependency list

```



The left panel answers:



```text id="mx984d"

What does this step need?

Where does the input come from?

What is missing?

```



\### Center Panel



Purpose:



```text id="hx0qya"

rendered prompt preview

generated output

Google Doc mirror preview

version comparison

manual paste area

```



The center panel answers:



```text id="6vj8fb"

What will be sent to the AI?

What did the AI produce?

What changed between versions?

```



\### Right Panel



Purpose:



```text id="qrbrrq"

current state

allowed actions

quality checklist

sync status

review decision

regeneration options

```



The right panel answers:



```text id="2ngswg"

What can I do now?

Is this good enough?

Can I continue?

```



\---



\## Workspace Modes



Each step workspace can display different modes.



```text id="iz52dw"

Overview

Inputs

Prompt Preview

Run

Review

Versions

Sync

Checklist

```



The center panel changes depending on the selected mode.



\---



\## Step Workspace Header



Every step workspace should show:



```text id="p7hw7k"

Step number

Step title

Step phase

Current state

Output artifact type

Approved version, if any

Last updated time

```



Example:



```text id="b30rkr"

04 — Script Blueprint Builder

Phase: Script Development

State: Awaiting Human Review

Output: Script Blueprint

Current Version: v002

```



\---



\## Episode Dashboard



The episode dashboard is the home screen for a selected episode.



It should show:



```text id="0tctfc"

episode title

channel

language

target audience

desired tone

current step

overall workflow progress

step status grid

recent outputs

next recommended action

Drive sync summary

production risk warnings

```



\---



\## Episode Dashboard Layout



```text id="94ulz5"

┌──────────────────────────────────────────────────────────────┐

│ Episode Header                                               │

│ EP001 — Topic Title                                          │

│ Channel / Language / Tone                                    │

├───────────────────────────────┬──────────────────────────────┤

│ Workflow Progress             │ Next Action                  │

│ 16-step grid                   │ "Review Step 03 output"      │

├───────────────────────────────┼──────────────────────────────┤

│ Recent Artifacts               │ Sync / Warnings              │

│ v001 / v002 / approved docs    │ Drive, stale, missing inputs │

└───────────────────────────────┴──────────────────────────────┘

```



\---



\## Project Dashboard



The project dashboard shows all episodes.



It should include:



```text id="t7hpdn"

episode list

channel filter

status filter

current workflow step

last updated date

Drive sync status

production status

```



Suggested columns:



```text id="m2rs7c"

Episode

Channel

Language

Current Step

Status

Approved Outputs

Sync

Updated

```



\---



\## Channel Profile Screen



Channel profiles should store reusable defaults.



Fields:



```text id="3utsvt"

channel name

language

region

target audience

desired tone

narrator mode

visual style

default duration

spoiler policy

adaptation policy

podcast policy

shorts policy

source policy

default model settings

```



The episode creation form should be able to inherit these values.



\---



\## Episode Creation Flow



The episode creation flow should be guided.



Required fields:



```text id="6xicnh"

episode title

topic

primary work

channel

target language

target region

target audience

desired tone

spoiler policy

adaptation policy

research depth

initial notes or source materials

```



The app should generate:



```text id="bqi1dn"

episode code

slug

local folder

optional Drive folder

initial workflow step runs

```



\---



\## Step 01 UI — Research



Purpose:



Create or import the Research Brief.



Main left panel fields:



```text id="tvb3e8"

topic

primary work

target channel

target audience

language and region

tone

spoiler policy

adaptation policy

research depth

sources or materials

specific questions

```



Center panel modes:



```text id="1mlftd"

prompt preview

manual output paste

generated research brief

version comparison

```



Right panel checklist:



```text id="vxsyp4"

facts separated from interpretation

concrete evidence included

symbols and motifs identified

emotional wounds specific

source/fact-check warnings present

angle-ready handoff included

```



\---



\## Step 02 UI — Angles



Purpose:



Generate possible video essay angles.



Inputs:



```text id="ch79qa"

approved research brief

channel style

target audience

tone

language and region

spoiler policy

adaptation priority

```



Review emphasis:



```text id="rllxzo"

angles are distinct

each angle argues something

emotional wounds are specific

visual potential exists

ranking is decisive

```



Special action:



```text id="632rqh"

Select preferred angle

Create hybrid angle note

Send decision to Step 03 or Step 04

```



\---



\## Step 03 UI — Evaluate



Purpose:



Stress-test and rank proposed angles.



Inputs:



```text id="nf1j52"

angle generator output

channel identity

strategic goals

human notes

```



Special view:



```text id="aaoaho"

angle ranking table

top 3 stress test

recommended thesis

human decision capture

```



Required human decision before Step 04:



```text id="t3xzfy"

chosen angle

approved thesis direction

what to keep

what to avoid

```



\---



\## Step 04 UI — Blueprint



Purpose:



Build the script architecture.



Inputs:



```text id="gp1d2f"

research brief

angle generator output

angle evaluator output

human editorial decision

target language

spoiler policy

adaptation policy

channel voice preferences

```



Review emphasis:



```text id="u1msad"

central thesis is specific

argument spine is clear

midpoint turn exists

counterpoint is strong

evidence map is concrete

visual logic is present

execution rules are usable

```



\---



\## Step 05 UI — Drafts



Purpose:



Generate script versions.



Inputs:



```text id="cg9at2"

research brief

angle evaluator output

approved blueprint

human editorial notes

target language

spoiler policy

adaptation policy

number of script versions

```



Special view:



```text id="jz09w7"

Version A — Analytical Cut

Version B — Punchy Cut

Version C — Cinematic-Emotional Cut

Comparison table

```



Review emphasis:



```text id="iudnm8"

versions are meaningfully different

all preserve thesis

hooks differ

midpoint exists in all versions

counterpoint exists in all versions

post-generation comparison is useful

```



\---



\## Step 06 UI — Board



Purpose:



Evaluate multiple script versions.



Special view:



```text id="czpcjj"

multi-agent role tabs

score table

section-by-section comparison

best material extraction

master cut strategy

```



Review emphasis:



```text id="sod07x"

clear recommendation

best hook selected

best structure identified

best material extracted

weak material marked for removal

master cut instructions usable

```



\---



\## Step 07 UI — Master



Purpose:



Build the master cut.



Special view:



```text id="a8fj1c"

editorial assembly plan

master cut script

post-cut notes

```



Review emphasis:



```text id="gthpmf"

single coherent voice

not a patchwork

approved thesis preserved

best material integrated

midpoint clear

counterpoint genuine

closing strong

```



\---



\## Step 08 UI — Polish



Purpose:



Final script polish.



Special view:



```text id="d65udf"

polish summary

final polished script

change log

readiness verdict

```



Review emphasis:



```text id="eb6qo5"

script is narrator-ready

voice is consistent

oral rhythm works

punchlines are natural

emotional closing lands

ready for visual layering

```



\---



\## Step 09 UI — Visuals



Purpose:



Create the visual layer plan.



Special view:



```text id="tyhewy"

visual strategy overview

section-level visual map

beat-by-beat visual plan

motif system

text-on-screen plan

asset search list

```



Review emphasis:



```text id="pr0v3x"

visuals serve argument

abstract passages have visual strategies

motifs are coherent

asset list is practical

visual risks are identified

```



\---



\## Step 10 UI — Voice



Purpose:



Prepare voice production plan.



Special view:



```text id="wmhlzr"

general narration diagnosis

vocal performance rules

narration blocks

orally optimized version

emotional narration map

pre-generation checklist

```



Review emphasis:



```text id="04b2cf"

blocks usable for ElevenLabs

voice direction clear

difficult words identified

pauses marked

script works as podcast audio

```



\---



\## Step 11 UI — Narration



Purpose:



Plan AI narration generation.



Special view:



```text id="2y00d6"

generation strategy

ElevenLabs settings guide

block-by-block generation sheet

file naming system

quality control checklist

regeneration rules

```



Review emphasis:



```text id="powtcv"

blocks are practical

file names are clean

generation settings reasonable

QC checklist useful

regeneration rules clear

```



\---



\## Step 12 UI — Audio



Purpose:



Plan cleanup and podcast master.



Special view:



```text id="6pbs3p"

audio diagnosis plan

assembly workflow

cleanup chain

podcast mastering targets

YouTube audio targets

export plan

```



Review emphasis:



```text id="0sg8n7"

workflow can be followed manually

targets are clear

audio repair vs regeneration is distinguished

podcast and video versions are separated

```



\---



\## Step 13 UI — Assets



Purpose:



Plan assets and rights.



Special view:



```text id="zrmxnj"

visual asset map

asset priority list

rights risk classification

third-party usage rules

AI visual generation plan

source tracking sheet

pre-edit checklist

```



Review emphasis:



```text id="gm2n44"

essential assets clear

rights risks flagged

source tracking practical

third-party clips justified

fallback plans present

```



\---



\## Step 14 UI — Assembly



Purpose:



Plan long-form video assembly.



Special view:



```text id="grk6ll"

editorial assembly strategy

DaVinci Resolve project setup

scene-by-scene edit map

visual rhythm plan

music and sound plan

review pass system

export preparation

```



Review emphasis:



```text id="d1ri5t"

DaVinci setup practical

scene map usable

visual rhythm clear

music does not overpower narration

review passes complete

```



\---



\## Step 15 UI — Derivatives



Purpose:



Create derivative package.



Special view:



```text id="bc2m1e"

podcast adaptation plan

shorts/reels candidate extraction

short-form scripts

vertical editing plan

YouTube packaging

metadata

publishing calendar

```



Review emphasis:



```text id="urq4d3"

clips are self-contained

podcast works without visuals

titles and thumbnails align with thesis

metadata is platform-ready

release plan is coherent

```



\---



\## Step 16 UI — Publish



Purpose:



Final QA and publish plan.



Special view:



```text id="wq9fb3"

final package inventory

technical QA

editorial QA

rights QA

podcast QA

shorts QA

metadata QA

export specs

manual publishing sequence

go/no-go decision

```



Review emphasis:



```text id="25abif"

clear go/no-go decision

technical QA complete

rights risks visible

metadata ready

archive plan present

```



\---



\## Review Console



Every step must include a review console.



Actions:



```text id="ywoevl"

Approve

Reject

Regenerate

Edit manually

Save as alternative

Compare versions

Lock approved version

Sync to Drive

Continue to next step

```



No step should auto-approve.



\---



\## Version Comparison UI



Version comparison should support:



```text id="mqecoc"

v001 vs v002

approved vs candidate

local vs Drive

manual edit vs AI output

```



MVP can use simple side-by-side text comparison.



Future version can use inline diff.



\---



\## Prompt Preview UI



Prompt preview should show:



```text id="7xp57n"

source template version

resolved variables

unresolved placeholders

rendered prompt

dependency artifacts used

copy button

run button

manual mode button

```



If placeholders are unresolved, the run button must be disabled.



\---



\## Missing Input UI



When inputs are missing, show:



```text id="23jab5"

required field name

source expected

why it is needed

quick action to fill it

```



Example:



```text id="l5op7u"

Missing: Human editorial decision

Needed for: Step 04 — Script Blueprint Builder

Action: Select chosen angle or write override note

```



\---



\## Drive Sync UI



The app should show Drive status without dominating the creative workflow.



Indicators:



```text id="pws4nt"

Connected account

Root folder selected

Prompt templates imported

Output synced

Sync pending

Sync conflict

Offline mode

```



Drive actions:



```text id="79fbbd"

Refresh templates

Sync approved output

Open in Google Docs

Open Drive folder

Resolve conflict

```



\---



\## Settings Screen



Settings should include:



```text id="wamhr7"

Google Drive connection

AI provider settings

default execution mode

local data folder

sync mode

theme

channel defaults

prompt template folder mapping

backup/export settings

```



\---



\## Theme Direction



The UI should be clean, dark, production-oriented, and calm.



Suggested tone:



```text id="i14fib"

dark interface

high contrast text

subtle accent colors

DaVinci-inspired bottom navigation

cards for artifacts

clear status badges

minimal decorative effects

```



Avoid:



```text id="h0sjgx"

chatbot-looking interface

bright SaaS dashboard style

overloaded sidebars

excessive animations

unclear status colors

hidden workflow steps

```



\---



\## MVP UI Scope



MVP must include:



```text id="tjpam6"

project dashboard

episode dashboard

episode creation flow

bottom navigation with 16 steps

step workspace layout

prompt preview

manual paste mode

output review console

approve/reject/regenerate

version list

Drive connection status

settings screen

```



Steps 01–05 must be fully usable.



Steps 06–16 may initially show structure and status but can be disabled or marked as planned.



\---



\## Future UI Features



Later versions may include:



```text id="wp09y3"

inline diff

rich markdown renderer

Google Docs embedded preview

drag-and-drop asset tracker

visual production board

audio file tracker

rights risk dashboard

publication calendar

cross-episode search

channel style memory

collaborative review mode

```



\---



\## Definition of Done



The UI map is implemented when:



```text id="3r9mwy"

the app has a persistent top bar

the app has a persistent 16-step bottom navigation

each step opens a dedicated workspace

blocked steps are visible and explain why they are blocked

inputs, prompt preview, output, review, and actions are clearly separated

human review is explicit

version history is accessible

Drive sync status is visible

the interface feels like a production console rather than a chatbot

steps 01–05 can be completed through the UI

```



```

```




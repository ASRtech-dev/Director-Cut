\# agents/skills/ui-shell.md



\# Skill: UI Shell



\## Purpose



This skill defines how coding agents must implement, modify, and test the user interface shell for the Project Mina-Ale Production Workflow App.



Use this skill whenever working on:



\- app layout;

\- bottom navigation;

\- step workspaces;

\- episode dashboard;

\- review console;

\- prompt preview;

\- version comparison;

\- Drive sync indicators;

\- settings screens;

\- visual design system.



\---



\## Core Principle



The app must feel like a production console, not a chatbot.



The interface should be inspired by DaVinci Resolve’s page-based workflow:



```text

one project,

multiple specialized production pages,

persistent bottom navigation,

clear phase separation,

strong status awareness.

````



The app should help the user move through a controlled creative process.



\---



\## Non-Negotiable Rules



1\. Always show the 16-step workflow.

2\. Do not hide blocked steps.

3\. Do not make the interface look like an endless chat.

4\. Do not allow the user to accidentally bypass human review.

5\. Do not present AI output as final before approval.

6\. Do not obscure version history.

7\. Do not make Drive sync status look like creative approval.

8\. Do not overload the UI with unnecessary dashboards in MVP.

9\. Do not remove manual paste mode.

10\. Do not create UI flows that require cloud deployment.



\---



\## Main Layout



The app should use a persistent shell:



```text id="nl3bd3"

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



\## Top Bar Requirements



The top bar must show:



```text id="oyq5sl"

current project

current episode

current channel

current workflow step

local save status

Google Drive status

settings access

```



Recommended structure:



```text id="2erd2o"

\[Project Mina-Ale] \[EP001 — Episode Title] \[Channel]

&#x20;                                    \[Local Saved] \[Drive Connected] \[Settings]

```



\---



\## Bottom Navigation Requirements



The bottom navigation is the core UI metaphor.



It must contain all 16 steps:



```text id="d66t77"

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



Each item must show:



```text id="8jiaqe"

step number

short label

icon

state indicator

review indicator

sync indicator

stale indicator if needed

```



\---



\## Suggested Icons



Use a consistent icon system, preferably Lucide.



```text id="qah4ap"

01 Research      Search / FileSearch

02 Angles        Lightbulb

03 Evaluate      Scale / ListChecks

04 Blueprint     Map / Workflow

05 Drafts        FilePen

06 Board         Users / PanelsTopLeft

07 Master        Scissors / FileCheck

08 Polish        Sparkles

09 Visuals       Images

10 Voice         Mic

11 Narration     AudioLines

12 Audio         SlidersHorizontal / Waves

13 Assets        FolderSearch

14 Assembly      Clapperboard

15 Derivatives   Split / Share2

16 Publish       Rocket / BadgeCheck

```



\---



\## Status Indicators



Represent step states clearly.



```text id="9whodm"

not\_started              neutral

blocked                  red lock

ready                    blue

input\_missing            yellow

input\_ready              blue play

running                  purple spinner

output\_generated         blue document

awaiting\_human\_review    orange review

approved                 green check

rejected                 red x

regeneration\_requested   purple refresh

superseded               gray

locked                   green lock

failed                   red warning

sync\_pending             yellow cloud

synced                   green cloud check

sync\_conflict            orange/red warning

```



Status must not rely on color alone.



Use icon + label + tooltip.



\---



\## Step Workspace Requirements



Each workflow step should use the same base layout.



\### Left Panel



Contains:



```text id="g1om4b"

required inputs

human questions

episode variables

channel variables

source artifacts

dependency status

missing input list

```



\### Center Panel



Contains:



```text id="xtfeqn"

rendered prompt preview

manual paste area

AI output

artifact content

version comparison

Google Docs mirror preview

```



\### Right Panel



Contains:



```text id="n2awhx"

current state

allowed actions

review controls

quality checklist

sync controls

regeneration options

blocking reasons

```



\---



\## Step Workspace Modes



Each step workspace may have tabs or segmented controls:



```text id="pslzjt"

Overview

Inputs

Prompt Preview

Run

Review

Versions

Sync

Checklist

```



MVP may implement fewer tabs, but all functions must remain accessible.



\---



\## Prompt Preview UI



Prompt preview must show:



```text id="9jwqjn"

prompt template name

prompt template version

resolved variables

unresolved placeholders

dependency artifacts used

rendered prompt text

copy rendered prompt button

run with provider button

manual paste mode button

```



If unresolved required placeholders exist:



```text id="oq6s9e"

disable run button

show missing placeholders

show quick links to fill missing inputs

```



\---



\## Manual Paste UI



Manual paste mode must be prominent.



Flow:



```text id="kajntf"

1\. User previews rendered prompt.

2\. User copies rendered prompt.

3\. User runs prompt externally.

4\. User pastes output into app.

5\. App saves candidate artifact version.

6\. App opens review console.

```



UI must include:



```text id="89shqe"

copy prompt button

paste output text area

save candidate output button

clear pasted output button

```



\---



\## Review Console UI



Every generated or pasted output must enter review.



Review actions:



```text id="lh39jg"

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



The approve action must be explicit.



No auto-approval.



\---



\## Version UI



Version history must show:



```text id="m8hqt8"

version number

status

source type

created date

provider/model if available

review decision

local snapshot status

Drive sync status

```



Version comparison should support:



```text id="cg54r7"

candidate vs approved

v001 vs v002

manual edit vs generated output

local vs remote

```



MVP can use side-by-side text comparison.



\---



\## Missing Input UI



When inputs are missing, show:



```text id="znkwc4"

input name

why it is required

where it comes from

quick action to fill it

```



Example:



```text id="hh5w64"

Missing: Human editorial decision

Required by: Step 04 — Script Blueprint Builder

Reason: The blueprint prompt needs the selected angle or human override.

Action: Add decision note

```



\---



\## Blocked Step UI



A blocked step should still open.



It should show:



```text id="lciy5q"

why it is blocked

which dependency is missing

which upstream step to open

what must be approved

```



Do not simply disable the icon without explanation.



\---



\## Episode Dashboard



The episode dashboard must show:



```text id="app07a"

episode title

channel

language

tone

current workflow step

overall progress

16-step status grid

next recommended action

recent artifacts

Drive sync warnings

stale warnings

```



\---



\## Project Dashboard



The project dashboard must show:



```text id="16tknp"

episode list

channel filter

status filter

current step

last updated

Drive sync status

local status

```



\---



\## Settings Screen



Settings should include:



```text id="gntp1p"

Google Drive connection

prompt template folder mapping

local data folder

AI provider settings

default execution mode

channel profiles

sync mode

theme

backup/export settings

```



Manual mode must work even if AI provider settings are empty.



\---



\## Visual Style



Use a dark, calm, production-oriented interface.



Suggested qualities:



```text id="m2czxd"

dark background

clear hierarchy

small but readable labels

status badges

icon-based bottom navigation

subtle accent color

document-focused center panel

minimal animation

```



Avoid:



```text id="cnyide"

bright SaaS dashboard aesthetic

chat-first interface

excessive gradients

decorative animations

hidden states

unclear icons

unlabeled color-only indicators

```



\---



\## MVP UI Scope



MVP must include:



```text id="siy1br"

project dashboard

settings screen

Drive setup screen

prompt library screen

channel profile screen

new episode screen

episode dashboard

bottom 16-step navigation

step workspace

prompt preview

manual paste output capture

human review console

version history

basic sync status

```



Steps 01–05 must be fully usable.



Steps 06–16 may be visible but marked as planned.



\---



\## Accessibility Requirements



Minimum accessibility:



```text id="ouh4kc"

keyboard navigation for main actions

visible focus states

buttons have labels

icons have accessible names

status indicators have text labels

contrast is readable

text areas are usable for long content

```



\---



\## Testing Requirements



Test UI behavior:



```text id="ybdu6t"

bottom navigation renders all 16 steps

blocked step opens and explains blocking reason

active step is highlighted

state indicators render correctly

manual paste mode is accessible

prompt run disabled when placeholders unresolved

review console shows required actions

approve requires explicit click

version history shows multiple versions

Drive sync status displays correctly

episode dashboard persists after restart

```



\---



\## Definition of Done



UI shell work is complete when:



```text id="wg09iy"

the app has persistent top navigation

the app has persistent 16-step bottom navigation

each step has a dedicated workspace

blocked steps remain visible

manual paste mode works from the UI

generated outputs enter review

approval is explicit

version history is visible

Drive sync status is visible

the interface feels like a production console, not a chatbot

```



```

```




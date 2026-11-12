\# docs/DRIVE\_SYNC.md



\# Google Drive and Google Docs Sync



\## Purpose



This document defines how the Project Mina-Ale Production Workflow App integrates with Google Drive and Google Docs.



The app is local-first.



Google Drive is used for:



\- prompt template storage;

\- human-readable output mirrors;

\- episode folder organization;

\- optional shared review;

\- long-term production archive.



Google Drive is not the primary database.



SQLite and local snapshots remain the source of truth for workflow state.



\---



\## Core Rule



Never depend on Google Drive as the only copy of important workflow state.



Every generated output must be saved locally before it is synced to Drive.



Every approved artifact must have a local snapshot.



Drive sync is storage and collaboration.



Human approval is editorial state.



These are separate concepts.



\---



\## Google Drive Responsibilities



Google Drive stores:



```text id="cl1s6w"

Project root folder

Prompt template Google Docs

Episode folders

Approved output Google Docs

Optional candidate output Google Docs

Asset folders

Source tracking files

Production planning documents

Final export references

````



Google Drive should not store:



```text id="0gw9j3"

canonical workflow state

only copy of artifact metadata

only copy of approval decisions

only copy of version history

only copy of dependency graph

only copy of audit log

API keys

OAuth secrets

```



\---



\## Local Responsibilities



The local app stores:



```text id="qq83bw"

workflow state

step state

artifact metadata

artifact versions

approval state

human decision log

prompt template version metadata

Drive file links

sync events

audit events

local snapshots

```



\---



\## Expected Drive Structure



Recommended Google Drive project structure:



```text id="coqupy"

Project Mina-Ale/

├── 00\_System/

│   ├── Templates/

│   │   └── Process\_Prompts/

│   │       ├── 01 — Research Brief Builder

│   │       ├── 02 — Angle \& Thesis Generator

│   │       ├── 03 — Angle Evaluator

│   │       ├── 04 — Script Blueprint Builder

│   │       ├── 05 — Script Version Generator

│   │       ├── 06 — Multi-Agent Script Evaluator

│   │       ├── 07 — Master Cut Builder

│   │       ├── 08 — Layered Rewrite \& Final Polish

│   │       ├── 09 — Visual Layer Builder

│   │       ├── 10 — Voice Production Plan

│   │       ├── 11 — AI Narration Generation

│   │       ├── 12 — Audio Cleanup \& Podcast Master

│   │       ├── 13 — Asset Sourcing \& Rights Check

│   │       ├── 14 — Long-Form Video Assembly

│   │       ├── 15 — Derivatives Package

│   │       └── 16 — Final QA, Export \& Publish

│   ├── Channel\_Profiles/

│   ├── Shared\_References/

│   └── App\_Metadata/

├── 01\_Projects/

│   └── EP001\_<episode\_slug>/

│       ├── 01\_Research\_Brief/

│       ├── 02\_Angles/

│       ├── 03\_Angle\_Decision/

│       ├── 04\_Blueprint/

│       ├── 05\_Script\_Versions/

│       ├── 06\_Script\_Evaluation/

│       ├── 07\_Master\_Cut/

│       ├── 08\_Final\_Script/

│       ├── 09\_Visual\_Plan/

│       ├── 10\_Voice\_Plan/

│       ├── 11\_Narration\_Generation/

│       ├── 12\_Audio\_Master/

│       ├── 13\_Assets\_Rights/

│       ├── 14\_Longform\_Assembly/

│       ├── 15\_Derivatives/

│       ├── 16\_QA\_Publish/

│       ├── \_Exports/

│       ├── \_Assets/

│       ├── \_Sources/

│       └── \_Archive/

└── 99\_Deprecated/

```



\---



\## OAuth Requirements



The app must authenticate with Google through OAuth.



Recommended behavior:



```text id="7saoi8"

1\. User clicks Connect Google Drive.

2\. App opens browser OAuth flow.

3\. User grants permission.

4\. App stores token securely if possible.

5\. App verifies account email.

6\. App allows user to select Project Mina-Ale root folder.

```



\---



\## Recommended Google Scopes



Use the least permissive scopes that still allow the app to work.



Initial development may use broader scopes, but production should reduce scope where possible.



Useful scopes may include:



```text id="r4msf6"

https://www.googleapis.com/auth/drive.file

https://www.googleapis.com/auth/drive.metadata.readonly

https://www.googleapis.com/auth/documents

```



Avoid full Drive access unless strictly needed.



If full Drive access is used during development, document why.



\---



\## Token Storage



OAuth tokens must not be hardcoded.



Do not commit tokens.



Do not log refresh tokens.



Preferred token storage:



```text id="3jd4tf"

OS secure keychain if available

Tauri secure storage plugin if available

encrypted local storage as fallback

```



If secure token storage is not implemented in MVP, the app should require reconnection rather than storing sensitive tokens unsafely.



\---



\## Drive Root Selection



The user must be able to select or confirm the root project folder.



Expected root:



```text id="e0jixv"

Project Mina-Ale

```



The app should store:



```text id="qijoi4"

drive\_root\_folder\_id

drive\_root\_folder\_url

drive\_root\_folder\_name

connected\_account\_email

last\_verified\_at

```



The app should not assume folder IDs are permanent without checking.



\---



\## Prompt Template Import



Prompt templates are read from Google Docs.



Import process:



```text id="qtp4l7"

1\. Locate configured prompt template folder.

2\. List Google Docs in that folder.

3\. Match files by step number and title.

4\. Fetch each Google Doc as plain text.

5\. Compute content hash.

6\. Extract placeholders.

7\. Save local prompt template version.

8\. Store Drive file link.

9\. Report missing or duplicate prompts.

```



\---



\## Prompt Matching Rules



Prompt templates should be matched using:



```text id="ohab45"

step number prefix

canonical title

Google Doc ID if already mapped

manual user mapping as fallback

```



Examples:



```text id="agdzlk"

01 — Research Brief Builder

02 — Angle \& Thesis Generator

03 — Angle Evaluator

```



If duplicate prompts exist, the app must ask the user to choose.



Do not guess silently.



\---



\## Template Change Detection



The app must detect when a remote prompt template changed.



Use:



```text id="m5t2do"

remote modified time

remote file ID

content hash

local cached hash

```



If the remote template changed, show:



```text id="sv3ddy"

Prompt template changed remotely.

Current episode uses template version X.

Remote version is newer.

Choose:

\- keep current cached version for this episode

\- import new version

\- compare versions

```



Do not automatically replace prompt templates used by existing step runs.



\---



\## Output Sync Strategy



Generated outputs should be saved locally first.



Then they may be mirrored to Google Docs.



Default behavior:



```text id="t3ft1t"

Save every output locally.

Sync approved outputs to Drive.

Keep rejected/candidate outputs local unless user chooses to sync them.

```



Alternative setting:



```text id="z1raq2"

Sync all versions to Drive.

```



MVP default should be approved-only sync.



\---



\## Output Document Creation



When a step output is approved, the app may create a Google Doc in the correct episode step folder.



Example:



```text id="5xfx8h"

Project Mina-Ale/

└── 01\_Projects/

&#x20;   └── EP001\_the\_shining/

&#x20;       └── 01\_Research\_Brief/

&#x20;           └── EP001\_S01\_ResearchBrief\_APPROVED

```



Recommended document title:



```text id="dmf1d3"

EP001 — S01 — Research Brief — Approved

EP001 — S02 — Angle List — Approved

EP001 — S04 — Script Blueprint — Approved

```



Candidate versions may use:



```text id="n49t4u"

EP001 — S01 — Research Brief — v001

EP001 — S01 — Research Brief — v002

```



\---



\## Folder Creation Rules



The app may create episode folders.



The app may create step folders.



The app must not delete folders in MVP.



The app must not move existing folders without explicit confirmation.



Folder creation should be idempotent.



If a folder already exists, reuse it after confirming its identity.



\---



\## Episode Folder Generation



When creating an episode, generate:



```text id="09p7g6"

EP001\_<episode\_slug>

```



Inside it, create or map:



```text id="7o8ln5"

01\_Research\_Brief

02\_Angles

03\_Angle\_Decision

04\_Blueprint

05\_Script\_Versions

06\_Script\_Evaluation

07\_Master\_Cut

08\_Final\_Script

09\_Visual\_Plan

10\_Voice\_Plan

11\_Narration\_Generation

12\_Audio\_Master

13\_Assets\_Rights

14\_Longform\_Assembly

15\_Derivatives

16\_QA\_Publish

\_Exports

\_Assets

\_Sources

\_Archive

```



\---



\## Drive Link Records



Every remote file or folder mapped by the app must create a `drive\_file\_links` record.



Fields:



```text id="xjrx00"

drive\_file\_id

drive\_file\_url

drive\_folder\_id

file\_name

mime\_type

remote\_modified\_time

remote\_content\_hash

link\_type

sync\_status

```



Link types:



```text id="wiw65d"

project\_root

template\_folder

prompt\_template\_doc

episode\_folder

step\_folder

output\_doc

asset\_folder

source\_file

metadata\_doc

```



\---



\## Sync Status Values



Use these sync statuses:



```text id="wj2z6a"

not\_synced

sync\_pending

synced

sync\_conflict

remote\_missing

local\_missing

failed

```



\---



\## Sync Event Types



Use these sync operations:



```text id="vw8y5y"

connect\_drive

select\_root\_folder

list\_folder

import\_prompt\_template

refresh\_prompt\_template

create\_episode\_folder

create\_step\_folder

create\_output\_doc

update\_output\_doc

refresh\_remote\_metadata

detect\_conflict

resolve\_conflict

```



\---



\## Sync Direction



Use these sync directions:



```text id="bzy0p0"

drive\_to\_local

local\_to\_drive

bidirectional\_check

```



\---



\## Conflict Types



The app must detect these conflicts:



```text id="p9qdfd"

remote\_prompt\_changed

remote\_output\_changed

remote\_file\_deleted

local\_snapshot\_missing

drive\_folder\_missing

duplicate\_prompt\_template

duplicate\_episode\_folder

local\_newer\_than\_remote

remote\_newer\_than\_local

```



\---



\## Conflict Resolution Options



For output docs:



```text id="of5io6"

Keep local version

Pull remote version as new artifact version

Create duplicate remote copy

Mark remote as external edit

Ignore once

Resolve manually

```



For prompt templates:



```text id="xab8wh"

Keep current cached template

Import new template version

Compare local cached version with remote version

Remap to another Google Doc

```



For missing Drive folders:



```text id="l8ae6q"

Recreate folder

Select replacement folder

Disable Drive sync for this episode

```



\---



\## Destructive Action Policy



The app must not perform destructive Drive actions in MVP.



Not allowed in MVP:



```text id="tmdxyf"

delete remote files

rename remote prompt templates

move remote prompt templates

overwrite remote approved docs without confirmation

mass reorganize Drive folders

```



Allowed with confirmation:



```text id="f8awro"

create folders

create output docs

update app-created output docs

refresh metadata

import prompt templates

```



\---



\## Dry Run Mode



Drive sync operations should support dry run.



Dry run should show:



```text id="69z41t"

what folders would be created

what files would be created

what docs would be updated

what local records would be changed

what conflicts might occur

```



Dry run must not modify Drive.



\---



\## Sync Queue



The app should use a local sync queue.



Sync queue item fields:



```text id="4dg0hf"

id

operation

direction

target\_type

target\_local\_id

drive\_file\_id

status

attempt\_count

last\_error

created\_at

updated\_at

```



This avoids losing sync operations if the app closes.



\---



\## Offline Behavior



The app must remain usable without Drive connectivity.



Offline mode should allow:



```text id="s0no8w"

open existing episodes

review local artifacts

approve local versions

create local snapshots

render prompts

manual paste mode

continue workflow using local approved artifacts

queue sync operations for later

```



Offline mode should not allow:



```text id="g0jg4x"

import new remote prompt templates

create Google Docs outputs

refresh remote metadata

resolve remote conflicts

```



\---



\## Google Docs Output Formatting



MVP may write outputs as plain text or simple Markdown-like text.



Later versions may support:



```text id="3lirv6"

headings

tables

bold text

horizontal rules

metadata header

artifact provenance section

```



Recommended output document header:



```text id="7i8wpe"

Episode: EP001 — Episode Title

Step: 01 — Research Brief Builder

Artifact Type: research\_brief

Version: v001

Status: Approved

Generated: 2026-05-16T10:00:00Z

Source Template: 01 — Research Brief Builder v003

Execution Mode: manual\_paste

```



\---



\## Prompt Template Cache



Prompt templates must be cached locally.



Recommended local path:



```text id="4v9zaf"

.local-data/prompts/

├── S01\_research\_brief/

│   ├── template\_v001.md

│   └── template\_v002.md

├── S02\_angle\_generator/

└── S16\_final\_qa\_export\_publish/

```



\---



\## Output Snapshot Paths



Recommended local output path:



```text id="d4pfh0"

.local-data/snapshots/episodes/EP001/S01/EP001\_S01\_ResearchBrief\_v001.md

.local-data/snapshots/episodes/EP001/S01/rendered\_prompt\_v001.md

```



The Drive sync system must refer to these local snapshots.



\---



\## Importing Existing Drive Outputs



The app may later support importing existing Google Docs outputs as artifact versions.



MVP can skip this unless needed.



If implemented, imported outputs must be marked:



```text id="81nwhn"

source\_type = imported\_from\_drive

status = candidate

requires human review

```



Never assume an imported Drive document is approved unless the user marks it as approved.



\---



\## Sync Safety Rules



\### Rule 1



Save locally before remote sync.



\### Rule 2



Never overwrite approved local artifacts.



\### Rule 3



Never treat Drive sync as approval.



\### Rule 4



Never delete remote files in MVP.



\### Rule 5



Never silently replace prompt templates.



\### Rule 6



Always record sync events.



\### Rule 7



Always preserve prior prompt template versions.



\### Rule 8



Always show conflicts to the user.



\### Rule 9



Always allow manual mode without Drive sync.



\### Rule 10



Always degrade gracefully when Drive is unavailable.



\---



\## Required UI Indicators



The UI should show:



```text id="etx2lc"

Drive connected / disconnected

Connected Google account

Root folder selected / missing

Prompt templates synced / outdated

Current artifact synced / pending / conflict

Episode folder created / missing

Step folder created / missing

Remote output doc created / missing

Offline mode warning

```



\---



\## MVP Drive Features



Implement in MVP:



```text id="ou4xq9"

Google OAuth connection

select root folder

list prompt template folder

import prompt templates

cache template versions locally

create episode folder

create step folders

create approved output Google Doc

store Drive links

track sync events

display sync status

manual sync button

```



Do not implement destructive remote operations in MVP.



\---



\## Future Drive Features



Later versions may add:



```text id="wrh6g4"

remote output editing import

Google Docs comments import

Drive asset inventory

source tracking sheet creation

automatic folder repair

Drive folder migration tools

shared review links

remote collaborator status

batch export to Markdown

batch export to Google Docs

sync conflict visual diff

```



\---



\## Definition of Done



Drive sync is complete when:



```text id="n8oywk"

the user can connect Google Drive

the user can select the project root folder

the app can import all 16 prompt templates from Google Docs

template versions are cached locally

remote prompt changes are detected

episode folders can be created safely

step folders can be created safely

approved outputs can be mirrored to Google Docs

local artifacts remain the source of truth

Drive links are stored in SQLite

sync events are auditable

conflicts are detected and shown

offline mode remains usable

no destructive remote operations happen without explicit confirmation

```



```

```




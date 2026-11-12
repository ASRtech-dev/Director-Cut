\# agents/skills/drive-sync.md



\# Skill: Google Drive and Google Docs Sync



\## Purpose



This skill defines how coding agents must implement, modify, and test Google Drive and Google Docs synchronization for the Project Mina-Ale Production Workflow App.



Use this skill whenever working on:



\- Google OAuth;

\- Drive folder selection;

\- prompt template import;

\- Google Docs reading;

\- Google Docs output creation;

\- Drive links;

\- sync state;

\- sync conflicts;

\- offline mode;

\- Drive-related UI.



\---



\## Core Principle



The app is local-first.



Google Drive is a document repository and sync target.



SQLite and local snapshots are the source of truth.



Never design Drive sync as the only place where workflow state exists.



\---



\## Non-Negotiable Rules



1\. Save locally before syncing remotely.

2\. Do not treat Drive sync as human approval.

3\. Do not delete Drive files in MVP.

4\. Do not move or rename Drive files without explicit user confirmation.

5\. Do not silently replace local prompt templates with remote changes.

6\. Do not overwrite approved local artifacts.

7\. Do not require Drive connection for manual/local workflow.

8\. Do not store OAuth tokens unsafely if secure storage is available.

9\. Do not log OAuth tokens or private document contents unnecessarily.

10\. Do not assume Google Drive is always online.



\---



\## Drive Responsibilities



Drive may store:



```text

project root folder

prompt template Google Docs

episode folders

approved output Google Docs

optional candidate output Google Docs

asset folders

source folders

production planning documents

````



Drive must not store the only copy of:



```text

workflow state

approval decisions

artifact metadata

version history

dependency graph

audit log

API keys

OAuth secrets

```



\---



\## Local Responsibilities



Local SQLite and filesystem must store:



```text

project records

channel records

episode records

workflow step states

prompt template metadata

prompt template versions

artifact metadata

artifact versions

human reviews

Drive file links

sync events

audit events

local snapshots

```



\---



\## OAuth Implementation Requirements



When implementing Google OAuth:



```text

open browser login flow

request minimum necessary scopes

show connected account email

store tokens securely where possible

support disconnect/reconnect

handle expired tokens

handle denied permissions

handle offline Drive state gracefully

```



Preferred scopes:



```text

https://www.googleapis.com/auth/drive.file

https://www.googleapis.com/auth/drive.metadata.readonly

https://www.googleapis.com/auth/documents

```



Use broader scopes only if there is a documented need.



\---



\## Root Folder Selection



The user must explicitly select or confirm the root Drive folder.



Expected default:



```text

Project Mina-Ale

```



Store:



```text

drive\_root\_folder\_id

drive\_root\_folder\_url

drive\_root\_folder\_name

connected\_account\_email

last\_verified\_at

```



Do not hardcode Drive folder IDs.



\---



\## Prompt Template Import



Prompt templates are Google Docs.



Import flow:



```text

1\. Locate prompt template folder.

2\. List Google Docs in the folder.

3\. Match documents by step number.

4\. Fetch document text.

5\. Compute content hash.

6\. Extract placeholders.

7\. Store template version locally.

8\. Store Drive file link.

9\. Report missing, duplicate, or unmapped prompts.

```



All 16 prompt templates should be visible in the registry.



MVP must fully support Steps 01–05.



\---



\## Prompt Matching



Match prompt templates using:



```text

Google Doc ID if already mapped

step number prefix

canonical prompt title

manual mapping fallback

```



If multiple candidates match one step, do not guess.



Ask for manual mapping.



\---



\## Template Change Detection



Use:



```text

remote modified time

content hash

source Google Doc ID

local cached template hash

```



If a template changed remotely:



```text

create a new prompt\_template\_version

do not overwrite the previous version

warn the user if an episode used an older version

allow compare/keep/import actions

```



\---



\## Episode Folder Creation



When creating an episode in Drive, use:



```text

EP001\_<episode\_slug>

```



Inside it, create:



```text

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



Folder creation must be idempotent.



If folder exists, reuse it after confirming it is the intended folder.



\---



\## Output Document Creation



Approved outputs may be mirrored to Google Docs.



Default MVP behavior:



```text

sync approved outputs only

keep rejected/candidate versions local unless user requests otherwise

```



Output document title format:



```text

EP001 — S01 — Research Brief — Approved

EP001 — S02 — Angle List — Approved

EP001 — S04 — Script Blueprint — Approved

```



Candidate version format, if synced:



```text

EP001 — S01 — Research Brief — v001

EP001 — S01 — Research Brief — v002

```



\---



\## Output Document Header



When writing output docs, include a metadata header:



```text

Episode: EP001 — Episode Title

Step: 01 — Research Brief Builder

Artifact Type: research\_brief

Version: v001

Status: Approved

Generated: <timestamp>

Source Template: <template title and version>

Execution Mode: <manual\_paste/openai\_api/gemini\_api>

```



\---



\## Drive Link Records



Every mapped remote file or folder must create a local `drive\_file\_links` record.



Required metadata:



```text

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



Allowed link types:



```text

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



\## Sync Events



Every sync operation must create a `sync\_events` record.



Sync operations:



```text

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



Sync statuses:



```text

started

success

failed

conflict

skipped

```



Sync directions:



```text

drive\_to\_local

local\_to\_drive

bidirectional\_check

```



\---



\## Conflict Detection



Detect these conflicts:



```text

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



\## Conflict Resolution



For output documents:



```text

keep local version

pull remote version as new artifact version

create duplicate remote copy

mark remote as external edit

ignore once

resolve manually

```



For prompt templates:



```text

keep current cached template

import new template version

compare local cached version with remote version

remap to another Google Doc

```



For missing folders:



```text

recreate folder

select replacement folder

disable Drive sync for this episode

```



\---



\## Dry Run Requirement



All potentially broad Drive operations should support dry-run.



Dry-run should display:



```text

folders that would be created

files that would be created

docs that would be updated

local records that would be changed

conflicts that may occur

```



Dry-run must not modify Drive.



\---



\## Offline Mode



The app must support offline/manual work.



Allowed offline:



```text

open existing projects

open existing episodes

review local artifacts

approve local versions

render prompts from local cached templates

manual paste mode

create local snapshots

queue sync operations

```



Blocked offline:



```text

import new remote templates

create Google Docs outputs

refresh remote metadata

resolve remote conflicts

```



\---



\## Error Handling



Drive errors must be structured.



Return:



```text

code

message

detail

recoverable

suggested\_action

source

```



Examples:



```text

DRIVE\_NOT\_CONNECTED

ROOT\_FOLDER\_MISSING

PROMPT\_TEMPLATE\_FOLDER\_MISSING

DUPLICATE\_PROMPT\_TEMPLATE

DOC\_FETCH\_FAILED

DOC\_CREATE\_FAILED

SYNC\_CONFLICT

TOKEN\_EXPIRED

PERMISSION\_DENIED

NETWORK\_UNAVAILABLE

```



\---



\## UI Requirements



Drive-related UI must show:



```text

connected account

root folder selected/missing

prompt templates synced/outdated

current artifact synced/pending/conflict

episode folder created/missing

step folder created/missing

offline mode

last sync time

```



Actions:



```text

connect Drive

disconnect Drive

select root folder

refresh templates

sync approved output

open in Google Docs

open Drive folder

resolve conflict

```



\---



\## Testing Requirements



Use mocks for automated tests.



Do not rely on live Google Drive in routine tests.



Test:



```text

OAuth connection mocked

root folder selection

prompt folder listing

template import

duplicate prompt detection

template change detection

episode folder creation

step folder creation

output doc creation

Drive link storage

sync event creation

Drive failure handling

offline behavior

conflict detection

```



Live Drive tests must be optional.



They must require explicit local configuration.



\---



\## MVP Scope



Implement in MVP:



```text

Google OAuth connection

root folder selection

prompt folder selection

import all 16 prompt templates

cache prompt versions locally

create episode folder

create step folders

create approved output Google Doc

store Drive file links

record sync events

show sync status

manual sync button

offline-safe behavior

```



Do not implement in MVP:



```text

remote deletion

mass folder reorganization

automatic conflict merge

direct editing of prompt templates

multi-user remote collaboration

complex permission management

```



\---



\## Definition of Done



Drive sync work is complete when:



```text

local work survives Drive disconnection

all 16 prompt templates can be imported

template versions are cached

template changes are detected

approved outputs can be mirrored to Google Docs

Drive links are stored

sync events are auditable

conflicts are visible

Drive failures are recoverable

offline manual mode still works

no destructive remote action happens silently

```



```

```




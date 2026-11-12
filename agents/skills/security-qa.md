\# agents/skills/security-qa.md



\# Skill: Security and QA



\## Purpose



This skill defines how coding agents must implement, modify, and test security, privacy, reliability, and quality assurance rules for the Project Mina-Ale Production Workflow App.



Use this skill whenever working on:



\- local data storage;

\- API keys;

\- OAuth tokens;

\- Google Drive permissions;

\- prompt/output content handling;

\- logs;

\- backups;

\- error handling;

\- test strategy;

\- release checks;

\- destructive operations;

\- data protection.



\---



\## Core Principle



The app manages private creative work.



The app must protect:



```text

Google Drive access

prompt templates

episode ideas

research briefs

scripts

human feedback

version history

API keys

OAuth tokens

local snapshots

production metadata

````



Security and QA are not optional.



\---



\## Non-Negotiable Rules



1\. Never commit secrets.

2\. Never hardcode API keys.

3\. Never log OAuth tokens.

4\. Never log full private document contents by default.

5\. Never delete Drive files in MVP.

6\. Never overwrite approved artifact versions.

7\. Never bypass human approval.

8\. Never treat sync as approval.

9\. Never require cloud deployment for local use.

10\. Never fail silently when user data may be affected.



\---



\## Local-First Security



The app is local-first.



The user’s local machine is the primary working environment.



The app must work in manual mode without:



```text id="w16m0x"

AI API keys

Google Drive connection

cloud backend

public deployment

```



If Drive or API providers are unavailable, the app should degrade gracefully.



\---



\## Secrets Policy



Secrets include:



```text id="x2zbl1"

OpenAI API key

Gemini API key

Google OAuth access token

Google OAuth refresh token

any future third-party API token

```



Secrets must not be stored in:



```text id="v2jcdr"

source code

committed config files

plain documentation

test fixtures

logs

debug exports

screenshots

```



Preferred storage:



```text id="o9nqwx"

OS keychain

Tauri secure storage plugin

encrypted local storage

environment variables for development

```



If secure storage is not implemented, require the user to re-enter secrets rather than storing them insecurely.



\---



\## Environment Files



Allowed local files:



```text id="w3ym43"

.env.local

.env.development.local

```



These must be gitignored.



Never commit:



```text id="lm36ql"

.env

.env.local

.env.\*.local

credentials.json

token.json

client\_secret.json

```



\---



\## Gitignore Requirements



The repository must ignore:



```text id="bfv5jx"

.env

.env.local

.env.\*.local

.local-data/

\*.sqlite

\*.sqlite-wal

\*.sqlite-shm

credentials.json

token.json

client\_secret.json

dist/

target/

node\_modules/

```



Do not ignore documentation files.



Do not ignore source files.



\---



\## Google OAuth Safety



OAuth implementation must:



```text id="zs0720"

use least-privilege scopes where possible

show connected Google account

allow disconnect

handle expired tokens

handle permission denial

avoid broad Drive access unless documented

avoid logging token responses

```



Preferred scopes:



```text id="mztchc"

https://www.googleapis.com/auth/drive.file

https://www.googleapis.com/auth/drive.metadata.readonly

https://www.googleapis.com/auth/documents

```



If broader scopes are required, document the reason.



\---



\## Google Drive Destructive Operations



Destructive Drive operations are not allowed in MVP.



Do not implement:



```text id="ncvpld"

delete remote file

delete remote folder

mass rename

mass move

prompt template overwrite

prompt template deletion

approved output overwrite without confirmation

```



Allowed with explicit confirmation:



```text id="3vmbkg"

create folder

create output Google Doc

update app-created output Google Doc

refresh prompt templates

sync approved output

```



All Drive write operations must create sync events.



\---



\## Local Data Protection



Local data includes:



```text id="6z54kt"

SQLite database

prompt cache

rendered prompt snapshots

artifact snapshots

output versions

human feedback

audit logs

sync logs

```



The app must avoid accidental loss.



Rules:



```text id="kukbmh"

save outputs locally before remote sync

use append-only artifact versions

create backups before migrations

do not overwrite approved snapshots

preserve rejected versions

preserve locked versions

```



\---



\## Logging Policy



Logs should help debugging without exposing private creative content.



Allowed logs:



```text id="31tn3k"

event type

step number

state transition

artifact ID

version number

error code

sync operation type

timestamp

provider name

model name

```



Avoid logging:



```text id="7eo6bq"

full prompt text

full generated output

OAuth tokens

API keys

private Google Doc contents

large script sections

full human feedback unless explicitly needed

```



If content logging is needed for debugging, it must be opt-in.



\---



\## Error Handling



All important errors should be structured.



Error shape:



```json id="e90p8q"

{

&#x20; "code": "ERROR\_CODE",

&#x20; "message": "Human-readable message",

&#x20; "detail": {},

&#x20; "recoverable": true,

&#x20; "suggested\_action": "What the user can do next",

&#x20; "source": "module\_name"

}

```



Required error categories:



```text id="ipgsan"

UNRESOLVED\_PLACEHOLDERS

MISSING\_DEPENDENCY

UNAPPROVED\_DEPENDENCY

PROMPT\_TEMPLATE\_MISSING

PROMPT\_RENDER\_FAILED

LOCAL\_SNAPSHOT\_FAILED

DATABASE\_ERROR

DRIVE\_NOT\_CONNECTED

DRIVE\_PERMISSION\_DENIED

DOC\_FETCH\_FAILED

DOC\_CREATE\_FAILED

SYNC\_CONFLICT

AI\_PROVIDER\_ERROR

TOKEN\_EXPIRED

INVALID\_STATE\_TRANSITION

```



Errors must not fail silently.



\---



\## Workflow Safety Rules



The app must protect workflow integrity.



Never allow:



```text id="ez0ip3"

running prompt with unresolved placeholders

using rejected artifact as dependency

using candidate artifact as dependency

approving output without local snapshot

marking step completed without approved artifact

overwriting approved version

bypassing review console

locking non-existent artifact

```



\---



\## Version Safety



Every generated or edited output creates a new artifact version.



Version rules:



```text id="nifcpn"

v001 is first generated/pasted output

v002 is regeneration or manual edit

approved version remains preserved

rejected version remains preserved

superseded version remains preserved

locked version remains protected

```



No destructive replacement.



\---



\## Migration Safety



Database migrations must be safe.



Before migration:



```text id="dxbcwj"

backup database

validate migration version

run migration transactionally when possible

preserve existing artifact versions

preserve existing approvals

preserve existing prompt template versions

```



Test migrations from:



```text id="vcwgrn"

empty database

previous schema version

sample project database

```



\---



\## Backup Policy



The app should support local backup/export.



Minimum backup should include:



```text id="x9aeqm"

SQLite database

local snapshots

prompt template cache

app settings excluding secrets

artifact metadata

audit logs

```



Backup should not include secrets unless explicitly encrypted.



\---



\## QA Priorities



Highest priority tests:



```text id="qgpftc"

unapproved output cannot unlock downstream step

approved artifact cannot be overwritten

manual mode works without API keys

Drive failure does not destroy local work

app restart preserves state

prompt with unresolved placeholder cannot run

rejected version remains visible

regeneration creates new version

sync does not equal approval

```



\---



\## Automated Test Areas



Implement tests for:



```text id="cl6nay"

state transitions

dependency checks

prompt rendering

placeholder validation

artifact versioning

human review decisions

local snapshot creation

Drive sync mocks

offline behavior

error handling

database migrations

UI state indicators

```



\---



\## Manual QA Checklist



Before release:



```text id="d0lg2v"

Create project.

Connect Drive.

Import prompts.

Create episode.

Run Step 01 manually.

Approve Step 01.

Confirm Step 02 unlocks.

Reject a generated output.

Regenerate output.

Approve regenerated version.

Confirm previous version remains visible.

Sync approved output to Drive.

Disconnect Drive.

Continue locally.

Restart app.

Confirm state persists.

```



\---



\## Privacy Review Checklist



Before release:



```text id="psk6m5"

No secrets committed.

No private docs in fixtures.

No full prompt/output logging by default.

OAuth tokens hidden.

API keys hidden.

Local data folder gitignored.

Drive scopes reviewed.

Error messages do not leak tokens.

Debug exports exclude secrets.

```



\---



\## Drive QA Checklist



Before release:



```text id="7gmhc3"

OAuth works.

Disconnect works.

Root folder selection works.

Prompt import works.

Duplicate prompt detection works.

Template change detection works.

Episode folder creation works.

Output doc creation works.

Sync event recorded.

Drive failure handled.

Offline mode works.

No destructive operation occurs.

```



\---



\## UI QA Checklist



Before release:



```text id="zt1yfy"

All 16 steps visible.

Blocked steps explain why.

Manual paste mode accessible.

Prompt preview shows unresolved placeholders.

Run button disabled when inputs missing.

Review console requires explicit approval.

Version history visible.

Sync status visible.

Stale warning visible when needed.

Settings accessible.

```



\---



\## Release Gate



A build is not releasable if any of these are true:



```text id="fwz8hm"

unapproved output can unlock next step

approved output can be overwritten

secrets are committed

Drive deletion is possible in MVP

manual mode is broken

local snapshots are not created

state is lost after restart

prompt validation can be bypassed

approval can happen without artifact version

```



\---



\## MVP Security Scope



MVP must include:



```text id="f6hqzk"

gitignore for secrets and local data

manual mode without API keys

structured errors

local snapshot safety

append-only artifact versions

basic OAuth safety

Drive no-delete policy

workflow approval gates

database persistence

restart recovery

```



MVP may defer:



```text id="q1tp77"

encrypted local backups

advanced secret rotation

full audit export

multi-user permission model

role-based access control

cloud security review

```



\---



\## Definition of Done



Security and QA work is complete when:



```text id="ucrt4k"

secrets are not committed

local-first behavior works

manual mode works without APIs

Google Drive failures are recoverable

unapproved outputs cannot advance workflow

approved versions cannot be overwritten

local snapshots are always created

state survives restart

prompt validation blocks unsafe execution

Drive writes are non-destructive by default

errors are structured and actionable

release checklist passes

```



```

```




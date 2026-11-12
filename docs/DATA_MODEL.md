\# docs/DATA\_MODEL.md



\# Data Model



\## Purpose



This document defines the local data model for the Project Mina-Ale Production Workflow App.



The app is local-first.



SQLite is the canonical store for:



\- projects;

\- channels;

\- episodes;

\- prompt templates;

\- workflow steps;

\- step runs;

\- variables;

\- artifacts;

\- artifact versions;

\- human review decisions;

\- Google Drive links;

\- sync state;

\- audit history;

\- app settings.



Google Drive and Google Docs are external document repositories, not the primary database.



\---



\## Core Rule



The local database must preserve the complete creative history of an episode.



No approved output may be overwritten.



No rejected output may be deleted automatically.



No downstream step may depend on an artifact version unless that exact version is approved.



\---



\## SQLite Requirements



The app must use SQLite with:



```sql

PRAGMA foreign\_keys = ON;

PRAGMA journal\_mode = WAL;

````



Use migrations for schema changes.



All timestamps should be stored as ISO 8601 UTC strings.



All IDs should be stable string IDs.



Recommended ID patterns:



```text

project\_...

channel\_...

episode\_...

stepdef\_...

steprun\_...

prompt\_...

promptver\_...

artifact\_...

artifactver\_...

review\_...

drivelink\_...

syncevent\_...

auditevent\_...

setting\_...

```



\---



\## Main Entities



```text

Project

Channel

Episode

WorkflowStepDefinition

WorkflowStepRun

PromptTemplate

PromptTemplateVersion

PromptVariable

EpisodeVariable

Artifact

ArtifactVersion

HumanReview

DriveFileLink

SyncEvent

AuditEvent

ExternalTask

AppSetting

```



\---



\## Entity Relationship Overview



```text

Project

&#x20; ├── Channel

&#x20; └── Episode

&#x20;       ├── EpisodeVariable

&#x20;       ├── WorkflowStepRun

&#x20;       │     ├── Artifact

&#x20;       │     │     └── ArtifactVersion

&#x20;       │     │           ├── HumanReview

&#x20;       │     │           └── DriveFileLink

&#x20;       │     └── AuditEvent

&#x20;       ├── ExternalTask

&#x20;       └── SyncEvent



WorkflowStepDefinition

&#x20; ├── PromptTemplate

&#x20; │     └── PromptTemplateVersion

&#x20; └── WorkflowStepRun

```



\---



\## `projects`



Stores local project roots.



```sql

CREATE TABLE projects (

&#x20; id TEXT PRIMARY KEY,

&#x20; name TEXT NOT NULL,

&#x20; local\_root\_path TEXT,

&#x20; drive\_root\_folder\_id TEXT,

&#x20; drive\_root\_folder\_url TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL

);

```



\### Notes



A project corresponds to a major creative workspace, such as:



```text

Project Mina-Ale

```



There may be more than one project in the future.



\---



\## `channels`



Stores reusable channel profiles.



```sql

CREATE TABLE channels (

&#x20; id TEXT PRIMARY KEY,

&#x20; project\_id TEXT NOT NULL,

&#x20; name TEXT NOT NULL,

&#x20; language TEXT,

&#x20; region TEXT,

&#x20; target\_audience TEXT,

&#x20; desired\_tone TEXT,

&#x20; narrator\_mode TEXT,

&#x20; visual\_style TEXT,

&#x20; default\_duration\_minutes INTEGER,

&#x20; spoiler\_policy TEXT,

&#x20; adaptation\_policy TEXT,

&#x20; podcast\_policy TEXT,

&#x20; shorts\_policy TEXT,

&#x20; source\_policy TEXT,

&#x20; metadata\_json TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (project\_id) REFERENCES projects(id) ON DELETE CASCADE

);

```



\### Example Channel Fields



```text

Spanish AI / Future Channel

Turkish Review Channel

Spanish Experimental AI Channel

Turkish Podcast Channel

Spanish Podcast Channel

```



\---



\## `episodes`



Stores each video/podcast production unit.



```sql

CREATE TABLE episodes (

&#x20; id TEXT PRIMARY KEY,

&#x20; project\_id TEXT NOT NULL,

&#x20; channel\_id TEXT,

&#x20; episode\_code TEXT NOT NULL,

&#x20; title TEXT NOT NULL,

&#x20; slug TEXT NOT NULL,

&#x20; topic TEXT NOT NULL,

&#x20; primary\_work TEXT,

&#x20; target\_language TEXT,

&#x20; target\_region TEXT,

&#x20; target\_audience TEXT,

&#x20; desired\_tone TEXT,

&#x20; spoiler\_policy TEXT,

&#x20; adaptation\_policy TEXT,

&#x20; research\_depth TEXT,

&#x20; status TEXT NOT NULL,

&#x20; current\_step\_number INTEGER DEFAULT 1,

&#x20; local\_folder\_path TEXT,

&#x20; drive\_folder\_id TEXT,

&#x20; drive\_folder\_url TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (project\_id) REFERENCES projects(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (channel\_id) REFERENCES channels(id) ON DELETE SET NULL

);

```



\### Episode Status Values



```text

draft

active

paused

completed

archived

```



\---



\## `workflow\_step\_definitions`



Stores canonical workflow step definitions.



```sql

CREATE TABLE workflow\_step\_definitions (

&#x20; id TEXT PRIMARY KEY,

&#x20; step\_number INTEGER NOT NULL UNIQUE,

&#x20; step\_key TEXT NOT NULL UNIQUE,

&#x20; title TEXT NOT NULL,

&#x20; short\_label TEXT NOT NULL,

&#x20; phase TEXT NOT NULL,

&#x20; description TEXT,

&#x20; output\_artifact\_type TEXT NOT NULL,

&#x20; review\_required INTEGER NOT NULL DEFAULT 1,

&#x20; is\_enabled INTEGER NOT NULL DEFAULT 1,

&#x20; icon\_name TEXT,

&#x20; sort\_order INTEGER NOT NULL,

&#x20; metadata\_json TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL

);

```



\### Required Step Definitions



```text

01 research\_brief

02 angle\_generator

03 angle\_evaluator

04 script\_blueprint

05 script\_version\_generator

06 multi\_agent\_script\_evaluator

07 master\_cut\_builder

08 final\_polish

09 visual\_layer\_builder

10 voice\_production\_plan

11 ai\_narration\_generation

12 audio\_cleanup\_podcast\_master

13 asset\_sourcing\_rights\_check

14 longform\_video\_assembly

15 derivatives\_package

16 final\_qa\_export\_publish

```



\---



\## `workflow\_step\_dependencies`



Stores dependency graph between workflow steps.



```sql

CREATE TABLE workflow\_step\_dependencies (

&#x20; id TEXT PRIMARY KEY,

&#x20; step\_definition\_id TEXT NOT NULL,

&#x20; required\_artifact\_type TEXT NOT NULL,

&#x20; required\_step\_number INTEGER,

&#x20; is\_required INTEGER NOT NULL DEFAULT 1,

&#x20; created\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (step\_definition\_id) REFERENCES workflow\_step\_definitions(id) ON DELETE CASCADE

);

```



\### Notes



This enables both linear and graph-based dependencies.



Example:



```text

Step 04 requires:

\- research\_brief

\- angle\_generator\_output

\- angle\_evaluator\_output

```



\---



\## `workflow\_step\_runs`



Stores each step instance within an episode.



```sql

CREATE TABLE workflow\_step\_runs (

&#x20; id TEXT PRIMARY KEY,

&#x20; episode\_id TEXT NOT NULL,

&#x20; step\_definition\_id TEXT NOT NULL,

&#x20; step\_number INTEGER NOT NULL,

&#x20; step\_key TEXT NOT NULL,

&#x20; state TEXT NOT NULL,

&#x20; selected\_prompt\_template\_version\_id TEXT,

&#x20; selected\_artifact\_version\_id TEXT,

&#x20; execution\_mode TEXT,

&#x20; provider TEXT,

&#x20; model TEXT,

&#x20; started\_at TEXT,

&#x20; completed\_at TEXT,

&#x20; approved\_at TEXT,

&#x20; locked\_at TEXT,

&#x20; failure\_code TEXT,

&#x20; failure\_message TEXT,

&#x20; potentially\_stale INTEGER NOT NULL DEFAULT 0,

&#x20; has\_unsynced\_changes INTEGER NOT NULL DEFAULT 0,

&#x20; metadata\_json TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (step\_definition\_id) REFERENCES workflow\_step\_definitions(id) ON DELETE RESTRICT

);

```



\### State Values



```text

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



\## `prompt\_templates`



Stores prompt template identity.



```sql

CREATE TABLE prompt\_templates (

&#x20; id TEXT PRIMARY KEY,

&#x20; step\_definition\_id TEXT NOT NULL,

&#x20; step\_number INTEGER NOT NULL,

&#x20; step\_key TEXT NOT NULL,

&#x20; title TEXT NOT NULL,

&#x20; source\_doc\_id TEXT,

&#x20; source\_doc\_url TEXT,

&#x20; is\_active INTEGER NOT NULL DEFAULT 1,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (step\_definition\_id) REFERENCES workflow\_step\_definitions(id) ON DELETE CASCADE

);

```



\---



\## `prompt\_template\_versions`



Stores imported prompt template versions.



```sql

CREATE TABLE prompt\_template\_versions (

&#x20; id TEXT PRIMARY KEY,

&#x20; prompt\_template\_id TEXT NOT NULL,

&#x20; version\_number INTEGER NOT NULL,

&#x20; source\_modified\_time TEXT,

&#x20; content\_hash TEXT NOT NULL,

&#x20; local\_cache\_path TEXT NOT NULL,

&#x20; raw\_text TEXT,

&#x20; extracted\_placeholders\_json TEXT,

&#x20; placeholder\_map\_json TEXT,

&#x20; status TEXT NOT NULL,

&#x20; imported\_at TEXT NOT NULL,

&#x20; created\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (prompt\_template\_id) REFERENCES prompt\_templates(id) ON DELETE CASCADE

);

```



\### Version Status Values



```text

active

archived

superseded

conflict

```



\---



\## `prompt\_variables`



Stores canonical variable definitions.



```sql

CREATE TABLE prompt\_variables (

&#x20; id TEXT PRIMARY KEY,

&#x20; key TEXT NOT NULL UNIQUE,

&#x20; label TEXT NOT NULL,

&#x20; description TEXT,

&#x20; value\_type TEXT NOT NULL,

&#x20; source\_type TEXT NOT NULL,

&#x20; is\_required\_by\_default INTEGER NOT NULL DEFAULT 0,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL

);

```



\### Value Types



```text

string

long\_text

markdown

enum

number

boolean

json

artifact\_reference

file\_reference

drive\_reference

```



\### Source Types



```text

human

episode

channel

artifact

system

external

```



\---



\## `step\_variable\_requirements`



Maps workflow steps to required variables.



```sql

CREATE TABLE step\_variable\_requirements (

&#x20; id TEXT PRIMARY KEY,

&#x20; step\_definition\_id TEXT NOT NULL,

&#x20; variable\_key TEXT NOT NULL,

&#x20; required INTEGER NOT NULL DEFAULT 1,

&#x20; source\_type TEXT NOT NULL,

&#x20; placeholder\_examples\_json TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (step\_definition\_id) REFERENCES workflow\_step\_definitions(id) ON DELETE CASCADE

);

```



\---



\## `episode\_variables`



Stores actual variable values for an episode.



```sql

CREATE TABLE episode\_variables (

&#x20; id TEXT PRIMARY KEY,

&#x20; episode\_id TEXT NOT NULL,

&#x20; variable\_key TEXT NOT NULL,

&#x20; value\_text TEXT,

&#x20; value\_json TEXT,

&#x20; source\_type TEXT NOT NULL,

&#x20; source\_artifact\_version\_id TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE

);

```



\### Notes



Examples:



```text

episode\_topic

target\_language

spoiler\_policy

adaptation\_policy

human\_editorial\_decision

visual\_style

known\_audio\_issues

```



\---



\## `artifacts`



Stores logical outputs.



```sql

CREATE TABLE artifacts (

&#x20; id TEXT PRIMARY KEY,

&#x20; episode\_id TEXT NOT NULL,

&#x20; step\_run\_id TEXT NOT NULL,

&#x20; step\_number INTEGER NOT NULL,

&#x20; artifact\_type TEXT NOT NULL,

&#x20; title TEXT NOT NULL,

&#x20; current\_version\_id TEXT,

&#x20; approved\_version\_id TEXT,

&#x20; status TEXT NOT NULL,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (step\_run\_id) REFERENCES workflow\_step\_runs(id) ON DELETE CASCADE

);

```



\### Artifact Status Values



```text

candidate

approved

rejected

superseded

locked

archived

```



\---



\## `artifact\_versions`



Stores immutable output versions.



```sql

CREATE TABLE artifact\_versions (

&#x20; id TEXT PRIMARY KEY,

&#x20; artifact\_id TEXT NOT NULL,

&#x20; episode\_id TEXT NOT NULL,

&#x20; step\_run\_id TEXT NOT NULL,

&#x20; version\_number INTEGER NOT NULL,

&#x20; title TEXT NOT NULL,

&#x20; content\_hash TEXT NOT NULL,

&#x20; local\_snapshot\_path TEXT NOT NULL,

&#x20; rendered\_prompt\_snapshot\_path TEXT,

&#x20; source\_type TEXT NOT NULL,

&#x20; parent\_artifact\_version\_id TEXT,

&#x20; prompt\_template\_version\_id TEXT,

&#x20; provider TEXT,

&#x20; model TEXT,

&#x20; token\_input\_count INTEGER,

&#x20; token\_output\_count INTEGER,

&#x20; estimated\_cost REAL,

&#x20; status TEXT NOT NULL,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (artifact\_id) REFERENCES artifacts(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (step\_run\_id) REFERENCES workflow\_step\_runs(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (parent\_artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE SET NULL,

&#x20; FOREIGN KEY (prompt\_template\_version\_id) REFERENCES prompt\_template\_versions(id) ON DELETE SET NULL

);

```



\### Source Types



```text

manual\_paste

openai\_api

gemini\_api

manual\_edit

imported\_from\_drive

system\_generated

```



\### Version Status Values



```text

candidate

awaiting\_review

approved

rejected

superseded

locked

sync\_pending

synced

sync\_conflict

```



\---



\## `artifact\_dependencies`



Stores exact dependency references between artifact versions.



```sql

CREATE TABLE artifact\_dependencies (

&#x20; id TEXT PRIMARY KEY,

&#x20; artifact\_version\_id TEXT NOT NULL,

&#x20; depends\_on\_artifact\_version\_id TEXT NOT NULL,

&#x20; dependency\_type TEXT NOT NULL,

&#x20; created\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (depends\_on\_artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE RESTRICT

);

```



\### Notes



A Step 04 blueprint artifact version should reference the exact approved versions of:



```text

research\_brief

angle\_generator\_output

angle\_evaluator\_output

```



This preserves reproducibility.



\---



\## `human\_reviews`



Stores human review decisions.



```sql

CREATE TABLE human\_reviews (

&#x20; id TEXT PRIMARY KEY,

&#x20; episode\_id TEXT NOT NULL,

&#x20; step\_run\_id TEXT NOT NULL,

&#x20; artifact\_version\_id TEXT NOT NULL,

&#x20; decision TEXT NOT NULL,

&#x20; feedback\_text TEXT,

&#x20; reviewer\_name TEXT,

&#x20; created\_followup\_version\_id TEXT,

&#x20; reviewed\_at TEXT NOT NULL,

&#x20; created\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (step\_run\_id) REFERENCES workflow\_step\_runs(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (created\_followup\_version\_id) REFERENCES artifact\_versions(id) ON DELETE SET NULL

);

```



\### Decision Values



```text

approve

reject

request\_regeneration

manual\_edit

save\_as\_alternative

lock\_version

return\_to\_previous\_step

```



\---



\## `drive\_file\_links`



Links local records to Google Drive / Docs files.



```sql

CREATE TABLE drive\_file\_links (

&#x20; id TEXT PRIMARY KEY,

&#x20; project\_id TEXT,

&#x20; episode\_id TEXT,

&#x20; artifact\_version\_id TEXT,

&#x20; prompt\_template\_id TEXT,

&#x20; drive\_file\_id TEXT NOT NULL,

&#x20; drive\_file\_url TEXT NOT NULL,

&#x20; drive\_folder\_id TEXT,

&#x20; file\_name TEXT NOT NULL,

&#x20; mime\_type TEXT,

&#x20; remote\_modified\_time TEXT,

&#x20; remote\_content\_hash TEXT,

&#x20; link\_type TEXT NOT NULL,

&#x20; sync\_status TEXT NOT NULL,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (project\_id) REFERENCES projects(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (prompt\_template\_id) REFERENCES prompt\_templates(id) ON DELETE CASCADE

);

```



\### Link Types



```text

project\_root

episode\_folder

prompt\_template\_doc

output\_doc

asset\_folder

metadata\_doc

```



\### Sync Status Values



```text

not\_synced

sync\_pending

synced

sync\_conflict

remote\_missing

local\_missing

failed

```



\---



\## `sync\_events`



Stores sync attempts and results.



```sql

CREATE TABLE sync\_events (

&#x20; id TEXT PRIMARY KEY,

&#x20; project\_id TEXT,

&#x20; episode\_id TEXT,

&#x20; artifact\_version\_id TEXT,

&#x20; drive\_file\_link\_id TEXT,

&#x20; direction TEXT NOT NULL,

&#x20; operation TEXT NOT NULL,

&#x20; status TEXT NOT NULL,

&#x20; message TEXT,

&#x20; error\_code TEXT,

&#x20; started\_at TEXT NOT NULL,

&#x20; completed\_at TEXT,

&#x20; metadata\_json TEXT,

&#x20; FOREIGN KEY (project\_id) REFERENCES projects(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (drive\_file\_link\_id) REFERENCES drive\_file\_links(id) ON DELETE SET NULL

);

```



\### Direction Values



```text

local\_to\_drive

drive\_to\_local

bidirectional\_check

```



\### Operation Values



```text

import\_prompt\_template

create\_output\_doc

update\_output\_doc

refresh\_remote\_metadata

detect\_conflict

resolve\_conflict

```



\### Status Values



```text

started

success

failed

conflict

skipped

```



\---



\## `audit\_events`



Stores local audit history.



```sql

CREATE TABLE audit\_events (

&#x20; id TEXT PRIMARY KEY,

&#x20; project\_id TEXT,

&#x20; episode\_id TEXT,

&#x20; step\_run\_id TEXT,

&#x20; artifact\_version\_id TEXT,

&#x20; event\_type TEXT NOT NULL,

&#x20; event\_source TEXT NOT NULL,

&#x20; from\_state TEXT,

&#x20; to\_state TEXT,

&#x20; message TEXT,

&#x20; metadata\_json TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (project\_id) REFERENCES projects(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (step\_run\_id) REFERENCES workflow\_step\_runs(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE SET NULL

);

```



\### Event Types



```text

PROJECT\_CREATED

CHANNEL\_CREATED

EPISODE\_CREATED

STEP\_UNLOCKED

STEP\_INPUT\_UPDATED

STEP\_EXECUTION\_STARTED

PROMPT\_RENDERED

OUTPUT\_GENERATED

OUTPUT\_IMPORTED\_MANUALLY

HUMAN\_APPROVED

HUMAN\_REJECTED

REGENERATION\_REQUESTED

MANUAL\_EDIT\_CREATED

ARTIFACT\_LOCKED

ARTIFACT\_SUPERSEDED

SYNC\_STARTED

SYNC\_COMPLETED

SYNC\_FAILED

SYNC\_CONFLICT

STEP\_FAILED

```



\---



\## `external\_tasks`



Tracks work that happens outside the app.



Examples:



\* generate audio in ElevenLabs;

\* clean audio in Audacity;

\* collect visual assets;

\* edit video in DaVinci Resolve;

\* export podcast file;

\* publish to YouTube.



```sql

CREATE TABLE external\_tasks (

&#x20; id TEXT PRIMARY KEY,

&#x20; episode\_id TEXT NOT NULL,

&#x20; related\_step\_number INTEGER,

&#x20; title TEXT NOT NULL,

&#x20; description TEXT,

&#x20; task\_type TEXT NOT NULL,

&#x20; status TEXT NOT NULL,

&#x20; external\_tool TEXT,

&#x20; source\_artifact\_version\_id TEXT,

&#x20; due\_date TEXT,

&#x20; completed\_at TEXT,

&#x20; metadata\_json TEXT,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL,

&#x20; FOREIGN KEY (episode\_id) REFERENCES episodes(id) ON DELETE CASCADE,

&#x20; FOREIGN KEY (source\_artifact\_version\_id) REFERENCES artifact\_versions(id) ON DELETE SET NULL

);

```



\### Task Types



```text

audio\_generation

audio\_cleanup

asset\_collection

rights\_check

video\_editing

thumbnail\_design

metadata\_review

publishing

post\_publish\_review

```



\### Task Status Values



```text

not\_started

in\_progress

waiting

completed

blocked

cancelled

```



\---



\## `app\_settings`



Stores local app settings.



```sql

CREATE TABLE app\_settings (

&#x20; id TEXT PRIMARY KEY,

&#x20; key TEXT NOT NULL UNIQUE,

&#x20; value\_text TEXT,

&#x20; value\_json TEXT,

&#x20; is\_secret INTEGER NOT NULL DEFAULT 0,

&#x20; created\_at TEXT NOT NULL,

&#x20; updated\_at TEXT NOT NULL

);

```



\### Settings Examples



```text

default\_project\_id

default\_ai\_provider

openai\_model

gemini\_model

manual\_mode\_default

drive\_sync\_mode

local\_snapshot\_root

theme

accent\_color

```



Secrets should use secure local storage when available, not plain SQLite.



\---



\## Recommended Indexes



```sql

CREATE INDEX idx\_episodes\_project\_id ON episodes(project\_id);

CREATE INDEX idx\_episodes\_channel\_id ON episodes(channel\_id);

CREATE INDEX idx\_step\_runs\_episode\_id ON workflow\_step\_runs(episode\_id);

CREATE INDEX idx\_step\_runs\_step\_number ON workflow\_step\_runs(step\_number);

CREATE INDEX idx\_artifacts\_episode\_id ON artifacts(episode\_id);

CREATE INDEX idx\_artifacts\_step\_run\_id ON artifacts(step\_run\_id);

CREATE INDEX idx\_artifact\_versions\_artifact\_id ON artifact\_versions(artifact\_id);

CREATE INDEX idx\_artifact\_versions\_episode\_id ON artifact\_versions(episode\_id);

CREATE INDEX idx\_human\_reviews\_artifact\_version\_id ON human\_reviews(artifact\_version\_id);

CREATE INDEX idx\_drive\_links\_artifact\_version\_id ON drive\_file\_links(artifact\_version\_id);

CREATE INDEX idx\_sync\_events\_episode\_id ON sync\_events(episode\_id);

CREATE INDEX idx\_audit\_events\_episode\_id ON audit\_events(episode\_id);

CREATE INDEX idx\_external\_tasks\_episode\_id ON external\_tasks(episode\_id);

```



\---



\## Artifact Type Constants



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



\## Data Integrity Rules



\### Rule 1



An artifact version cannot be approved without a local snapshot path.



\### Rule 2



A workflow step cannot be marked approved without an approved artifact version.



\### Rule 3



A downstream artifact version must reference exact upstream artifact versions.



\### Rule 4



Rejected artifact versions remain in history.



\### Rule 5



Locked artifact versions cannot be overwritten.



\### Rule 6



Drive sync state must not replace editorial approval state.



\### Rule 7



Prompt template versions must be preserved for reproducibility.



\### Rule 8



Manual edits create new artifact versions.



\### Rule 9



Every state transition creates an audit event.



\### Rule 10



External production work is tracked as an external task, not as completed automatically.



\---



\## Seed Data



The app should seed the 16 workflow step definitions on first launch.



Seed values:



```text

01 | research\_brief | Research | 01 — Research Brief Builder

02 | angle\_generator | Angles | 02 — Angle \& Thesis Generator

03 | angle\_evaluator | Evaluate | 03 — Angle Evaluator

04 | script\_blueprint | Blueprint | 04 — Script Blueprint Builder

05 | script\_version\_generator | Drafts | 05 — Script Version Generator

06 | multi\_agent\_script\_evaluator | Board | 06 — Multi-Agent Script Evaluator

07 | master\_cut\_builder | Master | 07 — Master Cut Builder

08 | final\_polish | Polish | 08 — Layered Rewrite \& Final Polish

09 | visual\_layer\_builder | Visuals | 09 — Visual Layer Builder

10 | voice\_production\_plan | Voice | 10 — Voice Production Plan

11 | ai\_narration\_generation | Narration | 11 — AI Narration Generation

12 | audio\_cleanup\_podcast\_master | Audio | 12 — Audio Cleanup \& Podcast Master

13 | asset\_sourcing\_rights\_check | Assets | 13 — Asset Sourcing \& Rights Check

14 | longform\_video\_assembly | Assembly | 14 — Long-Form Video Assembly

15 | derivatives\_package | Derivatives | 15 — Derivatives Package

16 | final\_qa\_export\_publish | Publish | 16 — Final QA, Export \& Publish

```



\---



\## Example Episode Record



```json

{

&#x20; "id": "episode\_001",

&#x20; "project\_id": "project\_mina\_ale",

&#x20; "channel\_id": "channel\_spanish\_ai\_future",

&#x20; "episode\_code": "EP001",

&#x20; "title": "The Shining and the Architecture of Addiction",

&#x20; "slug": "the-shining-architecture-addiction",

&#x20; "topic": "The Shining",

&#x20; "primary\_work": "Stanley Kubrick film and Stephen King novel",

&#x20; "target\_language": "Spanish",

&#x20; "target\_region": "Spain / Latin America",

&#x20; "target\_audience": "Video essay audience interested in cinema, literature, psychology, and culture",

&#x20; "desired\_tone": "Elegant, darkly funny, analytical, emotionally precise",

&#x20; "spoiler\_policy": "allowed",

&#x20; "adaptation\_policy": "controlled\_contrast",

&#x20; "research\_depth": "deep\_research\_dossier",

&#x20; "status": "active",

&#x20; "current\_step\_number": 1

}

```



\---



\## Example Artifact Version Record



```json

{

&#x20; "id": "artifactver\_ep001\_s01\_v001",

&#x20; "artifact\_id": "artifact\_ep001\_s01\_research\_brief",

&#x20; "episode\_id": "episode\_001",

&#x20; "step\_run\_id": "steprun\_ep001\_s01",

&#x20; "version\_number": 1,

&#x20; "title": "EP001 S01 Research Brief v001",

&#x20; "content\_hash": "sha256\_hash\_here",

&#x20; "local\_snapshot\_path": ".local-data/snapshots/episodes/EP001/S01/EP001\_S01\_ResearchBrief\_v001.md",

&#x20; "source\_type": "manual\_paste",

&#x20; "provider": null,

&#x20; "model": null,

&#x20; "status": "awaiting\_review"

}

```



\---



\## MVP Data Scope



For MVP, implement these tables first:



```text

projects

channels

episodes

workflow\_step\_definitions

workflow\_step\_dependencies

workflow\_step\_runs

prompt\_templates

prompt\_template\_versions

episode\_variables

artifacts

artifact\_versions

artifact\_dependencies

human\_reviews

drive\_file\_links

sync\_events

audit\_events

app\_settings

```



Implement `external\_tasks` after Step 09–16 become active.



\---



\## Definition of Done



The data model is complete when:



```text

SQLite stores all project, channel, episode, workflow, prompt, artifact, review, sync, and audit state.

All 16 workflow steps are seeded.

Step dependencies are represented.

Prompt templates can be versioned.

Artifacts have immutable versions.

Human reviews are stored.

Approved artifact versions can unlock downstream steps.

Rejected and superseded versions remain traceable.

Drive links are tracked separately from local artifacts.

Sync events are auditable.

Manual mode works without external APIs.

The database can reconstruct the full creative history of an episode.

```



```

```




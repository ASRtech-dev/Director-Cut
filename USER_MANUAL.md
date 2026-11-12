# Director Cut — User Manual

> **Version 0.1.0** · A local-first desktop application for managing a 16-step AI-assisted audiovisual production workflow.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation](#2-installation)
3. [First Launch & Initial Setup](#3-first-launch--initial-setup)
4. [Application Layout](#4-application-layout)
5. [Dashboard — Production Queue](#5-dashboard--production-queue)
6. [Creating Episodes](#6-creating-episodes)
7. [Managing Channels](#7-managing-channels)
8. [The 16-Step Production Pipeline](#8-the-16-step-production-pipeline)
9. [Step Workspace](#9-step-workspace)
10. [AI Generation](#10-ai-generation)
11. [Reviewing & Approving Outputs](#11-reviewing--approving-outputs)
12. [Production Roadmap (Workflow Graph)](#12-production-roadmap-workflow-graph)
13. [Step AI Model Routing](#13-step-ai-model-routing)
14. [Cost & Usage Analytics](#14-cost--usage-analytics)
15. [Prompt Library](#15-prompt-library)
16. [Settings & API Configuration](#16-settings--api-configuration)
17. [Multi-User Setup (Mina & Ale)](#17-multi-user-setup-mina--ale)
18. [Studio Wi-Fi Chat](#18-studio-wi-fi-chat)
19. [Google Drive Integration](#19-google-drive-integration)
20. [Sandbox (Ideas Board)](#20-sandbox-ideas-board)
21. [Audit Activity Log](#21-audit-activity-log)
22. [Keyboard Shortcuts](#22-keyboard-shortcuts)
23. [Troubleshooting](#23-troubleshooting)
24. [Appendix A — API Provider Setup Guides](#24-appendix-a--api-provider-setup-guides)

---

## 1. Overview

**Director Cut** is a local-first desktop application designed for a two-person creative team (Mina & Ale) to produce high-quality audiovisual content using AI assistance. It orchestrates a complete creative and production process — from initial topic research to final QA and publication planning — through a structured 16-step pipeline.

### What Director Cut Is

- A **local creative production operating system** that runs on your Windows computer.
- A **structured workflow manager** that guides you through each stage of video/podcast production.
- An **AI orchestrator** that lets you use multiple AI providers (OpenAI, Gemini, DeepSeek, Kimi, Qwen) at each step.
- A **collaboration tool** that allows two users to work simultaneously over a local Wi-Fi network.

### What Director Cut Is Not

- It is **not** a generic prompt runner or chatbot.
- It does **not** replace human creative direction — every AI-generated output requires human review and approval.
- It does **not** require internet deployment — it runs entirely on your local machine(s).

---

## 2. Installation

### System Requirements

- **Operating System:** Windows 10 or later (x64)
- **Disk Space:** ~50 MB for the application
- **Network:** Wi-Fi connection required only for multi-user sync and AI API calls

### Installing the Application

1. Locate the installer file: `Director Cut_0.1.0_x64-setup.exe` (found in the `installers/` folder of the project).
2. Double-click the installer to launch the NSIS setup wizard.
3. Follow the on-screen prompts to choose an installation directory.
4. Once installed, launch **Director Cut** from the Start Menu or Desktop shortcut.

### Installing on a Second Computer (for Multi-User)

Copy the same `Director Cut_0.1.0_x64-setup.exe` file to the second computer and install it following the same steps. See [Section 17](#17-multi-user-setup-mina--ale) for network sync configuration.

---

## 3. First Launch & Initial Setup

When you first open Director Cut, the application will:

1. **Initialize a local SQLite database** with all required tables and seed data.
2. **Load the default prompt templates** for the 16 production steps.
3. **Display the Dashboard** (Production Queue) view.

### Recommended First Steps

1. **Configure your AI API Keys** — Click the ⚙️ gear icon in the top-right corner to open Settings. Enter at least one AI provider API key (e.g., OpenAI or Gemini) in the **AI API Keys** tab.
2. **Create a Channel** — Channels define reusable creative constraints (language, tone, audience). You'll be prompted to create one when making your first episode.
3. **Create your first Episode** — Click the **+ New Episode** button on the Dashboard.

---

## 4. Application Layout

Director Cut uses a clean, three-level layout inspired by professional editing software like DaVinci Resolve:

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR: Navigation · Episode Selector · Status · Chat · ⚙  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    MAIN CONTENT AREA                         │
│        (Dashboard / Workspace / Prompt Library)              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  BOTTOM NAV: Step 01 → Step 16 (visible in Workspace view)  │
└──────────────────────────────────────────────────────────────┘
```

### Top Bar Elements

| Element | Description |
|---------|-------------|
| **Logo & Title** | "Director Cut" brand mark |
| **Navigation Tabs** | Switch between *Dashboard*, *Workspace*, and *Prompt Library* |
| **Episode Selector** | Dropdown to quickly switch between episodes (visible in Workspace view) |
| **Drive Status** | Green badge if Google Drive is connected, gray if not |
| **Database Status** | Green "Local DB" or blue "Network DB" indicator |
| **Active Profile** | Pulsing badge showing current user (e.g., `MINA` or `ALE`) |
| **💬 Chat Icon** | Opens the Studio Wi-Fi Chat sidebar |
| **⚙️ Settings Icon** | Opens the Developer Settings modal |

### Three Main Views

1. **Dashboard** — Your production command center. See all episodes, priority actions, analytics, and activity logs.
2. **Workspace** — The step-by-step production environment where you write, generate, review, and approve content.
3. **Prompt Library** — Manage and edit the prompt templates used at each production step.

---

## 5. Dashboard — Production Queue

The Dashboard is your home screen. It is organized into several sections:

### Priority Action Hub ("Atención Prioritaria")

At the very top, you'll see episode cards that need your immediate attention:
- **Awaiting Review** (amber glow) — Steps with generated output waiting for your approval.
- **Processing** (blue glow) — Steps currently running an AI generation task.

### Quick Studio Guide

A subtle tip banner explains the basic workflow:
> *"To produce a video, select any episode draft from the queue below. Inside the Workspace, you'll write creative guidelines, run step-specific AI models, and review the candidates. Click Approve on each step to progress along the 16-stage pipeline."*

### Compact Inline Metrics

Displayed in the header area, showing at a glance:
- **Total Episodes** — Number of episodes in your project
- **Average Progress** — Percentage of steps completed across all episodes
- **Awaiting Review** — Number of steps pending your decision

### Episode Cards

Each episode appears as a card showing:
- **Title and topic**
- **Channel assignment** (if any)
- **Assigned user** (Mina or Ale)
- **Step progress bar** — Color-coded dots showing the status of all 16 steps
- **Quick actions** — Click to open the episode in the Workspace

### Filters & Search

Use the controls at the top of the queue to:
- **Search** by episode title or topic
- **Filter by status**: All, Drafting, In Review, Completed
- **Filter by channel**
- **Filter by assignee**: All, Unassigned, Mina, Ale

### Dashboard Tabs

The dashboard has three sub-tabs accessible at the top:
1. **Production Queue** — The main episode list (default view)
2. **Cost & Usage Analytics** — Token usage and API spend tracking
3. **Step AI Routing** — Configure which AI model to use for each step

### Creative Sidebar

On the right side of the Dashboard you'll find:
- **Sandbox (Ideas Board)** — Quick-capture ideas for future episodes
- **Recent Studio Activity** — A live audit log of recent actions (e.g., "[Mina] Approved version for step 3")
- **Weekly Publishing Schedule** — A slot-based scheduler for planning releases

### Developer Diagnostics

At the bottom of the Production Queue tab, there's a collapsible drawer showing:
- SQLite connection status
- Google Drive sync status
- Configured AI provider keys

---

## 6. Creating Episodes

### How to Create an Episode

1. Click the **+ New Episode** button on the Dashboard (or click the **+** icon in the top bar).
2. Fill in the creation form:

| Field | Description | Required? |
|-------|-------------|-----------|
| **Title** | The name of the episode | ✅ Yes |
| **Topic** | The subject matter or theme | ✅ Yes |
| **Channel** | Which channel this episode belongs to | Optional |
| **Assigned To** | Mina or Ale (defaults to your active profile) | Optional |
| **Target Language** | Production language | Optional |
| **Target Region** | Geographic focus | Optional |
| **Target Audience** | Who is this for | Optional |
| **Desired Tone** | Creative tone (e.g., analytical, conversational) | Optional |
| **Spoiler Policy** | How to handle spoilers | Optional |
| **Adaptation Policy** | Rules for adapting source material | Optional |
| **Research Depth** | How deep the research should go | Optional |

3. Click **Create Episode**.
4. You will be automatically taken to the **Workspace** for Step 1 (Research).

### Tips

- If you select a Channel, many fields (language, tone, audience) will be auto-filled from the channel's defaults.
- You can create episodes from the **Sandbox** by clicking the arrow icon next to an idea — the idea text will pre-fill the topic field.

---

## 7. Managing Channels

Channels are reusable profiles that define the creative constraints for a series of episodes. For example, you might have separate channels for "Tech Reviews (English)" and "Video Essays (Spanish)."

### Creating a Channel

1. On the Dashboard, scroll to the episode creation form.
2. Click **"+ Create Channel"** or find the channel management section.
3. Fill in the channel profile:
   - **Name** — Channel identifier (e.g., "Main YouTube Channel")
   - **Language & Region** — Default language and geographic targeting
   - **Target Audience** — Who the channel serves
   - **Desired Tone** — Overall creative voice
   - **Narrator Mode** — First person, third person, etc.
   - **Visual Style** — Aesthetic preferences
   - **Default Duration** — Expected video length in minutes
   - **Spoiler Policy** — Channel-wide spoiler rules
   - **Outro Template** — Standard outro text
   - **Sponsor Guidelines** — Sponsorship integration rules

### Editing a Channel

Click the edit icon next to a channel name in the Dashboard to modify its properties. Changes will apply to future episodes created under that channel.

---

## 8. The 16-Step Production Pipeline

Director Cut organizes video production into 16 sequential steps, grouped into 4 phases:

### Phase 1: Creative & Prep (Steps 1–4)

| Step | Name | Purpose |
|------|------|---------|
| 01 | **Research** | Builds the initial research brief for the episode |
| 02 | **Angles** | Generates creative angles and thesis options |
| 03 | **Evaluate** | Evaluates angles against channel strategy |
| 04 | **Blueprint** | Builds the narrative structural blueprint |

### Phase 2: Drafting & Polish (Steps 5–8)

| Step | Name | Purpose |
|------|------|---------|
| 05 | **Drafts** | Generates multiple script versions based on the blueprint |
| 06 | **Board** | Multi-agent script evaluation |
| 07 | **Master** | Master cut script builder |
| 08 | **Polish** | Layered rewrite & final polish |

### Phase 3: Sound & Visual Design (Steps 9–12)

| Step | Name | Purpose |
|------|------|---------|
| 09 | **Visuals** | Visual layer builder — plan B-roll, graphics, overlays |
| 10 | **Voice** | Voice production plan |
| 11 | **Narration** | AI narration generation |
| 12 | **Audio** | Audio cleanup & podcast master |

### Phase 4: Sourcing & Publishing (Steps 13–16)

| Step | Name | Purpose |
|------|------|---------|
| 13 | **Assets** | Asset sourcing & rights check |
| 14 | **Assembly** | Long-form video assembly plan |
| 15 | **Derivatives** | Derivatives package (shorts, clips, social) |
| 16 | **Publish** | Final QA, export & publish |

### Step States

Each step has a dynamic state indicated by color-coded badges:

| State | Color | Meaning |
|-------|-------|---------|
| **Blocked** | Gray | Waiting for a prerequisite step to be approved |
| **Ready** | Indigo | Available for work — you can write notes and generate |
| **Running** | Blue (pulsing) | AI generation is currently in progress |
| **Awaiting Review** | Amber (pulsing) | Output generated — waiting for your review |
| **Approved** | Green | You've approved the output — next steps are unlocked |

### How Steps Progress

1. Step 1 (Research) is always unlocked and **Ready** when you create an episode.
2. Write your creative notes and guidelines for the step.
3. Run the AI generator to produce a candidate draft.
4. Review the output and click **Approve** to unlock the next step.
5. Repeat for each step. The output of each approved step automatically feeds as input into the next one.

---

## 9. Step Workspace

The Workspace is where production happens. When you select an episode and step, you'll see a split-panel layout:

### Left Panel — Creative Inputs

This is where you provide your creative direction:
- **Human Notes** — Free-form text area for your ideas, tone instructions, and creative guidelines for this step.
- **Final Thesis / Main Direction** — A focused field for the episode's central thesis (when applicable).
- **Narrator Mode** — Toggle for the narrator's perspective.

> **Production Tip** (shown in the panel):
> 1. Add your creative ideas & tone notes above.
> 2. Save the notes, then click the AI Generator tab.
> 3. Press "Run Prompt via API" to generate the candidate draft.
> 4. Review and click Approve to unlock the next production step.

### Right Panel — Output & Review

This panel has multiple tabs:
- **📝 Output** — View the generated content (rendered as formatted Markdown).
- **🤖 AI Generator** — Configure and run AI generation for this step.
- **📋 Review Console** — Compare versions, approve/reject, and manage the review process.

### Bottom Navigation Bar

A persistent bar at the bottom shows all 16 steps as clickable icons. Each icon has a status indicator dot:
- **Green dot** = Approved
- **Amber dot** = Awaiting review
- **Indigo dot** = Ready
- **Gray dot** = Blocked

Click any unlocked step to jump directly to it.

---

## 10. AI Generation

### How to Generate Content

1. Navigate to the step you want to work on in the Workspace.
2. Write your creative notes in the left panel and click **Save**.
3. Switch to the **AI Generator** tab in the right panel.
4. Select your AI **Provider** and **Model** from the dropdowns (or use the defaults from Step AI Routing).
5. Click **▶ Run Prompt via API**.

> *"This will execute the template using your custom guidelines to generate a new candidate draft."*

### What Happens During Generation

1. The app loads the prompt template assigned to this step.
2. It fills in all template placeholders with:
   - Outputs from previously approved steps
   - Your human notes and creative direction
   - Episode metadata (language, tone, audience, etc.)
   - Channel configuration
3. It sends the complete prompt to the selected AI provider's API.
4. The generated response is saved as a new **artifact version** with a local snapshot.
5. The step state changes to **Awaiting Review**.

### Supported AI Providers

| Provider | Models |
|----------|--------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1-preview, o1-mini |
| **Gemini** | gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro |
| **DeepSeek** | deepseek-chat, deepseek-coder |
| **Kimi** | moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k |
| **Qwen** | qwen3.6-plus, qwen3.5-plus, qwen-plus, qwen-max, qwen-turbo |

### Manual Paste Mode

If you prefer to generate content externally (e.g., in ChatGPT or Claude), you can use the **Manual Paste** option:
1. Switch to Manual Paste mode in the AI Generator tab.
2. Paste your externally generated text.
3. Click **Save as New Version**.

---

## 11. Reviewing & Approving Outputs

After AI generation (or manual paste), the step enters the **Awaiting Review** state. Open the **Review Console** tab to manage the output.

### Review Actions

| Action | Description |
|--------|-------------|
| **Approve** | Accept this version as the final output for this step. Unlocks dependent steps. |
| **Reject** | Mark this version as rejected. You can then regenerate or paste a new version. |
| **Regenerate** | Run the AI generator again to produce a new candidate version. |
| **Manual Edit** | Edit the generated text directly before approving. |
| **Save as Alternative** | Keep this version as a reference without approving it. |
| **Lock Version** | Lock a specific version to prevent accidental changes. |
| **Return to Previous Step** | Go back to an earlier step if the foundation needs revision. |

### Version History

Every generation and edit creates a new version. You can:
- **Browse all versions** for the current step.
- **Compare versions** side-by-side.
- **Select any version** to view its full content.
- **Restore a previous version** if the latest one is unsatisfactory.

### Quality Checklist

Each step has an associated quality checklist that appears in the review panel. Check off items as you verify the output meets your standards.

---

## 12. Production Roadmap (Workflow Graph)

The **Production Roadmap** is a visual, glassmorphic map of the entire 16-step pipeline. Access it from the Workspace by clicking the roadmap toggle.

### Visual Elements

- Steps are arranged in a 4-phase grid layout.
- Each step card shows:
  - Step number and name
  - Current status badge (Approved, Review, Ready, Running, Locked)
  - Status-appropriate icon
- **Color coding:**
  - 🟢 Green border = Approved
  - 🟡 Amber glow (pulsing) = Awaiting Review
  - 🔵 Blue glow (pulsing) = Processing / Running
  - 🟣 Indigo = Ready to run
  - ⚫ Muted gray with lock = Blocked

### Navigation

Click any **unlocked** step card to jump directly to that step's workspace. Blocked steps cannot be clicked.

---

## 13. Step AI Model Routing

You can assign different AI providers and models to individual steps. This is useful when, for example, you want to use GPT-4o for script drafting but Gemini for structural evaluation.

### How to Configure

**Method 1: Dashboard Grid**
1. Go to the Dashboard.
2. Click the **Step AI Routing** tab.
3. For each of the 16 steps, select a **Provider** and **Model** from the dropdowns.
4. Changes are saved automatically with a visual feedback spinner.

**Method 2: Workspace Override**
1. Open any step in the Workspace.
2. In the **AI Generator** tab, use the Provider/Model dropdowns.
3. This overrides the default routing for this specific generation run.

---

## 14. Cost & Usage Analytics

Track your AI API spending and token usage from the Dashboard.

### How to Access

1. Go to the Dashboard.
2. Click the **Cost & Usage Analytics** tab.

### Key Indicators

| Metric | Description |
|--------|-------------|
| **Total Expense** | Cumulative API spend across all episodes |
| **Input Tokens** | Total prompt tokens sent to AI models |
| **Output Tokens** | Total response tokens received |
| **Provider Breakdown** | Per-provider cost and call count with progress meters |

### Generative API Log

A reverse-chronological table of all AI generation operations, including:
- Timestamp
- Episode and step
- AI model used
- Token counts (input/output)
- Estimated cost

---

## 15. Prompt Library

The Prompt Library is where you manage the prompt templates that drive each production step.

### Accessing the Library

Click **Prompt Library** in the top navigation bar.

### Features

- **View all 16 prompt templates** — One for each production step.
- **Edit templates** — Modify the prompt text, adjust placeholders, and save new versions.
- **Version history** — Each template maintains a version log so you can roll back changes.
- **Hierarchical Overrides** — Save templates as Global Master, Channel Override, or Episode Override to customize instructions per context.
- **Smart Auto-Context Initialization** — Opening the library automatically selects the channel and episode of your most recently created episode. Additionally, changing the active channel dropdown will automatically select the most recent episode of that channel, keeping the Variable Assistant context loaded and active without manual steps.

### Variable Assistant Sidebar

The Prompt Library features the **Variable Assistant** sidebar, which works exactly like the one in the Workspace step editor:

- **Auto-Loaded Context Values:** When a channel and episode context is active (selected automatically on load), the cards display the current values for variables like `EPISODE_TOPIC`, `PRIMARY_WORK`, `DESIRED_TONE`, etc.
- **Inline Card Value Editing:** Click the "Current Value" block on any editable card to modify the variable's value directly from the library. The change saves immediately to the database and re-renders the preview.
- **Click-to-Insert or Select Placeholders:**
  - **When Editing:** Click a card to automatically insert its placeholder tag (e.g., `[EPISODE_TOPIC]`) at the cursor position. If the tag already exists in your template, clicking the card will scroll to and select it.
  - **When Viewing Rendered Prompt:** Click a card to smoothly scroll to and flash-highlight its occurrences in the rendered text segment.

### Template Placeholders

Common placeholders include:
- `[EPISODE_TOPIC]` → Theme/topic of this episode
- `[INITIAL_NOTES]` → Human guide notes for this step
- `[RESEARCH_NOTES]` → Step 1 research notes output
- `[FINAL_THESIS]` → Step 3 approved evaluation creative thesis
- `[NARRATOR_MODE]` → Step 10 voice narration style

The app will **not** execute a prompt if required placeholders are unresolved.

---

## 16. Settings & API Configuration

Click the **⚙️ gear icon** in the top-right corner to open the Settings modal.

### Tab: AI API Keys

Configure your AI provider credentials:

| Provider | Fields |
|----------|--------|
| **OpenAI** | API Key (`sk-...`) + Model selector |
| **Gemini** | API Key (`AIzaSy...`) + Model selector |
| **DeepSeek** | API Key + Model selector |
| **Kimi** | API Key + Model selector |
| **Qwen** | API Key + Model selector |

Each provider has a **Test Connection** button to verify your key works.

### Tab: Google Drive

Configure Google Drive integration for document sync:
1. Enter your **Google Client ID** and **Client Secret** from Google Cloud Console.
2. Set the **Redirect URI** (default: `http://localhost:14200`).
3. Optionally set a **Root Folder ID** for the project folder on Drive.
4. Follow the OAuth flow to authorize and connect.

### Tab: Local Database

- **Import Seed Prompts** — Load the standard 16-step prompt templates.
- **Reset Local Workspace** — ⚠️ Danger Zone: Deletes all episodes, step runs, artifacts, and versions. Prompt templates are preserved.

### Tab: Sync & Profiles

This tab controls multi-user collaboration:

- **Active User Profile** — Select whether this machine is logged in as **Mina** or **Ale**.
- **Local Network Synchronization** — Enable/disable network sync and configure the server address.
- **GIPHY API Integration** — Enter an optional GIPHY API key to unlock GIF search in the Studio Chat.

---

## 17. Multi-User Setup (Mina & Ale)

Director Cut supports two users working simultaneously on the same project over a local Wi-Fi network.

### Architecture

One computer acts as the **Host** (runs the central server), and both computers connect as clients.

```
   ┌──────────────┐     Wi-Fi     ┌──────────────┐
   │  Ale's PC    │ ◄──────────► │  Mina's PC   │
   │  (Host +     │               │  (Client)    │
   │   Client)    │               │              │
   └──────┬───────┘               └──────────────┘
          │
   ┌──────┴───────┐
   │  Server      │
   │  (Node.js +  │
   │   SQLite)    │
   └──────────────┘
```

### Step-by-Step Setup

#### A. Start the Server (on the Host computer)

1. Open a terminal/command prompt.
2. Navigate to the `server/` folder inside the project directory.
3. Run:
   ```bash
   npm install      # First time only
   npm start
   ```
4. The server will display:
   ```
   🚀 Director Cut Server is running!
      Local URL: http://localhost:5000
   ```
5. Note your computer's **local IP address** (e.g., `192.168.1.50`). You can find it by running `ipconfig` in a separate terminal.

#### B. Configure Both Computers

On **each** computer:

1. Open Director Cut.
2. Click **⚙️ Settings** → **Sync & Profiles** tab.
3. **Select User Profile:**
   - On Mina's computer → Select **Mina**
   - On Ale's computer → Select **Ale**
4. **Enable Network Sync:**
   - Check ✅ **Enable Local Network Sync**
   - Enter the server address:
     - On the host: `http://localhost:5000`
     - On the other computer: `http://192.168.1.50:5000` (use the host's IP)
5. Click **Test Connection** to verify.
6. Click **Save Sync Preferences**.

The application will reload and connect to the shared database. Both users will now see the same episodes, and all actions will be attributed to the respective user profile.

### Attribution

All actions are automatically tagged with the active user:
- Audit logs show entries like `[Mina] Approved version for step 3` or `[Ale] Saved candidate v1`.
- The active profile badge pulses in the top bar.

---

## 18. Studio Wi-Fi Chat

Director Cut includes a built-in chat system for Mina and Ale to communicate while working.

### Opening the Chat

Click the **💬 message bubble icon** in the top navigation bar (next to the Settings gear). A sidebar will slide in from the right.

### Features

- **Real-time messaging** — Messages sync via the shared database every 3 seconds.
- **User attribution** — Your messages appear on the right (indigo bubbles), the other person's messages appear on the left (dark bubbles).
- **Timestamps** — Each message shows the time it was sent.

### Sending GIFs

1. Click the **🖼️ image icon** next to the message input.
2. A GIF picker panel opens with two modes:

**Preloaded Reactions (no setup required):**
Choose from 8 preset reaction GIFs:
- 🎉 Celebrate
- 🤦 Facepalm
- 🤯 Mind Blown
- 👍 Thumbs Up
- 👏 Clapping
- 🔥 Panic
- ☕ Typing
- 🤔 Thinking

**GIPHY Search (requires API key):**
1. Go to **Settings → Sync & Profiles**.
2. Enter your **GIPHY API Key** (get one free at [developers.giphy.com](https://developers.giphy.com)).
3. Save settings.
4. Now the GIF picker shows a search bar. Type any keyword to search millions of GIFs.

### Connection Warning

If Wi-Fi sync is not enabled, the chat will show a warning:
> *"Wi-Fi Sync is not enabled. You can type messages locally, but Mina won't receive them until you enable sync in settings."*

---

## 19. Google Drive Integration

Director Cut can optionally sync episode outputs to Google Drive for collaborative access and archival.

### Setting Up

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Enable the **Google Drive API**.
3. Create **OAuth 2.0 Client Credentials** with redirect URI: `http://localhost:14200`.
4. Enter the Client ID and Client Secret in **Settings → Google Drive**.
5. Complete the OAuth authorization flow.

### What Gets Synced

- Episode output artifacts (research briefs, scripts, production plans)
- Version snapshots
- Episode folder structure following the standard convention

### Drive Status

The top bar shows the sync status:
- 🟢 **Synced** — Google Drive is connected and operational
- ⚪ **Not Synced** — Google Drive is not configured

---

## 20. Sandbox (Ideas Board)

The Sandbox is a quick-capture ideas board on the Dashboard sidebar.

### Using the Sandbox

1. Type an idea in the text input on the right sidebar of the Dashboard.
2. Click **Add** (or press Enter).
3. Your idea appears as a card in the ideas list.
4. Click the **→ arrow** icon on any idea to convert it into a new episode (the idea text pre-fills the topic field).
5. Click the **🗑️ trash** icon to delete an idea.

---

## 21. Audit Activity Log

Director Cut maintains a comprehensive audit trail of all actions.

### Viewing the Log

The **Recent Studio Activity** section on the Dashboard sidebar shows the latest actions in reverse chronological order.

### What Gets Logged

- Episode creation and deletion
- Step state transitions (ready → running → awaiting_review → approved)
- AI generation events (provider, model, tokens used)
- Version saves and approvals
- Manual edits
- User attribution (e.g., `[Mina]` or `[Ale]` prefix)

---

## 22. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + D` | Toggle the Developer Debug Panel (shows step states, DB queries, and refresh controls) |

---

## 23. Troubleshooting

### The app shows "Database Initialization Failed"

- Click **Retry Launch** to reload the application.
- If the error persists, try deleting the local database file and restarting.

### AI generation returns an error

- Verify your API key is correct in Settings → AI API Keys.
- Click **Test Connection** to confirm the API is reachable.
- Check your API provider's dashboard for rate limits or billing issues.

### Changes are not syncing between computers

- Ensure the server is running on the host computer (`npm start` in the `server/` folder).
- Verify both computers are on the same Wi-Fi network.
- Check the server URL in Settings → Sync & Profiles (use the host's IP address, not `localhost`, on the second computer).
- Click **Test Connection** to verify connectivity.

### Chat messages are not appearing

- Ensure Wi-Fi sync is enabled on both computers.
- The chat polls every 3 seconds — wait a moment for new messages to appear.
- Check that both users have selected different profiles (one as Mina, one as Ale).

### Steps are stuck as "Blocked"

- A step becomes unblocked only when its prerequisite step is **Approved**.
- Navigate to the previous step and approve its output.
- Step 1 (Research) is never blocked — it's always ready.

### The Workspace view button is grayed out

- You need to select an episode first. Use the episode dropdown in the top bar, or click an episode card on the Dashboard.

---

## Quick Reference: Production Workflow

```
CREATE EPISODE
     │
     ▼
Step 01: Research Brief ──── Write notes ──── Generate ──── Review ──── Approve
     │
     ▼
Step 02: Creative Angles ─── Write notes ──── Generate ──── Review ──── Approve
     │
     ▼
Step 03: Angle Evaluation ── Write notes ──── Generate ──── Review ──── Approve
     │
     ▼
     ...  (repeat for each step)
     │
     ▼
Step 16: Final QA & Publish ─ Review ──── Approve ──── ✅ EPISODE COMPLETE
```

Each step follows the same pattern:
1. **Write** your creative direction in the left panel
2. **Generate** using the AI Generator tab
3. **Review** the output in the Review Console
4. **Approve** to unlock the next step

---

## 24. Appendix A — API Provider Setup Guides

Director Cut connects to external AI services via API keys. Below you'll find summarized instructions for obtaining a key from each supported provider, and how to enter it into the application.

> **General steps (all providers):** Once you have your API key, open Director Cut → click ⚙️ Settings → **AI API Keys** tab → paste the key in the corresponding field → click **Test Connection** → click **Save API Keys**.

---

### A1. OpenAI (GPT-4o, GPT-4o-mini, o1-preview)

| Detail | Value |
|--------|-------|
| **Website** | [platform.openai.com](https://platform.openai.com) |
| **Free tier** | No (pay-as-you-go, starting at $5 minimum credit) |
| **Key format** | `sk-proj-...` or `sk-...` |

**How to get your key:**

1. Go to [platform.openai.com](https://platform.openai.com) and sign in (or create an account).
2. Click your profile icon (top-right) → **API keys** (or go directly to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
3. Click **+ Create new secret key**.
4. Give it a name (e.g., "Director Cut") and click **Create secret key**.
5. **Copy the key immediately** — it will only be shown once.
6. Go to **Settings** → **Billing** and add a payment method. Load at least $5 in credit.

**In Director Cut:**
- Paste the key in the **OpenAI → API Key** field.
- Select your preferred model (recommended: `gpt-4o`).

**Estimated costs:** GPT-4o costs approximately $2.50 per 1M input tokens / $10 per 1M output tokens. A typical episode step generation costs ~$0.02–$0.10.

---

### A2. Google Gemini (gemini-1.5-pro, gemini-1.5-flash)

| Detail | Value |
|--------|-------|
| **Website** | [aistudio.google.com](https://aistudio.google.com) |
| **Free tier** | ✅ Yes — generous free quota for Gemini 1.5 Flash |
| **Key format** | `AIzaSy...` |

**How to get your key:**

1. Go to [aistudio.google.com](https://aistudio.google.com) and sign in with your Google account.
2. Click **Get API Key** in the left sidebar (or go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
3. Click **Create API Key**.
4. Select an existing Google Cloud project, or let it create one for you.
5. Copy the generated key.

**In Director Cut:**
- Paste the key in the **Gemini → API Key** field.
- Select your preferred model (recommended: `gemini-1.5-pro` for quality, `gemini-1.5-flash` for speed/free tier).

**Estimated costs:** Gemini 1.5 Flash is free for up to 1,500 requests/day. Gemini 1.5 Pro costs ~$1.25 per 1M input tokens / $5 per 1M output tokens.

---

### A3. DeepSeek (deepseek-chat, deepseek-coder)

| Detail | Value |
|--------|-------|
| **Website** | [platform.deepseek.com](https://platform.deepseek.com) |
| **Free tier** | ✅ Yes — new accounts receive free credits |
| **Key format** | `sk-...` |

**How to get your key:**

1. Go to [platform.deepseek.com](https://platform.deepseek.com) and create an account.
2. Once logged in, navigate to **API Keys** in the left menu.
3. Click **Create new API key**.
4. Copy the generated key.
5. Check your balance under **Usage** — new accounts typically receive free initial credits.

**In Director Cut:**
- Paste the key in the **DeepSeek → API Key** field.
- Select your preferred model (recommended: `deepseek-chat` for general use).

**Estimated costs:** DeepSeek is significantly cheaper than OpenAI. deepseek-chat costs approximately $0.14 per 1M input tokens / $0.28 per 1M output tokens.

---

### A4. Kimi / Moonshot AI (moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k)

| Detail | Value |
|--------|-------|
| **Website** | [platform.moonshot.cn](https://platform.moonshot.cn) |
| **Free tier** | ✅ Yes — free credits for new accounts |
| **Key format** | `sk-...` |

**How to get your key:**

1. Go to [platform.moonshot.cn](https://platform.moonshot.cn) and create an account (phone number or email required).
2. Navigate to **API Key Management** in your dashboard.
3. Click **Create API Key**.
4. Copy the generated key.

**In Director Cut:**
- Paste the key in the **Kimi → API Key** field.
- Select your preferred model:
  - `moonshot-v1-8k` — Fastest, 8K context window
  - `moonshot-v1-32k` — Balanced, 32K context
  - `moonshot-v1-128k` — Largest context, best for long scripts

**Tip:** Kimi excels at long-context tasks. Use `moonshot-v1-128k` for steps that require processing full scripts (Steps 6–8).

---

### A5. Qwen / Alibaba Cloud (qwen3.6-plus, qwen3.5-plus, qwen-plus, etc.)

| Detail | Value |
|--------|-------|
| **Website** | [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com) |
| **Free tier** | ✅ Yes — free monthly quota for Qwen models |
| **Key format** | `sk-...` |

**How to get your key:**

1. Go to [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) and sign in with an Alibaba Cloud account (create one if needed).
2. Navigate to **API-KEY Management** in the left menu.
3. Click **Create new API Key**.
4. Copy the generated key.
5. Enable the **DashScope** service if prompted.

**In Director Cut:**
- Paste the key in the **Qwen → API Key** field.
- Select your preferred model:
  - `qwen3.6-max` — Alibaba's flagship Qwen 3.6 model, highest reasoning quality
  - `qwen3.6-plus` — Optimized Qwen 3.6 model, fast and high-quality
  - `qwen3.5-max` — Native multimodal flagship Qwen 3.5 model
  - `qwen3.5-plus` — Optimized Qwen 3.5 model (ideal for reasoning and scripting)
  - `qwen-plus` / `qwen-max` / `qwen-turbo` — Older generation models

**Estimated costs:** Qwen models offer a generous free tier monthly quota. Paid tiers start at approximately $0.40 per 1M tokens.

---

### A6. GIPHY (for Studio Chat GIF Search)

| Detail | Value |
|--------|-------|
| **Website** | [developers.giphy.com](https://developers.giphy.com) |
| **Free tier** | ✅ Yes — free for all apps |
| **Key format** | Alphanumeric string (e.g., `5xX4rG...`) |

**How to get your key:**

1. Go to [developers.giphy.com](https://developers.giphy.com) and click **Get Started** or **Log In**.
2. Sign in with a GIPHY account (create one if needed).
3. Click **Create an App**.
4. Select **API** (not SDK).
5. Enter an app name (e.g., "Director Cut Chat") and a description.
6. Click **Create App**.
7. Your **API Key** will be displayed on the app dashboard page. Copy it.

**In Director Cut:**
- Go to ⚙️ **Settings** → **Sync & Profiles** tab.
- Paste the key in the **GIPHY API Key** field.
- Click **Save Sync Preferences**.
- Now, when you open the Studio Chat and click the GIF icon, a search bar will appear allowing you to search millions of GIFs.

> **Note:** The GIPHY key is optional. Without it, you can still send GIFs using the 8 preloaded reaction GIFs (Celebrate, Facepalm, Mind Blown, etc.).

---

### Quick Reference: API Keys Summary

| Provider | Get Key At | Free? | Key Prefix | Paste In |
|----------|------------|-------|------------|----------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | No ($5 min) | `sk-...` | Settings → AI API Keys |
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | ✅ Yes | `AIzaSy...` | Settings → AI API Keys |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | ✅ Yes | `sk-...` | Settings → AI API Keys |
| **Kimi** | [platform.moonshot.cn](https://platform.moonshot.cn) | ✅ Yes | `sk-...` | Settings → AI API Keys |
| **Qwen** | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) | ✅ Yes | `sk-...` | Settings → AI API Keys |
| **GIPHY** | [developers.giphy.com](https://developers.giphy.com) | ✅ Yes | Alphanumeric | Settings → Sync & Profiles |

---

*Director Cut v0.1.0 — Built with Tauri, React, TypeScript & SQLite*
*Designed for Mina & Ale's creative production workflow*

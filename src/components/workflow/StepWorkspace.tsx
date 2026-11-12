import { useState, useEffect } from "react";
import PromptPreview from "./PromptPreview";
import ManualPasteMode from "./ManualPasteMode";
import AIGeneratorMode from "./AIGeneratorMode";
import ReviewConsole from "./ReviewConsole";
import BlockedStepView from "./BlockedStepView";
import WorkflowGraph from "./WorkflowGraph";
import { STEPS } from "../../config/steps";
import { QUALITY_CHECKLISTS } from "../../config/quality-checklists";
import { ArtifactVersionPayload } from "../../lib/workflow-engine";
import { PromptTemplatePayload, RenderedPromptResult } from "../../lib/prompt-engine";
import { getDb } from "../../lib/database";
import { readSnapshot } from "../../lib/snapshot-manager";
import { Episode } from "../../types";

interface StepGuidanceItem {
  label: string;
  description: string;
  placeholder: string;
}

function parseDrafts(text: string) {
  if (!text) return [];
  const lines = text.split('\n');
  const sections: { title: string; content: string[] }[] = [];
  let currentSection: { title: string; content: string[] } | null = null;
  
  for (const line of lines) {
    const headingMatch = line.match(/^(?:#{1,3})\s+(.*)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headingMatch[1].trim(),
        content: []
      };
    } else {
      if (currentSection) {
        currentSection.content.push(line);
      } else {
        currentSection = {
          title: "Introduction",
          content: [line]
        };
      }
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections.map(s => ({
    title: s.title,
    text: s.content.join('\n').trim()
  })).filter(s => s.text.length > 5);
}


const STEP_GUIDANCE: Record<number, StepGuidanceItem> = {
  1: {
    label: "Creative Brief / Thesis Directions",
    description: "Write down initial target themes, production notes, angles, or notes for Mina & Ale. This is the foundation.",
    placeholder: "e.g., Focus on Victor Frankenstein's neglect of his creature as a metaphor for parental abandonment."
  },
  2: {
    label: "Creative Angles Research Brief",
    description: "Capture research hints, historical anecdotes, quotes, or thematic analysis pointers to explore.",
    placeholder: "e.g., Contrast Mary Shelley's bio with Percy Shelley's edits. Keep note of the 'year without a summer.'"
  },
  3: {
    label: "Angle Selection Evaluation Criteria",
    description: "Add criteria to evaluate the proposed thesis angles. Audience fit, length constraints, or B-roll availability.",
    placeholder: "e.g., Must fit a 15-minute video. Heavy B-roll potential is a plus."
  },
  4: {
    label: "Narrative Blueprint Scope",
    description: "Define structural outline notes: hook style, 3-act structure requirements, climax focus, or call to action.",
    placeholder: "e.g., Focus hook on the lightning strike. Act 1: The obsession. Act 2: Creation. Act 3: Regret."
  },
  5: {
    label: "Drafting Guidance & Directives",
    description: "Provide stylistic directives for the draft: word count limits, vocabulary rules, or pacing guidelines.",
    placeholder: "e.g., Max 2500 words. Use active verbs. Read with gothic dread."
  },
  6: {
    label: "Critique Focus & Constraints",
    description: "Note specific critique focus areas: dialogue flow check, clarity of thesis, historical accuracy, or engagement drop risks.",
    placeholder: "e.g., Check if Victor's monologue sounds too modern. Cut down the description of the university."
  },
  7: {
    label: "Master Cut Integration Directions",
    description: "Directives for blending script drafts: what to keep from draft A, draft B, or how to resolve contradictions.",
    placeholder: "e.g., Keep the intro from Version 1, but use the dialogue critique improvements from Version 2."
  },
  8: {
    label: "Final Script Polish Notes",
    description: "Final adjustments: spelling, grammar, sound cues, formatting rules, or pronunciation notes.",
    placeholder: "e.g., Double check names of German towns. Add sound cues for thunder transitions."
  },
  9: {
    label: "Visual Layer & Aesthetic Direction",
    description: "Define the visual aesthetic: editing pace, image sources, public domain art styles, archival footage rules, or text overlay designs.",
    placeholder: "e.g., Use Romantic era paintings (Caspar David Friedrich). Fast cuts during Victor's fever dreams."
  },
  10: {
    label: "Voice Narration Plan",
    description: "Add cues for narration pacing, emotional beats, pauses, whispers, or word emphasis for the voice actor or AI narrator.",
    placeholder: "e.g., Deliver the intro with cold clinical distance. Slow down and add a long pause before 'Victor ran.'"
  },
  11: {
    label: "AI Narration Setup",
    description: "Enter configuration parameters, pronunciation guides for names, voice models, or phonetic overrides.",
    placeholder: "e.g., Pronounce 'Shelley' as SHEH-lee. Voice profile: elegant_deep_narrator."
  },
  12: {
    label: "Soundscape & Music Design",
    description: "Specify ambient background music styles, SFX placement (wind, thunder, pen scratching), or mixing balances.",
    placeholder: "e.g., Ambient dark drone music under the monologue. Rain sounds fading in during the Arctic frame story."
  },
  13: {
    label: "Rights & Asset Acquisition",
    description: "Add notes about copyright policies, fair use arguments, licensing requirements, or stock footage search queries.",
    placeholder: "e.g., Check rights for the 1931 movie clips. Limit clips to 4 seconds to fit fair use."
  },
  14: {
    label: "Video Editing & Assembly Guidance",
    description: "Provide timeline compilation guidance, transitions, lower-thirds styling, or rendering settings.",
    placeholder: "e.g., Render in 4K 24fps. Use cross-dissolves for historical transitions, and hard cuts for direct dialogue."
  },
  15: {
    label: "Derivatives & Social Packages",
    description: "Specify ideas for Shorts, Reels, newsletters, community posts, description metadata, tags, or chapter titles.",
    placeholder: "e.g., Create one Short about Mary Shelley's tragic dream. Chapter 1: The Summer of 1816."
  },
  16: {
    label: "Final Quality Assurance Check",
    description: "Note check items for export, thumbnail text options, platform upload settings, metadata, or final validation checks.",
    placeholder: "e.g., Verify audio level is -14 LUFS. Thumbnail option A: 'Victor's Real Sin.'"
  }
};

interface StepWorkspaceProps {
  episodeId?: string | null;
  stepNumber: number;
  stepState: string;
  activeArtifact?: ArtifactVersionPayload | null;
  artifactVersions?: ArtifactVersionPayload[];
  activeTemplate?: PromptTemplatePayload | null;
  renderedPrompt?: RenderedPromptResult | null;
  humanNotes?: string;
  finalThesis?: string;
  narratorMode?: string;
  onVersionSelect?: (versionId: string) => void;
  onSaveTemplate?: (newText: string, scope: 'episode' | 'channel' | 'global') => void;
  onSaveHumanNotes?: (notes: string) => void;
  onAction: (action: 'save_candidate' | 'approve' | 'reject', content?: string) => void;
  onStepChange?: (stepId: number) => void;
  stepStates?: Record<number, string>;
  activeEpisode?: Episode | null;
  onUpdateEpisode?: (fields: any) => Promise<void>;
}

export default function StepWorkspace({ 
  episodeId,
  stepNumber, stepState, activeArtifact, artifactVersions, 
  activeTemplate, renderedPrompt, humanNotes = '', finalThesis = '', narratorMode = '',
  onVersionSelect, onSaveTemplate, onSaveHumanNotes, onAction,
  onStepChange, stepStates = {}, activeEpisode, onUpdateEpisode
}: StepWorkspaceProps) {
  const defaultMode = (stepState === 'awaiting_review' || stepState === 'approved') ? 'review' : 'ai_generator';
  const [viewMode, setViewMode] = useState<'prompt' | 'paste' | 'review' | 'ai_generator' | 'graph'>(defaultMode);
  
  const [localNotes, setLocalNotes] = useState(humanNotes);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const guidance = STEP_GUIDANCE[stepNumber];

  const [draftVersionsText, setDraftVersionsText] = useState<string>("");
  const [activeDraftTab, setActiveDraftTab] = useState<number>(0);
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setViewMode((stepState === 'awaiting_review' || stepState === 'approved') ? 'review' : 'ai_generator');
  }, [stepNumber, stepState]);

  useEffect(() => {
    setLocalNotes(humanNotes);
  }, [humanNotes]);

  useEffect(() => {
    if (stepNumber === 7 && episodeId) {
      loadStep5Drafts();
    } else {
      setDraftVersionsText("");
    }
  }, [stepNumber, episodeId]);

  const loadStep5Drafts = async () => {
    try {
      const db = await getDb();
      const artifacts = await db.select<any[]>(
        `SELECT a.approved_version_id FROM artifacts a 
         WHERE a.episode_id = $1 AND a.artifact_type = 'script_versions' AND a.status = 'approved'`,
        [episodeId]
      );
      if (artifacts.length > 0 && artifacts[0].approved_version_id) {
        const versionId = artifacts[0].approved_version_id;
        const versions = await db.select<any[]>('SELECT local_snapshot_path FROM artifact_versions WHERE id = $1', [versionId]);
        if (versions.length > 0) {
          const content = await readSnapshot(versions[0].local_snapshot_path);
          setDraftVersionsText(content);
        } else {
          setDraftVersionsText("");
        }
      } else {
        setDraftVersionsText("");
      }
    } catch (e) {
      console.error("Failed to load step 5 drafts for step 7 comparison", e);
      setDraftVersionsText("");
    }
  };

  const stepConfig = STEPS.find(s => s.id === stepNumber);

  const handleSave = (content: string) => {
    onAction('save_candidate', content);
    setViewMode('review');
  };

  const handleApprove = () => {
    onAction('approve');
  };

  const handleReject = () => {
    onAction('reject');
  };

  const saveNotes = () => {
    if (onSaveHumanNotes) {
      setIsSavingNotes(true);
      onSaveHumanNotes(localNotes);
      setTimeout(() => setIsSavingNotes(false), 500);
    }
  };

  if (!stepConfig) return null;

  // Show blocked view for steps that can't be worked on
  if (stepState === 'blocked') {
    return <BlockedStepView stepNumber={stepNumber} />;
  }

  const qualityChecklist = QUALITY_CHECKLISTS[stepNumber];

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full">
      {/* Left Panel: Inputs & Dependencies */}
      <div className="w-80 bg-surfaceHighlight/30 border-r border-border p-6 flex flex-col overflow-y-auto shrink-0">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-textMain mb-1">
            {stepConfig.id < 10 ? `0${stepConfig.id}` : stepConfig.id} — {stepConfig.label}
          </h2>
          <p className="text-sm text-textMuted leading-relaxed">{stepConfig.description}</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-surface p-3 rounded border border-border">
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Required Dependencies</h3>
            {stepNumber === 1 ? (
              <p className="text-xs text-textMuted">None. This is the first step.</p>
            ) : (
              <ul className="text-sm space-y-1">
                <li className="flex items-center space-x-2 text-success">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Upstream Step Approved Artifact</span>
                </li>
              </ul>
            )}
          </div>

          <div className="bg-surface p-3 rounded border border-border flex flex-col flex-1">
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex justify-between items-center">
              {guidance?.label || 'Human Creative Inputs'}
              <span className="text-[10px] text-textMuted bg-surfaceHighlight px-1.5 py-0.5 rounded font-normal">Optional</span>
            </h3>
            <p className="text-xs text-textMuted mb-3">
              {guidance?.description || 'Add your editorial decisions, selected angle, tone preferences, or things to avoid here. These will be injected into the prompt.'}
            </p>
            <textarea
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-textMain focus:border-primary outline-none resize-none flex-1 min-h-[200px]"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder={guidance?.placeholder || 'e.g. Use Angle 2, avoid excessive academic tone, focus on the midpoint contradiction.'}
            />
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-textMuted">
                {isSavingNotes ? 'Saving...' : (humanNotes === localNotes && humanNotes ? 'Saved' : '')}
              </span>
              <button 
                onClick={saveNotes}
                disabled={humanNotes === localNotes || isSavingNotes}
                className="bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:hover:bg-primary/20 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              >
                Save Notes
              </button>
            </div>

            {/* Contextual Workspace Step Guidelines */}
            <div className="mt-4 bg-background border border-border/80 p-3 rounded-xl text-[10px] text-textMuted leading-relaxed font-semibold">
              <span className="font-extrabold text-white block uppercase tracking-wider mb-1">Production Tip:</span>
              1. Add your creative ideas & tone notes above.<br />
              2. Save the notes, then click the **AI Generator** tab.<br />
              3. Press **Run Prompt via API** to generate the candidate draft.<br />
              4. Review and click **Approve** to unlock the next production step.
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col bg-background relative border-r border-border overflow-hidden">
        
        {stepNumber >= 9 && stepNumber <= 12 && (
          <div className="bg-info/10 border-b border-info/30 px-6 py-2 flex items-center space-x-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-info"></div>
            <p className="text-xs text-info">
              <span className="font-semibold">Production Plan Step:</span> This step creates a production plan. It does not perform the external production task.
            </p>
          </div>
        )}

        {stepNumber >= 13 && stepNumber <= 16 && (
          <div className="bg-info/10 border-b border-info/30 px-6 py-2 flex items-center space-x-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-info"></div>
            <p className="text-xs text-info">
              <span className="font-semibold">Planning / Checklist Artifact:</span> This step creates a planning or checklist artifact. It does not execute external production or publishing actions.
            </p>
          </div>
        )}

        {/* Creative Compass Banner */}
        {(finalThesis || narratorMode) && (
          <div className="bg-surface/50 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 transition-all duration-300">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">Active Thesis</span>
              </div>
              <p className="text-sm font-semibold text-textMain leading-relaxed truncate hover:text-clip hover:whitespace-normal transition-all" title={finalThesis}>
                {finalThesis || "No active thesis defined. Complete Step 03 or Step 04."}
              </p>
            </div>
            <div className="flex items-center space-x-3 md:border-l md:border-border md:pl-6 shrink-0">
              <div className="bg-surfaceHighlight px-3 py-2 rounded border border-border/50">
                <div className="text-[10px] uppercase font-bold tracking-wider text-textMuted mb-0.5">Narrator Mode</div>
                <p className="text-xs font-semibold text-success">
                  {narratorMode || "Not selected"}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Workspace Mode Tabs */}
        <div className="flex border-b border-border bg-surface px-6 shrink-0 h-12 items-center space-x-1">
          <button 
            className={`px-4 py-3 text-xs uppercase font-extrabold border-b-2 h-full transition-colors ${viewMode === 'graph' ? 'border-primary text-primary font-black' : 'border-transparent text-textMuted hover:text-textMain'}`}
            onClick={() => setViewMode('graph')}
          >
            🗺️ Workflow Map
          </button>
          <button 
            className={`px-4 py-3 text-xs uppercase font-extrabold border-b-2 h-full transition-colors ${viewMode === 'prompt' ? 'border-primary text-primary font-black' : 'border-transparent text-textMuted hover:text-textMain'}`}
            onClick={() => setViewMode('prompt')}
          >
            Prompt Preview
          </button>
          <button 
            className={`px-4 py-3 text-xs uppercase font-extrabold border-b-2 h-full transition-colors ${viewMode === 'ai_generator' ? 'border-primary text-primary font-black' : 'border-transparent text-textMuted hover:text-textMain'}`}
            onClick={() => setViewMode('ai_generator')}
          >
            AI Generator
          </button>
          <button 
            className={`px-4 py-3 text-xs uppercase font-extrabold border-b-2 h-full transition-colors ${viewMode === 'paste' ? 'border-primary text-primary font-black' : 'border-transparent text-textMuted hover:text-textMain'}`}
            onClick={() => setViewMode('paste')}
          >
            {stepNumber === 1 ? 'Import / Paste' : 'Manual Paste'}
          </button>
          <button 
            className={`px-4 py-3 text-xs uppercase font-extrabold border-b-2 h-full transition-colors ${viewMode === 'review' ? 'border-primary text-primary font-black' : 'border-transparent text-textMuted hover:text-textMain'}`}
            onClick={() => setViewMode('review')}
            disabled={stepState === 'blocked' || stepState === 'ready'}
          >
            Review Output
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
          
          <div className="flex-1 overflow-hidden p-6 flex flex-col relative h-full">
            {viewMode === 'graph' && (
              <WorkflowGraph 
                activeStepNumber={stepNumber}
                onStepChange={onStepChange}
                stepStates={stepStates}
              />
            )}
            {viewMode === 'prompt' && (
              <PromptPreview 
                template={activeTemplate}
                rendered={renderedPrompt}
                onSaveTemplate={onSaveTemplate}
                activeEpisode={activeEpisode}
                humanNotes={humanNotes}
                finalThesis={finalThesis}
                narratorMode={narratorMode}
                onUpdateEpisode={onUpdateEpisode}
                onSaveHumanNotes={onSaveHumanNotes}
              />
            )}
            {viewMode === 'ai_generator' && (
              <AIGeneratorMode 
                renderedPrompt={renderedPrompt}
                onSave={handleSave} 
                stepNumber={stepNumber}
              />
            )}
            {viewMode === 'paste' && (
              <ManualPasteMode 
                renderedPrompt={renderedPrompt}
                onSave={handleSave} 
              />
            )}
            {viewMode === 'review' && (
              <ReviewConsole 
                isApproved={stepState === 'approved'} 
                onApprove={handleApprove} 
                onReject={handleReject}
                artifact={activeArtifact}
                versions={artifactVersions}
                onSelectVersion={onVersionSelect}
                onSaveEdit={(editedContent) => handleSave(editedContent)}
                stepNumber={stepNumber}
              />
            )}
          </div>

          {/* Draft Comparison Reference Panel (Step 7 only) */}
          {stepNumber === 7 && draftVersionsText && (
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-surfaceHighlight/20 flex flex-col h-full shrink-0 overflow-hidden">
              {/* Panel Header */}
              <div className="p-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
                <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Step 5 Script Reference</h4>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Drafts</span>
              </div>
              
              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                <p className="text-xs text-textMuted leading-relaxed shrink-0">
                  Select and copy sections from the Analytical, Punchy, or Cinematic drafts below to build your Master Cut script.
                </p>

                {/* Sub-tabs for individual drafts */}
                {(() => {
                  const drafts = parseDrafts(draftVersionsText);
                  if (drafts.length === 0) {
                    return (
                      <div className="bg-surface border border-border/85 rounded-xl p-3 shadow-sm flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-textMuted">Full Draft Text</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(draftVersionsText);
                              alert("Drafts copied to clipboard!");
                            }}
                            className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded font-bold transition-colors"
                          >
                            Copy All
                          </button>
                        </div>
                        <pre className="text-xs text-textMain font-mono whitespace-pre-wrap flex-1 bg-background/50 p-2.5 rounded border border-border/40 select-all leading-relaxed overflow-y-auto">
                          {draftVersionsText}
                        </pre>
                      </div>
                    );
                  }

                  const activeDraft = drafts[activeDraftTab] || drafts[0];

                  return (
                    <div className="flex flex-col flex-1 overflow-hidden">
                      {/* Tabs selector */}
                      <div className="flex border-b border-border bg-surface/50 p-0.5 rounded-lg mb-3 shrink-0">
                        {drafts.map((d, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveDraftTab(index)}
                            className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all truncate ${
                              activeDraftTab === index 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'text-textMuted hover:text-textMain'
                            }`}
                            title={d.title}
                          >
                            {d.title.replace(/Draft\s+[A-C]:?\s*/i, '').replace(/Version\s+[A-C]:?\s*/i, '')}
                          </button>
                        ))}
                      </div>

                      {/* Active Draft Box */}
                      <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-2 shrink-0">
                          <span className="text-[10px] font-bold text-primary uppercase truncate max-w-[200px]" title={activeDraft.title}>
                            {activeDraft.title}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(activeDraft.text);
                              alert(`${activeDraft.title} copied!`);
                            }}
                            className="text-[10px] bg-primary/15 hover:bg-primary/25 text-primary px-2.5 py-1 rounded font-bold transition-colors"
                          >
                            Copy Tab
                          </button>
                        </div>
                        <div className="flex-1 bg-background/60 p-3 rounded-lg border border-border/40 overflow-y-auto text-xs text-textMain leading-relaxed font-mono whitespace-pre-wrap select-all select-text selection:bg-primary/20">
                          {activeDraft.text}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: State & Actions */}
      <div className="w-72 bg-surfaceHighlight/30 flex flex-col p-4 shrink-0">
        <h2 className="text-lg font-semibold mb-4 text-textMain">Status</h2>
        
        <div className="bg-surface p-3 rounded border border-border mb-4">
          <div className="flex items-center space-x-2 mb-2">
            {stepState === 'ready' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
            {stepState === 'awaiting_review' && <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>}
            {stepState === 'approved' && <div className="w-2 h-2 rounded-full bg-success"></div>}
            
            <span className={`text-sm font-medium capitalize ${
              stepState === 'ready' ? 'text-primary' : 
              stepState === 'awaiting_review' ? 'text-warning' : 
              'text-success'
            }`}>
              {stepState.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-textMuted">
            {stepState === 'ready' && 'Ready for generation or manual paste. Check the prompt preview.'}
            {stepState === 'awaiting_review' && 'Candidate generated. Human review required to unlock downstream steps.'}
            {stepState === 'approved' && 'This step is approved. Downstream steps are unlocked.'}
          </p>
        </div>

        {/* Quality Checklist */}
        {qualityChecklist && qualityChecklist.length > 0 && (
          <div className="bg-surface p-3 rounded border border-border mb-4">
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Quality Checklist</h3>
            <div className="space-y-2">
              {qualityChecklist.map(item => {
                const key = `${stepNumber}_${item.id}`;
                return (
                  <label key={item.id} className="flex items-start space-x-2 text-xs text-textMain cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 accent-primary" 
                      checked={!!checklistStates[key]}
                      onChange={(e) => {
                        setChecklistStates(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }));
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-textMuted mt-2 italic">Informational — review these before approving.</p>
          </div>
        )}

        <div className="space-y-2 mt-auto">
          {stepState === 'awaiting_review' && (
            <>
              <button onClick={handleApprove} className="w-full bg-success text-white py-2 rounded text-sm font-medium hover:bg-success/90 transition-colors">
                Approve Version
              </button>
              <button onClick={handleReject} className="w-full bg-surface border border-border text-danger py-2 rounded text-sm font-medium hover:bg-danger/10 transition-colors">
                Reject & Regenerate
              </button>
            </>
          )}
          {stepState === 'approved' && (
            <button disabled className="w-full bg-surface border border-border text-textMuted py-2 rounded text-sm font-medium cursor-not-allowed">
              Already Approved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

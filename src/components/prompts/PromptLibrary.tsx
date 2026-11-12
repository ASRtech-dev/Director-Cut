import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, FileText, AlertCircle, Copy, Check, Edit, Save, X, 
  Tv, Film, ChevronRight, Sparkles, Plus, Database, Search 
} from "lucide-react";
import { getDb } from "../../lib/database";
import { saveNewTemplateVersion, renderPrompt } from "../../lib/prompt-engine";

interface StepDefinition {
  id: string;
  stepNumber: number;
  stepKey: string;
  title: string;
  shortLabel: string;
  phase: string;
  description: string;
}

interface Channel {
  id: string;
  name: string;
}

interface Episode {
  id: string;
  episodeCode: string;
  title: string;
  channelId: string;
}

interface ActiveTemplateDetails {
  templateId: string;
  title: string;
  source: string;
  scope: 'global' | 'channel' | 'episode';
  versionId: string | null;
  versionNumber: number;
  rawText: string;
  versionCount: number;
  isOverride: boolean;
}

export default function PromptLibrary() {
  const [steps, setSteps] = useState<StepDefinition[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<StepDefinition | null>(null);
  const [stepScopes, setStepScopes] = useState<Record<string, 'global' | 'channel' | 'episode'>>({});
  
  const [activeTemplate, setActiveTemplate] = useState<ActiveTemplateDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  
  // Edit template states
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveScope, setSaveScope] = useState<'global' | 'channel' | 'episode'>('global');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderedContainerRef = useRef<HTMLDivElement>(null);

  // Render states for the active episode (to match step workspace behavior)
  const [renderedPrompt, setRenderedPrompt] = useState<any>(null);
  const [unresolvedPlaceholders, setUnresolvedPlaceholders] = useState<string[]>([]);
  const [activeEpisodeData, setActiveEpisodeData] = useState<any>(null);
  const [humanNotesValue, setHumanNotesValue] = useState("");
  const [finalThesisValue, setFinalThesisValue] = useState("");
  const [narratorModeValue, setNarratorModeValue] = useState("");

  // Highlight / Inline variable editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldEditValue, setFieldEditValue] = useState("");
  const [isSavingField, setIsSavingField] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [inlineEditingField, setInlineEditingField] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");

  // Variable assistant items
  const variableGroups = [
    {
      title: "Episode Fields",
      icon: <Database className="w-3.5 h-3.5 text-primary" />,
      items: [
        {
          name: "EPISODE_TOPIC",
          label: "Episode Topic",
          description: "Theme or focus of this episode",
          value: activeEpisodeData?.topic || "Not set",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "PRIMARY_WORK",
          label: "Primary Subject",
          description: "Primary sujeto/book/film subject or text",
          value: activeEpisodeData?.primary_work || "N/A",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "DESIRED_TONE",
          label: "Desired Tone",
          description: "Channel style or aesthetic tone",
          value: activeEpisodeData?.desired_tone || "Intelligent",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "TARGET_AUDIENCE",
          label: "Target Audience",
          description: "Demographics or target audience",
          value: activeEpisodeData?.target_audience || "General audience",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "LANGUAGE_REGION",
          label: "Language & Region",
          description: "Language code and target region",
          value: activeEpisodeData ? `${activeEpisodeData.target_language || 'EN'}-${activeEpisodeData.target_region || 'US'}` : "EN-US",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: false
        },
        {
          name: "INITIAL_NOTES",
          label: "Initial / Guidance Notes",
          description: "Your human notes for this step",
          value: humanNotesValue || "No notes entered yet",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        }
      ]
    },
    {
      title: "Upstream Step Outputs",
      icon: <FileText className="w-3.5 h-3.5 text-success" />,
      items: [
        {
          name: "RESEARCH_NOTES",
          label: "Step 1 Research Notes",
          description: "Mina/Ale's research notes from Step 1",
          value: "Loaded from Step 1 human notes in DB",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "RESEARCH_BRIEF",
          label: "Step 1 Research Brief",
          description: "Approved research brief dossier",
          value: "Will inject approved Step 01 artifact",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "FINAL_THESIS",
          label: "Step 3 Final Thesis",
          description: "Selected evaluation creative thesis",
          value: finalThesisValue || "No approved thesis yet",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "NARRATOR_MODE",
          label: "Step 10 Narrator Mode",
          description: "The approved voice narration style",
          value: narratorModeValue || "No approved narrator mode yet",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "SCRIPT_BLUEPRINT",
          label: "Step 4 Script Outline",
          description: "Approved 3-act narrative blueprint",
          value: "Will inject approved Step 04 blueprint",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "SCRIPT_VERSIONS",
          label: "Step 5 Script Drafts",
          description: "Multi-agent script candidate drafts",
          value: "Will inject approved Step 05 drafts",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "MASTER_CUT_SCRIPT",
          label: "Step 7 Master Cut Script",
          description: "Approved complete compiled script",
          value: "Will inject approved Step 07 script",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "FINAL_POLISHED_SCRIPT",
          label: "Step 8 Polished Script",
          description: "Final grammar-checked voice script",
          value: "Will inject approved Step 08 script",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        }
      ]
    }
  ];

  useEffect(() => {
    initLibrary();
  }, []);

  useEffect(() => {
    if (steps.length > 0) {
      loadStepScopes(selectedChannelId, selectedEpisodeId);
      if (selectedStep) {
        loadTemplateDetails(selectedStep.id, selectedChannelId, selectedEpisodeId);
      }
    }
  }, [selectedChannelId, selectedEpisodeId, steps]);

  const initLibrary = async () => {
    try {
      setIsLoading(true);
      const db = await getDb();

      // Load steps
      const stepRows = await db.select<any[]>(
        'SELECT id, step_number, step_key, title, short_label, phase, description FROM workflow_step_definitions ORDER BY step_number ASC'
      );
      const mappedSteps = stepRows.map(r => ({
        id: r.id,
        stepNumber: r.step_number,
        stepKey: r.step_key,
        title: r.title,
        shortLabel: r.short_label,
        phase: r.phase,
        description: r.description || ''
      }));
      setSteps(mappedSteps);

      // Load channels
      const channelRows = await db.select<any[]>(
        'SELECT id, name FROM channels ORDER BY name ASC'
      );
      setChannels(channelRows.map(r => ({ id: r.id, name: r.name })));

      // Load episodes
      const epRows = await db.select<any[]>(
        'SELECT id, episode_code, title, channel_id FROM episodes ORDER BY created_at DESC'
      );
      const mappedEpisodes = epRows.map(r => ({
        id: r.id,
        episodeCode: r.episode_code,
        title: r.title,
        channelId: r.channel_id
      }));
      setEpisodes(mappedEpisodes);

      // Default select the first step if available
      if (mappedSteps.length > 0) {
        setSelectedStep(mappedSteps[0]);
      }

      // Automatically select the most recent episode if available
      if (mappedEpisodes.length > 0) {
        const mostRecent = mappedEpisodes[0];
        setSelectedChannelId(mostRecent.channelId);
        setSelectedEpisodeId(mostRecent.id);
      }
    } catch (err) {
      console.error("Failed to initialize Prompt Library:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStepScopes = async (chanId: string | null, epId: string | null) => {
    try {
      const db = await getDb();
      let query = `
        SELECT step_definition_id, channel_id, episode_id
        FROM prompt_templates
        WHERE is_active = 1
          AND (
            (channel_id IS NULL AND episode_id IS NULL)
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (chanId) {
        query += ` OR (channel_id = $${paramIndex} AND episode_id IS NULL)`;
        params.push(chanId);
        paramIndex++;
      }
      if (epId) {
        query += ` OR (episode_id = $${paramIndex})`;
        params.push(epId);
        paramIndex++;
      }
      query += ` )`;

      const templates = await db.select<any[]>(query, params);
      
      const scopeMap: Record<string, 'global' | 'channel' | 'episode'> = {};
      for (const t of templates) {
        const stepId = t.step_definition_id;
        let scope: 'global' | 'channel' | 'episode' = 'global';
        if (t.episode_id) {
          scope = 'episode';
        } else if (t.channel_id) {
          scope = 'channel';
        }
        
        const current = scopeMap[stepId];
        if (!current) {
          scopeMap[stepId] = scope;
        } else if (current === 'global' && (scope === 'channel' || scope === 'episode')) {
          scopeMap[stepId] = scope;
        } else if (current === 'channel' && scope === 'episode') {
          scopeMap[stepId] = scope;
        }
      }
      setStepScopes(scopeMap);
    } catch (err) {
      console.error("Failed to load step scopes:", err);
    }
  };

  const loadEpisodeData = async (epId: string, stepNum: number, rawText: string) => {
    try {
      const db = await getDb();
      
      // Load episode fields
      const epRows = await db.select<any[]>('SELECT * FROM episodes WHERE id = $1', [epId]);
      if (epRows.length > 0) {
        setActiveEpisodeData(epRows[0]);
      } else {
        setActiveEpisodeData(null);
      }

      // Load step run ID & notes
      const runRows = await db.select<any[]>(
        'SELECT id, note_text FROM workflow_step_runs WHERE episode_id = $1 AND step_number = $2',
        [epId, stepNum]
      );
      const stepRunId = runRows[0]?.id;
      setHumanNotesValue(runRows[0]?.note_text || "");

      // Load final thesis
      const thesisRows = await db.select<any[]>(
        'SELECT value_text FROM episode_variables WHERE episode_id = $1 AND variable_key = $2',
        [epId, 'final_thesis']
      );
      setFinalThesisValue(thesisRows[0]?.value_text || "");

      // Load narrator mode
      const narratorRows = await db.select<any[]>(
        'SELECT value_text FROM episode_variables WHERE episode_id = $1 AND variable_key = $2',
        [epId, 'narrator_mode']
      );
      setNarratorModeValue(narratorRows[0]?.value_text || "");

      // Call renderPrompt if we have rawText and a valid stepRunId
      if (rawText && stepRunId) {
        const renderRes = await renderPrompt(epId, stepRunId, rawText);
        setRenderedPrompt(renderRes);
        setUnresolvedPlaceholders(renderRes.unresolvedPlaceholders);
      } else {
        setRenderedPrompt(null);
        setUnresolvedPlaceholders([]);
      }
    } catch (err) {
      console.error("Failed to load episode render data:", err);
      setRenderedPrompt(null);
      setUnresolvedPlaceholders([]);
    }
  };

  const loadTemplateDetails = async (stepId: string, chanId: string | null, epId: string | null) => {
    setIsTemplateLoading(true);
    setSaveError(null);
    try {
      const db = await getDb();
      let foundTemplate: any = null;
      let activeScope: 'global' | 'channel' | 'episode' = 'global';

      // 1. Check Episode-specific
      if (epId) {
        const rows = await db.select<any[]>(
          'SELECT id, title, source_doc_id FROM prompt_templates WHERE step_definition_id = $1 AND episode_id = $2 AND is_active = 1',
          [stepId, epId]
        );
        if (rows.length > 0) {
          foundTemplate = rows[0];
          activeScope = 'episode';
        }
      }

      // 2. Check Channel-specific
      if (!foundTemplate && chanId) {
        const rows = await db.select<any[]>(
          'SELECT id, title, source_doc_id FROM prompt_templates WHERE step_definition_id = $1 AND channel_id = $2 AND episode_id IS NULL AND is_active = 1',
          [stepId, chanId]
        );
        if (rows.length > 0) {
          foundTemplate = rows[0];
          activeScope = 'channel';
        }
      }

      // 3. Fallback to Global
      if (!foundTemplate) {
        const rows = await db.select<any[]>(
          'SELECT id, title, source_doc_id FROM prompt_templates WHERE step_definition_id = $1 AND channel_id IS NULL AND episode_id IS NULL AND is_active = 1',
          [stepId]
        );
        if (rows.length > 0) {
          foundTemplate = rows[0];
          activeScope = 'global';
        }
      }

      if (foundTemplate) {
        const versions = await db.select<any[]>(
          'SELECT id, version_number, raw_text FROM prompt_template_versions WHERE prompt_template_id = $1 ORDER BY version_number DESC LIMIT 1',
          [foundTemplate.id]
        );
        
        const counts = await db.select<any[]>(
          'SELECT COUNT(id) as cnt FROM prompt_template_versions WHERE prompt_template_id = $1',
          [foundTemplate.id]
        );

        const details: ActiveTemplateDetails = {
          templateId: foundTemplate.id,
          title: foundTemplate.title,
          source: foundTemplate.source_doc_id || 'unknown',
          scope: activeScope,
          versionId: versions[0]?.id || null,
          versionNumber: versions[0]?.version_number || 0,
          rawText: versions[0]?.raw_text || '',
          versionCount: counts[0]?.cnt || 0,
          isOverride: activeScope !== 'global'
        };

        setActiveTemplate(details);
        setEditContent(details.rawText);
        setSaveScope(activeScope); // default target to current active scope

        const stepObj = steps.find(s => s.id === stepId) || selectedStep;
        const stepNum = stepObj?.stepNumber || 1;

        if (epId) {
          await loadEpisodeData(epId, stepNum, details.rawText);
        } else {
          setRenderedPrompt(null);
          setUnresolvedPlaceholders([]);
          setActiveEpisodeData(null);
          setHumanNotesValue("");
          setFinalThesisValue("");
          setNarratorModeValue("");
        }
      } else {
        setActiveTemplate(null);
        setEditContent("");
        setSaveScope('global');
        setRenderedPrompt(null);
        setUnresolvedPlaceholders([]);
      }
    } catch (err) {
      console.error("Failed to load template details:", err);
      setActiveTemplate(null);
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const handleSelectStep = (step: StepDefinition) => {
    setSelectedStep(step);
    setIsEditing(false);
    loadTemplateDetails(step.id, selectedChannelId, selectedEpisodeId);
  };

  const handleCopy = () => {
    const textToCopy = selectedEpisodeId && renderedPrompt ? renderedPrompt.renderedText : activeTemplate?.rawText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsertVariable = (varName: string) => {
    if (!isEditing || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const insertedText = `[${varName}]`;
    const newContent = before + insertedText + after;
    setEditContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Card click triggers either:
  // - Cursor navigation/insertion when editing the template
  // - Pulse scroll/highlight when viewing the rendered prompt
  const handleCardClick = (placeholder: string) => {
    if (isEditing) {
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const text = editContent;
      const tag = `[${placeholder}]`;
      const index = text.indexOf(tag);
      
      if (index !== -1) {
        textarea.focus();
        textarea.setSelectionRange(index, index + tag.length);
        
        const linesBefore = text.substring(0, index).split('\n');
        const lineCount = linesBefore.length;
        const totalLines = text.split('\n').length;
        
        const scrollHeight = textarea.scrollHeight;
        const clientHeight = textarea.clientHeight;
        if (scrollHeight > clientHeight) {
          const linePercent = lineCount / totalLines;
          textarea.scrollTop = Math.max(0, (linePercent * scrollHeight) - (clientHeight / 2));
        }
      } else {
        handleInsertVariable(placeholder);
      }
    } else if (selectedEpisodeId) {
      // Highlight in rendered text view mode
      const elements = document.getElementsByClassName(`var-ref-${placeholder}`);
      if (elements.length > 0) {
        elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedField(placeholder);
        setTimeout(() => {
          setHighlightedField(null);
        }, 2000);
      }
    }
  };

  const saveFieldValue = async (fieldName: string, value: string) => {
    if (!selectedEpisodeId || !selectedStep) return;
    const db = await getDb();
    
    if (fieldName === "INITIAL_NOTES") {
      await db.execute(
        'UPDATE workflow_step_runs SET note_text = $1, updated_at = $2 WHERE episode_id = $3 AND step_number = $4',
        [value, new Date().toISOString(), selectedEpisodeId, selectedStep.stepNumber]
      );
    } else {
      let columnName = "";
      if (fieldName === "EPISODE_TOPIC") columnName = "topic";
      else if (fieldName === "PRIMARY_WORK") columnName = "primary_work";
      else if (fieldName === "DESIRED_TONE") columnName = "desired_tone";
      else if (fieldName === "TARGET_AUDIENCE") columnName = "target_audience";

      if (columnName) {
        await db.execute(
          `UPDATE episodes SET ${columnName} = $1, updated_at = $2 WHERE id = $3`,
          [value, new Date().toISOString(), selectedEpisodeId]
        );
      }
    }
  };

  const handleSaveField = async (fieldName: string) => {
    if (!selectedEpisodeId || !selectedStep || !activeTemplate) return;
    setIsSavingField(true);
    try {
      await saveFieldValue(fieldName, fieldEditValue);
      setEditingField(null);
      await loadEpisodeData(selectedEpisodeId, selectedStep.stepNumber, activeTemplate.rawText);
    } catch (err) {
      console.error("Failed to save field:", err);
    } finally {
      setIsSavingField(false);
    }
  };

  const handleSaveInlineField = async (fieldName: string) => {
    if (!selectedEpisodeId || !selectedStep || !activeTemplate) return;
    try {
      await saveFieldValue(fieldName, inlineEditValue);
      setInlineEditingField(null);
      await loadEpisodeData(selectedEpisodeId, selectedStep.stepNumber, activeTemplate.rawText);
    } catch (err) {
      console.error("Failed to save inline field:", err);
    }
  };

  const isFieldEditable = (name?: string) => {
    if (!name) return false;
    return ['EPISODE_TOPIC', 'PRIMARY_WORK', 'DESIRED_TONE', 'TARGET_AUDIENCE', 'INITIAL_NOTES'].includes(name);
  };

  const handleSave = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveNewTemplateVersion(
        selectedStep.id,
        editContent,
        saveScope === 'episode' ? selectedEpisodeId : null,
        saveScope,
        saveScope === 'channel' ? selectedChannelId : null
      );
      
      setIsEditing(false);
      await loadStepScopes(selectedChannelId, selectedEpisodeId);
      await loadTemplateDetails(selectedStep.id, selectedChannelId, selectedEpisodeId);
    } catch (err: any) {
      console.error("Failed to save template version:", err);
      setSaveError(err?.message || "An error occurred while saving the prompt template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (activeTemplate) {
      setEditContent(activeTemplate.rawText);
      setSaveScope(activeTemplate.scope);
    }
    setIsEditing(false);
    setSaveError(null);
  };

  const handleChannelChange = (val: string) => {
    setIsEditing(false);
    if (val === 'global') {
      setSelectedChannelId(null);
      setSelectedEpisodeId(null);
    } else {
      setSelectedChannelId(val);
      const channelEps = episodes.filter(e => e.channelId === val);
      if (channelEps.length > 0) {
        setSelectedEpisodeId(channelEps[0].id);
      } else {
        setSelectedEpisodeId(null);
      }
    }
  };

  const handleEpisodeChange = (val: string) => {
    setIsEditing(false);
    if (val === 'none') {
      setSelectedEpisodeId(null);
    } else {
      setSelectedEpisodeId(val);
    }
  };

  const filteredEpisodes = episodes.filter(e => e.channelId === selectedChannelId);
  const selectedChannelObj = channels.find(c => c.id === selectedChannelId);
  const selectedEpisodeObj = episodes.find(e => e.id === selectedEpisodeId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-textMuted font-medium">Loading Prompt Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-background h-full w-full">
      {/* Left Pane: 16 Steps Navigation */}
      <div className="w-96 border-r border-border flex flex-col h-full bg-surfaceHighlight/15 backdrop-blur shrink-0">
        <div className="p-4 border-b border-border bg-surface/50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-textMain">Prompt Library</h2>
          </div>
          <p className="text-xs text-textMuted mt-1">Review and override prompt templates for the 16-step production workflow</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {steps.map(s => {
            const isActive = selectedStep?.id === s.id;
            const scope = stepScopes[s.id] || 'global';
            const isMvp = s.stepNumber <= 5;
            
            let scopeBadge = (
              <span className="text-[9px] font-bold text-textMuted bg-surface border border-border px-1.5 py-0.5 rounded select-none uppercase">
                Global
              </span>
            );
            if (scope === 'episode') {
              scopeBadge = (
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded select-none uppercase">
                  Episode Custom
                </span>
              );
            } else if (scope === 'channel') {
              scopeBadge = (
                <span className="text-[9px] font-bold text-secondary bg-secondary/10 border border-secondary/20 px-1.5 py-0.5 rounded select-none uppercase">
                  Channel Custom
                </span>
              );
            }

            return (
              <button
                key={s.id}
                onClick={() => handleSelectStep(s)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col ${
                  isActive 
                    ? 'bg-primary/5 border-primary/45 shadow-sm' 
                    : 'bg-surface/30 border-border/40 hover:bg-surfaceHighlight/40 hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded shrink-0 ${
                      isActive ? 'bg-primary text-white' : 'bg-surfaceHighlight text-textMuted border border-border/50'
                    }`}>
                      {s.stepNumber.toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-textMain truncate leading-tight">
                      {s.title.replace(/ Template$/, '')}
                    </span>
                  </div>
                  {scopeBadge}
                </div>
                
                <p className="text-[11px] text-textMuted mt-1.5 line-clamp-1">
                  {s.description}
                </p>

                <div className="flex items-center space-x-2 mt-2 select-none">
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isMvp ? 'bg-success/10 text-success border border-success/20' : 'bg-textMuted/15 text-textMuted border border-border/40'
                  }`}>
                    {isMvp ? 'Active MVP' : 'Post-MVP'}
                  </span>
                  <span className="text-[10px] text-textMuted/70">• Phase: {s.phase}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Context Selectors + Template Editor/Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        {/* Context Configuration Bar */}
        <div className="p-4 border-b border-border bg-surface/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider select-none">Active Context Scope</h3>
            <p className="text-[11px] text-textMuted leading-tight mt-0.5">Filter template versions by channel or episode override layers</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Channel context selector */}
            <div className="flex items-center space-x-2 bg-surface border border-border/80 rounded-xl px-3 py-1.5 hover:border-primary/50 transition-colors">
              <Tv className="w-3.5 h-3.5 text-textMuted shrink-0" />
              <select 
                value={selectedChannelId || 'global'}
                onChange={(e) => handleChannelChange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 text-textMain shrink-0"
              >
                <option value="global">Global Master (All Channels)</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Episode context selector */}
            <div className={`flex items-center space-x-2 bg-surface border border-border/80 rounded-xl px-3 py-1.5 hover:border-primary/50 transition-colors ${
              !selectedChannelId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}>
              <Film className="w-3.5 h-3.5 text-textMuted shrink-0" />
              <select 
                value={selectedEpisodeId || 'none'}
                onChange={(e) => handleEpisodeChange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 text-textMain shrink-0"
                disabled={!selectedChannelId}
              >
                <option value="none">No Episode Override (View Channel/Global)</option>
                {filteredEpisodes.map(e => (
                  <option key={e.id} value={e.id}>[{e.episodeCode}] {e.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Step Workspace */}
        {selectedStep ? (
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left/Middle Part: Editor / Rendered prompt view */}
            <div className="flex-1 flex flex-col p-6 min-w-0 h-full overflow-hidden">
              
              {/* Header and Scope Banner info */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h1 className="text-xl font-bold text-textMain flex items-center space-x-2">
                    <span className="text-primary font-mono text-lg">Step {selectedStep.stepNumber.toString().padStart(2, '0')}</span>
                    <ChevronRight className="w-4 h-4 text-textMuted" />
                    <span>{selectedStep.title.replace(/ Template$/, '')}</span>
                  </h1>
                  
                  {activeTemplate && !isTemplateLoading && (
                    <p className="text-xs text-textMuted mt-1">
                      Showing Version: <span className="font-semibold text-textMain">v{activeTemplate.versionNumber}</span> ({activeTemplate.versionCount} total) • 
                      Scope: <span className={`font-semibold capitalize ${
                        activeTemplate.scope === 'episode' ? 'text-primary' : activeTemplate.scope === 'channel' ? 'text-secondary' : 'text-textMuted'
                      }`}>{activeTemplate.scope === 'global' ? 'Global Master' : `${activeTemplate.scope} Override`}</span>
                      {selectedEpisodeId && " • Showing Rendered Output"}
                    </p>
                  )}
                </div>

                {/* Edit Actions */}
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleCopy}
                        disabled={!activeTemplate}
                        className="flex items-center space-x-2 bg-surface hover:bg-surfaceHighlight border border-border/80 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? "Copied!" : "Copy Prompt"}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setSaveError(null);
                        }}
                        disabled={!activeTemplate}
                        className="flex items-center space-x-2 bg-primary text-white hover:bg-primaryHover px-4 py-2 rounded-xl text-xs font-bold shadow transition-all disabled:opacity-40 shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Template</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 bg-surfaceHighlight/30 p-1.5 rounded-xl border border-border">
                      <span className="text-[11px] font-bold text-textMuted pl-1">Save target:</span>
                      <select
                        value={saveScope}
                        onChange={(e) => setSaveScope(e.target.value as any)}
                        className="bg-surface border border-border rounded-lg text-xs font-bold px-2.5 py-1 focus:border-primary outline-none text-textMain cursor-pointer shrink-0"
                      >
                        <option value="global">Global Master (All Channels)</option>
                        {selectedChannelId && (
                          <option value="channel">Channel Override ({selectedChannelObj?.name})</option>
                        )}
                        {selectedEpisodeId && (
                          <option value="episode">Episode Override ({selectedEpisodeObj?.episodeCode})</option>
                        )}
                      </select>
                      
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center space-x-1 bg-surface border border-border hover:bg-surfaceHighlight px-2.5 py-1 rounded-lg text-xs font-bold text-textMain transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-1 bg-success hover:bg-success/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow transition-all shrink-0"
                      >
                        {isSaving ? (
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save Version</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scope Fallback Notice Banner */}
              {!isEditing && activeTemplate && activeTemplate.scope !== (selectedEpisodeId ? 'episode' : selectedChannelId ? 'channel' : 'global') && (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-3.5 mb-4 flex items-start space-x-3 shrink-0">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning/90 leading-normal">
                    {selectedEpisodeId ? (
                      <>
                        Currently showing the <span className="font-semibold">{activeTemplate.scope === 'global' ? 'Global Master' : 'Channel Override'}</span> template. No specific override exists for episode <span className="font-semibold">{selectedEpisodeObj?.episodeCode}</span> yet. Clicking <strong>Edit Template</strong> and saving to "Episode Override" will create a customized template for this episode.
                      </>
                    ) : (
                      <>
                        Currently showing the <span className="font-semibold">Global Master</span> template. No specific override exists for channel <span className="font-semibold">{selectedChannelObj?.name}</span> yet. Clicking <strong>Edit Template</strong> and saving to "Channel Override" will create a customized template for this channel.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Unresolved Upstream Dependencies Warning */}
              {!isEditing && selectedEpisodeId && unresolvedPlaceholders.length > 0 && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-4 flex items-start space-x-3 shrink-0 select-none">
                  <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-danger mb-1">Unresolved Dependencies</h4>
                    <p className="text-xs text-danger/80 mb-2">
                      The following placeholders could not be resolved. This usually means an upstream step is not completed, or human creative inputs are required.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unresolvedPlaceholders.map(p => (
                        <span key={p} className="px-2.5 py-1 bg-danger/20 text-danger rounded text-xs font-mono border border-danger/30 font-bold">
                          {p === 'HUMAN_NOTES_REQUIRED' ? 'Human Creative Inputs Required' : `[${p}]`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Error Display */}
              {saveError && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-3.5 mb-4 flex items-center space-x-2 text-danger text-xs shrink-0 select-none">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">{saveError}</span>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 bg-surface border border-border/80 rounded-2xl overflow-hidden flex min-h-0 shadow-sm relative">
                {isTemplateLoading ? (
                  <div className="absolute inset-0 bg-surface/75 backdrop-blur flex items-center justify-center z-10">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[11px] text-textMuted font-medium">Loading Template Content...</p>
                    </div>
                  </div>
                ) : null}

                {/* Editor Content Area */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                  {isEditing ? (
                    <textarea
                      ref={textareaRef}
                      id="prompt-editor-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full p-6 bg-background font-mono text-sm text-textMain outline-none resize-none leading-relaxed selection:bg-primary/25 border-none"
                      placeholder="Enter prompt template here... Use brackets to reference variables, e.g. [EPISODE_TOPIC]"
                    />
                  ) : (
                    <div 
                      ref={renderedContainerRef}
                      className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap text-textMain bg-background select-text shadow-inner"
                    >
                      {selectedEpisodeId && renderedPrompt?.segments ? (
                        renderedPrompt.segments.map((seg: any, idx: number) => {
                          if (seg.type === 'variable') {
                            const isEditable = isFieldEditable(seg.name);
                            const isInlineEditing = inlineEditingField === seg.name;
                            
                            return (
                              <span
                                key={idx}
                                className={`var-ref-${seg.name} inline-block mx-0.5 px-1 py-0.5 rounded font-bold cursor-pointer transition-all duration-300 ${
                                  highlightedField === seg.name 
                                    ? 'bg-primary/30 ring-2 ring-primary border-primary scale-105' 
                                    : isEditable 
                                      ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' 
                                      : 'bg-success/15 text-success border border-success/20 hover:bg-success/25'
                                }`}
                                onClick={(e) => {
                                  if (isEditable) {
                                    e.stopPropagation();
                                    setInlineEditingField(seg.name || null);
                                    setInlineEditValue(seg.value || '');
                                  }
                                }}
                                title={isEditable ? `Click to edit ${seg.name}` : `${seg.name} (read-only)`}
                              >
                                {isInlineEditing ? (
                                  <span 
                                    onClick={(e) => e.stopPropagation()} 
                                    className="inline-flex items-center space-x-1.5 bg-background border border-primary rounded p-1"
                                  >
                                    {seg.name === 'EPISODE_TOPIC' || seg.name === 'INITIAL_NOTES' ? (
                                      <textarea
                                        value={inlineEditValue}
                                        onChange={(e) => setInlineEditValue(e.target.value)}
                                        className="bg-background text-textMain text-xs font-sans p-1 focus:ring-0 outline-none resize-none leading-normal min-w-[200px]"
                                        rows={3}
                                        autoFocus
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={inlineEditValue}
                                        onChange={(e) => setInlineEditValue(e.target.value)}
                                        className="bg-background text-textMain text-xs font-sans p-1 focus:ring-0 outline-none min-w-[150px]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveInlineField(seg.name!);
                                          else if (e.key === 'Escape') setInlineEditingField(null);
                                        }}
                                      />
                                    )}
                                    <div className="flex flex-col space-y-1 shrink-0">
                                      <button 
                                        onClick={() => handleSaveInlineField(seg.name!)}
                                        className="p-1 bg-success hover:bg-success/90 rounded text-white font-bold"
                                      >
                                        <Check className="w-3 h-3 text-white" />
                                      </button>
                                      <button 
                                        onClick={() => setInlineEditingField(null)}
                                        className="p-1 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded text-textMuted font-bold"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </span>
                                ) : (
                                  seg.value || `[${seg.name}]`
                                )}
                              </span>
                            );
                          }
                          return <span key={idx}>{seg.value}</span>;
                        })
                      ) : (
                        activeTemplate?.rawText || (
                          <div className="flex flex-col items-center justify-center text-textMuted py-20">
                            <AlertCircle className="w-10 h-10 opacity-30 mb-2" />
                            <p>No template text found in the database.</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Variable Assistant Panel */}
                <div className="w-80 border-l border-border bg-surfaceHighlight/10 flex flex-col h-full shrink-0 overflow-hidden select-none">
                  <div className="p-4 border-b border-border bg-surface shrink-0 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-bold text-textMain uppercase tracking-wider">Variable Assistant</h3>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-surfaceHighlight/30 text-[10px] text-textMuted leading-relaxed border-b border-border shrink-0">
                    {isEditing ? (
                      <p>Click any card to select/navigate to its placeholder tag in the raw editor.</p>
                    ) : selectedEpisodeId ? (
                      <p>Click any card to scroll to and highlight its occurrences in the rendered text. Click the value field to edit.</p>
                    ) : (
                      <p>Select an episode context above to load current variable values and enable editing.</p>
                    )}
                    
                    <div className="mt-2.5 relative">
                      <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search variables..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background border border-border/80 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-textMain focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {variableGroups.map((group) => {
                      const filteredItems = group.items.filter(item => 
                        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      if (filteredItems.length === 0) return null;

                      return (
                        <div key={group.title} className="space-y-2">
                          <div className="flex items-center space-x-1.5 text-[9px] font-bold text-textMuted uppercase tracking-wider">
                            {group.icon}
                            <span>{group.title}</span>
                          </div>

                          <div className="space-y-2">
                            {filteredItems.map((item) => {
                              const isFieldEditing = editingField === item.name;
                              const hasContext = !!selectedEpisodeId;

                              return (
                                <div
                                  key={item.name}
                                  onClick={() => handleCardClick(item.name)}
                                  className={`bg-surface border border-border/60 rounded-lg p-2.5 transition-all flex flex-col items-start select-none relative group ${
                                    isEditing 
                                      ? 'hover:border-primary/50 cursor-pointer' 
                                      : hasContext 
                                        ? 'hover:border-primary/50 cursor-pointer' 
                                        : 'opacity-75 cursor-default'
                                  }`}
                                  title={isEditing ? `Insert/Select [${item.name}]` : hasContext ? `Highlight [${item.name}] in prompt` : "Select episode to load values"}
                                >
                                  {isEditing && (
                                    <Plus className="w-3 h-3 absolute top-2.5 right-2.5 text-textMuted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                                  )}

                                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-bold border ${item.badgeClass} mb-1`}>
                                    {item.name}
                                  </span>
                                  
                                  <span className="text-[10px] font-bold text-textMain leading-tight">{item.label}</span>
                                  <span className="text-[9px] text-textMuted leading-normal mt-0.5">{item.description}</span>
                                  
                                  {/* Current Value Preview / Editor on Card */}
                                  {hasContext && (
                                    isFieldEditing ? (
                                      <div className="w-full mt-2 pt-2 border-t border-border/40 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-[8px] text-primary uppercase font-extrabold tracking-wider mb-1">Editing Value:</span>
                                        {item.name === 'EPISODE_TOPIC' || item.name === 'INITIAL_NOTES' ? (
                                          <textarea
                                            value={fieldEditValue}
                                            onChange={(e) => setFieldEditValue(e.target.value)}
                                            className="w-full bg-background border border-primary rounded p-1.5 text-xs text-textMain outline-none resize-none font-sans mt-0.5 focus:ring-1 focus:ring-primary leading-normal"
                                            rows={3}
                                            autoFocus
                                            disabled={isSavingField}
                                          />
                                        ) : (
                                          <input
                                            type="text"
                                            value={fieldEditValue}
                                            onChange={(e) => setFieldEditValue(e.target.value)}
                                            className="w-full bg-background border border-primary rounded p-1.5 text-xs text-textMain outline-none font-sans mt-0.5 focus:ring-1 focus:ring-primary"
                                            autoFocus
                                            disabled={isSavingField}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveField(item.name);
                                              else if (e.key === 'Escape') setEditingField(null);
                                            }}
                                          />
                                        )}
                                        
                                        <div className="flex space-x-2 mt-1.5 justify-end w-full">
                                          <button 
                                            disabled={isSavingField}
                                            onClick={(e) => { e.stopPropagation(); setEditingField(null); }}
                                            className="px-2 py-1 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded text-[9px] font-bold text-textMuted flex items-center space-x-0.5"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                            <span>Cancel</span>
                                          </button>
                                          <button 
                                            disabled={isSavingField}
                                            onClick={(e) => { e.stopPropagation(); handleSaveField(item.name); }}
                                            className="px-2 py-1 bg-primary text-white hover:bg-primary/95 rounded text-[9px] font-bold flex items-center space-x-0.5"
                                          >
                                            {isSavingField ? (
                                              <div className="w-2.5 h-2.5 border border-t-transparent border-white rounded-full animate-spin" />
                                            ) : (
                                              <Check className="w-2.5 h-2.5 text-white" />
                                            )}
                                            <span>Save</span>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        onClick={(e) => { 
                                          if (item.editable) {
                                            e.stopPropagation(); 
                                            setEditingField(item.name); 
                                            setFieldEditValue(item.value); 
                                          }
                                        }}
                                        className={`w-full mt-2 pt-1.5 border-t border-border/40 flex flex-col group/val ${
                                          item.editable ? 'cursor-text hover:bg-surfaceHighlight/40 px-1 py-0.5 rounded -mx-1 transition-colors' : ''
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-[8px] text-textMuted uppercase font-semibold tracking-wider select-none">Current Value:</span>
                                          {item.editable && (
                                            <span className="text-[8px] text-primary opacity-0 group-hover/val:opacity-100 transition-opacity font-bold uppercase select-none">Click to edit</span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-textMain italic truncate font-medium opacity-85 mt-0.5" title={item.value}>
                                          {item.value}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-textMuted bg-background select-none">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-25" />
              <h2 className="text-lg font-semibold text-textMain">No Template Selected</h2>
              <p className="text-sm mt-1">Choose one of the 16 steps from the library navigation list.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

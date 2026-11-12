import { useState, useEffect, useRef } from "react";
import { Copy, AlertCircle, Edit, Save, X, Check, Sparkles, Plus, Database, FileText, Search } from "lucide-react";
import { PromptTemplatePayload, RenderedPromptResult } from "../../lib/prompt-engine";
import { Episode } from "../../types";

interface PromptPreviewProps {
  template?: PromptTemplatePayload | null;
  rendered?: RenderedPromptResult | null;
  onSaveTemplate?: (newText: string, scope: 'episode' | 'channel' | 'global') => void;
  activeEpisode?: Episode | null;
  humanNotes?: string;
  finalThesis?: string;
  narratorMode?: string;
  onUpdateEpisode?: (fields: any) => Promise<void>;
  onSaveHumanNotes?: (text: string) => void;
}

export default function PromptPreview({ 
  template, 
  rendered, 
  onSaveTemplate, 
  activeEpisode,
  humanNotes = '',
  finalThesis = '',
  narratorMode = '',
  onUpdateEpisode,
  onSaveHumanNotes
}: PromptPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saveScope, setSaveScope] = useState<'episode' | 'channel' | 'global'>('episode');

  // States for variable editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldEditValue, setFieldEditValue] = useState("");
  const [isSavingField, setIsSavingField] = useState(false);

  // States for inline editor inside the rendered text
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [inlineEditingField, setInlineEditingField] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderedContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template && !isEditing) {
      setEditContent(template.raw_text);
      if (template.scope) {
        setSaveScope(template.scope);
      }
    }
  }, [template, isEditing]);

  const handleCopy = () => {
    if (rendered?.renderedText) {
      navigator.clipboard.writeText(rendered.renderedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    onSaveTemplate?.(editContent, saveScope);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(template?.raw_text || "");
    setIsEditing(false);
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const insertedText = `[${placeholder}]`;
    const newContent = before + insertedText + after;
    
    setEditContent(newContent);
    
    // Restore focus and position cursor after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Card click triggers navigation/highlight in text or insertion if not present
  const handleCardClick = (placeholder: string) => {
    if (isEditing) {
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const text = editContent;
      const tag = `[${placeholder}]`;
      const index = text.indexOf(tag);
      
      if (index !== -1) {
        // Highlight existing tag
        textarea.focus();
        textarea.setSelectionRange(index, index + tag.length);
        
        // Proportional scroll positioning to center the highlighted block
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
        // Insert if not found
        handleInsertPlaceholder(placeholder);
      }
    } else {
      // Non-editing scroll/highlight
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
    if (fieldName === "INITIAL_NOTES") {
      onSaveHumanNotes?.(value);
    } else {
      let fieldKey = "";
      if (fieldName === "EPISODE_TOPIC") fieldKey = "topic";
      else if (fieldName === "PRIMARY_WORK") fieldKey = "primary_work";
      else if (fieldName === "DESIRED_TONE") fieldKey = "desired_tone";
      else if (fieldName === "TARGET_AUDIENCE") fieldKey = "target_audience";

      if (fieldKey && onUpdateEpisode) {
        await onUpdateEpisode({ [fieldKey]: value });
      }
    }
  };

  const handleSaveField = async (fieldName: string) => {
    setIsSavingField(true);
    try {
      await saveFieldValue(fieldName, fieldEditValue);
      setEditingField(null);
    } catch (err) {
      console.error("Failed to save field:", err);
    } finally {
      setIsSavingField(false);
    }
  };

  const handleSaveInlineField = async (fieldName: string) => {
    try {
      await saveFieldValue(fieldName, inlineEditValue);
      setInlineEditingField(null);
    } catch (err) {
      console.error("Failed to save inline field:", err);
    }
  };

  const isFieldEditable = (name?: string) => {
    if (!name) return false;
    return ['EPISODE_TOPIC', 'PRIMARY_WORK', 'DESIRED_TONE', 'TARGET_AUDIENCE', 'INITIAL_NOTES'].includes(name);
  };

  const unresolved = rendered?.unresolvedPlaceholders || [];

  // Group variables for the assistant sidebar
  const variableGroups = [
    {
      title: "Episode Fields",
      icon: <Database className="w-3.5 h-3.5 text-primary" />,
      items: [
        {
          name: "EPISODE_TOPIC",
          label: "Episode Topic",
          description: "Theme or focus of this episode",
          value: activeEpisode?.topic || "Not set",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "PRIMARY_WORK",
          label: "Primary Subject",
          description: "Primary book, film, case study or text",
          value: activeEpisode?.primary_work || "N/A",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "DESIRED_TONE",
          label: "Desired Tone",
          description: "Channel style or aesthetic tone",
          value: activeEpisode?.desired_tone || "Intelligent",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "TARGET_AUDIENCE",
          label: "Target Audience",
          description: "Demographics or target audience",
          value: activeEpisode?.target_audience || "General audience",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: true
        },
        {
          name: "LANGUAGE_REGION",
          label: "Language & Region",
          description: "Language code and target region",
          value: activeEpisode ? `${activeEpisode.target_language || 'EN'}-${activeEpisode.target_region || 'US'}` : "EN-US",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          editable: false
        },
        {
          name: "INITIAL_NOTES",
          label: "Initial / Guidance Notes",
          description: "Your human notes for this step",
          value: humanNotes || "No notes entered yet",
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
          value: finalThesis || "No approved thesis yet",
          badgeClass: "bg-success/10 text-success border-success/20",
          editable: false
        },
        {
          name: "NARRATOR_MODE",
          label: "Step 10 Narrator Mode",
          description: "The approved voice narration style",
          value: narratorMode || "No approved narrator mode yet",
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

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-textMain">{isEditing ? "Edit Template" : "Rendered Prompt"}</h3>
          {template && !isEditing && (
            <p className="text-xs text-textMuted mt-1">
              Template Version: v{template.version_number.toString().padStart(3, '0')} | Scope: <span className="font-semibold text-primary capitalize">{template.scope || 'Global Master'}</span> | Source: {template.source === 'local_seed_from_google_docs' ? 'Google Docs Seed' : 'Local Edit / Placeholder'}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-surfaceHighlight transition-colors"
              >
                <Edit className="w-4 h-4 text-primary" />
                <span>Edit Template</span>
              </button>
              <button 
                disabled={unresolved.length > 0}
                onClick={handleCopy}
                className="flex items-center space-x-2 bg-primary text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Prompt"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 bg-surfaceHighlight/35 p-1.5 rounded-lg border border-border/80">
              <span className="text-[11px] font-bold text-textMuted pl-1">Save to:</span>
              <select 
                value={saveScope}
                onChange={(e) => setSaveScope(e.target.value as any)}
                className="bg-surface border border-border rounded-lg text-xs font-bold px-2 py-1 outline-none focus:border-primary text-textMain cursor-pointer hover:bg-surfaceHighlight transition-colors"
              >
                <option value="episode">This Episode only</option>
                {activeEpisode?.channel_id && <option value="channel">This Channel</option>}
                <option value="global">Global Master</option>
              </select>
              <button 
                onClick={handleCancel}
                className="flex items-center space-x-1.5 bg-surface border border-border px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-surfaceHighlight transition-colors text-textMain"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center space-x-1.5 bg-success text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-success/95 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Template</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dependency Warning Row */}
      {!isEditing && unresolved.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-4 flex items-start space-x-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-danger mb-1">Unresolved Dependencies</h4>
            <p className="text-xs text-danger/80 mb-2">
              The following placeholders could not be resolved. This usually means an upstream step has not been completed, or Human Creative Inputs are required.
            </p>
            <div className="flex flex-wrap gap-2">
              {unresolved.map(p => (
                <span key={p} className="px-2.5 py-1 bg-danger/20 text-danger rounded text-xs font-mono border border-danger/30 font-bold">
                  {p === 'HUMAN_NOTES_REQUIRED' ? 'Human Creative Inputs Required' : `[${p}]`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Split Body */}
      <div className="flex-1 bg-surface border border-border rounded-xl overflow-hidden flex flex-row min-h-0 relative">
        
        {/* Left Side: Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 w-full p-6 bg-background font-mono text-sm text-textMain outline-none resize-none leading-relaxed selection:bg-primary/25"
              placeholder="Enter prompt template here... Use brackets to reference variables, e.g. [EPISODE_TOPIC]"
            />
          ) : (
            <div 
              ref={renderedContainerRef}
              className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap text-textMain"
            >
              {rendered?.segments ? (
                rendered.segments.map((seg, idx) => {
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
                rendered?.renderedText || 'No prompt loaded.'
              )}
            </div>
          )}
        </div>

        {/* Right Side: Variable Assistant Sidebar */}
        <div className="w-96 border-l border-border bg-surfaceHighlight/10 flex flex-col h-full shrink-0 overflow-hidden">
          {/* Sidebar Title */}
          <div className="p-4 border-b border-border bg-surface flex flex-col shrink-0">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Variable Assistant</h4>
            </div>
            <p className="text-[10px] text-textMuted leading-relaxed">
              Click any card to highlight/navigate to its placeholder in the template. Click "Current Value" to edit its value directly.
            </p>
            
            {/* Simple Search Input */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search placeholders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-textMain focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Sidebar Variables Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {variableGroups.map((group) => {
              // Filter items based on search term
              const filteredItems = group.items.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (filteredItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-2">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-textMuted uppercase tracking-wider select-none">
                    {group.icon}
                    <span>{group.title}</span>
                  </div>

                  <div className="space-y-2.5">
                    {filteredItems.map((item) => {
                      const isFieldEditing = editingField === item.name;

                      return (
                        <div
                          key={item.name}
                          onClick={() => handleCardClick(item.name)}
                          className="bg-surface border border-border/75 rounded-lg p-3 hover:border-primary/60 hover:bg-surfaceHighlight/20 cursor-pointer transition-all flex flex-col items-start select-none relative group"
                          title={isEditing ? `Navigate to [${item.name}] in template` : `Highlight [${item.name}] in rendered prompt`}
                        >
                          {/* Plus button indicator shown on hover */}
                          <Plus className="w-3.5 h-3.5 absolute top-3.5 right-3 text-textMuted group-hover:text-primary transition-colors" />

                          {/* Placeholder tag pill */}
                          <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold border ${item.badgeClass} mb-1.5`}>
                            {item.name}
                          </span>
                          
                          {/* Label and Description */}
                          <span className="text-[11px] font-bold text-textMain leading-none mb-0.5">{item.label}</span>
                          <span className="text-[10px] text-textMuted leading-normal">{item.description}</span>
                          
                          {/* Current Value Preview / Inline Editor */}
                          {isFieldEditing ? (
                            <div className="w-full mt-2 pt-1.5 border-t border-border/40 flex flex-col" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[9px] text-primary uppercase font-extrabold tracking-wider mb-1">Editing Value:</span>
                              {item.name === 'EPISODE_TOPIC' || item.name === 'INITIAL_NOTES' ? (
                                <textarea
                                  value={fieldEditValue}
                                  onChange={(e) => setFieldEditValue(e.target.value)}
                                  className="w-full bg-background border border-primary rounded p-1.5 text-xs text-textMain outline-none resize-none font-sans mt-0.5 focus:ring-1 focus:ring-primary leading-relaxed"
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
                                  className="px-2 py-1 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded text-[10px] font-bold text-textMuted flex items-center space-x-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                                <button 
                                  disabled={isSavingField}
                                  onClick={(e) => { e.stopPropagation(); handleSaveField(item.name); }}
                                  className="px-2 py-1 bg-primary text-white hover:bg-primary/90 rounded text-[10px] font-bold flex items-center space-x-1"
                                >
                                  {isSavingField ? (
                                    <div className="w-3 h-3 border border-t-transparent border-white rounded-full animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3 text-white" />
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
                              className={`w-full mt-2 pt-1.5 border-t border-border/40 flex flex-col group/val ${item.editable ? 'cursor-text hover:bg-surfaceHighlight/30 px-1 py-0.5 rounded -mx-1 transition-colors' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-textMuted uppercase font-semibold tracking-wider mb-0.5 select-none">Current Value:</span>
                                {item.editable && (
                                  <span className="text-[9px] text-primary opacity-0 group-hover/val:opacity-100 transition-opacity font-bold uppercase select-none">Click to edit</span>
                                )}
                              </div>
                              <span className="text-xs text-textMain italic truncate font-medium opacity-85" title={item.value}>
                                {item.value}
                              </span>
                            </div>
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
  );
}

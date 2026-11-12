import { useState, useEffect } from "react";
import { History, CheckCircle, XCircle, Edit3, AlertTriangle, GitCompare, MessageSquare, Send, Play, Pause, Volume2, Copy, Check, Sparkles, FileText, Globe, Sliders } from "lucide-react";
import { ArtifactVersionPayload } from "../../lib/workflow-engine";
import { getDb } from "../../lib/database";

interface ReviewConsoleProps {
  onApprove: () => void;
  onReject: () => void;
  isApproved: boolean;
  artifact?: ArtifactVersionPayload | null;
  versions?: ArtifactVersionPayload[];
  onSelectVersion?: (versionId: string) => void;
  onSaveEdit?: (editedContent: string) => void;
  stepNumber?: number;
}

function parseDerivatives(text: string) {
  if (!text) return { titles: [], description: "", tags: [], shorts: "" };
  
  const titlesMatch = text.match(/###?\s*Titles?\s*([\s\S]*?)(?=###?|$)/i);
  const descMatch = text.match(/###?\s*Description\s*([\s\S]*?)(?=###?|$)/i);
  const tagsMatch = text.match(/###?\s*Tags\s*([\s\S]*?)(?=###?|$)/i);
  const shortsMatch = text.match(/###?\s*(?:Shorts|Reels|TikTok)\s*([\s\S]*?)(?=###?|$)/i);
  
  const parseList = (str?: string) => {
    if (!str) return [];
    return str.split('\n')
      .map(line => line.replace(/^[-*+\d.\s]+/g, '').trim())
      .filter(line => line.length > 5);
  };
  
  return {
    titles: parseList(titlesMatch?.[1]) || ["Master Episode Cut"],
    description: descMatch?.[1]?.trim() || text,
    tags: parseList(tagsMatch?.[1]) || ["youtube", "video", "production"],
    shorts: shortsMatch?.[1]?.trim() || "No shorts script generated yet."
  };
}

function parseVisualBeats(text: string) {
  if (!text) return [];
  const beats: {
    number: string;
    excerpt: string;
    suggestion: string;
    type: string;
    intention: string;
    rhythm: string;
  }[] = [];

  const lines = text.split('\n');
  const tableLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
  
  if (tableLines.length > 2) {
    for (let i = 2; i < tableLines.length; i++) {
      const cols = tableLines[i].split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cols.length >= 3) {
        const num = cols[0] || `Beat ${beats.length + 1}`;
        const excerpt = cols[1] || '';
        const suggestion = cols[2] || '';
        const type = cols[3] || 'symbolic B-roll';
        const intention = cols[4] || '';
        const rhythm = cols[5] || 'medium';
        
        beats.push({
          number: num.replace(/^[*\s]+|[*\s]+$/g, ''),
          excerpt: excerpt.replace(/^["'\s]+|["'\s]+$/g, ''),
          suggestion: suggestion,
          type: type,
          intention: intention,
          rhythm: rhythm
        });
      }
    }
  }

  if (beats.length === 0) {
    const blocks = text.split(/(?=###?\s*(?:Beat|Visual Beat)\s*\d+)/i);
    for (const block of blocks) {
      if (!/Beat|Visual Beat/i.test(block)) continue;
      const blockLines = block.split('\n');
      const numMatch = block.match(/###?\s*(Beat\s*\d+|Visual Beat\s*\d+)/i);
      const number = numMatch ? numMatch[1] : `Beat ${beats.length + 1}`;
      
      let excerpt = '';
      let suggestion = '';
      let type = '';
      let intention = '';
      let rhythm = '';
      
      for (const line of blockLines) {
        const clean = line.replace(/^\s*[-*+]\s*/, '').trim();
        if (/Excerpt|Script/i.test(clean)) {
          excerpt = clean.replace(/^.*?[::\-]\s*/, '').replace(/^["'\s]+|["'\s]+$/g, '');
        } else if (/Suggestion|Primary Visual/i.test(clean)) {
          suggestion = clean.replace(/^.*?[::\-]\s*/, '');
        } else if (/Visual Type|Type/i.test(clean)) {
          type = clean.replace(/^.*?[::\-]\s*/, '');
        } else if (/Intention|Emotional/i.test(clean)) {
          intention = clean.replace(/^.*?[::\-]\s*/, '');
        } else if (/Rhythm|Editing/i.test(clean)) {
          rhythm = clean.replace(/^.*?[::\-]\s*/, '');
        }
      }
      
      if (suggestion) {
        beats.push({ number, excerpt, suggestion, type, intention, rhythm });
      }
    }
  }

  if (beats.length === 0) {
    let currentBeat: any = null;
    for (const line of lines) {
      const trimmed = line.trim();
      const beatMatch = trimmed.match(/^(?:Beat|Visual Beat)\s*(\d+)[:.]?\s*(.*)/i);
      if (beatMatch) {
        if (currentBeat) beats.push(currentBeat);
        currentBeat = {
          number: `Beat ${beatMatch[1]}`,
          excerpt: '',
          suggestion: beatMatch[2] || '',
          type: 'symbolic B-roll',
          intention: '',
          rhythm: ''
        };
      } else if (currentBeat) {
        if (trimmed.toLowerCase().includes('script') || trimmed.toLowerCase().includes('excerpt')) {
          currentBeat.excerpt = trimmed.replace(/^.*?[::\-]\s*/, '');
        } else if (trimmed.toLowerCase().includes('visual') || trimmed.toLowerCase().includes('suggestion')) {
          currentBeat.suggestion = trimmed.replace(/^.*?[::\-]\s*/, '');
        } else if (trimmed.toLowerCase().includes('type')) {
          currentBeat.type = trimmed.replace(/^.*?[::\-]\s*/, '');
        }
      }
    }
    if (currentBeat) beats.push(currentBeat);
  }

  return beats;
}

function generateSRT(text: string): string {
  if (!text) return "";
  const cleanText = text
    .replace(/#+ .*?\n/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\r/g, "")
    .trim();

  const segments = cleanText.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 5);
  let srt = "";
  let currentTime = 1;
  
  segments.forEach((seg, index) => {
    const wordCount = seg.split(/\s+/).length;
    const duration = Math.max(2, Math.min(7, Math.ceil(wordCount / 2.5)));
    
    const formatTime = (totalSeconds: number) => {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = Math.floor(totalSeconds % 60);
      const ms = 0;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    
    const startTimeStr = formatTime(currentTime);
    const endTimeStr = formatTime(currentTime + duration);
    srt += `${index + 1}\n${startTimeStr} --> ${endTimeStr}\n${seg}\n\n`;
    currentTime += duration + 0.5;
  });
  return srt;
}

function generateMarkers(text: string) {
  if (!text) return { davinci: "", premiere: "" };
  const markerList: { timeSeconds: number; label: string; timecode: string }[] = [];
  const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?\s*[-–—:]?\s*(.+)/g;
  const lines = text.split('\n');
  
  for (const line of lines) {
    timestampRegex.lastIndex = 0;
    const match = timestampRegex.exec(line);
    if (match) {
      let hrs = 0;
      let mins = parseInt(match[1]);
      let secs = parseInt(match[2]);
      let label = match[4].trim();
      
      if (match[3]) {
        hrs = parseInt(match[1]);
        mins = parseInt(match[2]);
        secs = parseInt(match[3]);
      }
      
      const totalSeconds = hrs * 3600 + mins * 60 + secs;
      const tc = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:00`;
      markerList.push({ timeSeconds: totalSeconds, label, timecode: tc });
    }
  }
  
  markerList.sort((a, b) => a.timeSeconds - b.timeSeconds);
  
  let davinci = "";
  markerList.forEach(m => {
    davinci += `${m.label}\tYouTube Chapter\t${m.timecode}\t00:00:01:00\tBlue\n`;
  });
  
  let premiere = `"Marker Name","Description","In","Out","Duration","Marker Type"\n`;
  markerList.forEach(m => {
    premiere += `"${m.label}","YouTube Chapter","${m.timecode}","${m.timecode}","00:00:00:00","Comment"\n`;
  });
  
  return { davinci, premiere };
}

function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReviewConsole({ onApprove, onReject, artifact, versions, onSelectVersion, onSaveEdit, stepNumber = 0 }: ReviewConsoleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [compareContent, setCompareContent] = useState<string>('');

  // Partner Comments
  const [comments, setComments] = useState<{ id: string; feedback_text: string; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState("");

  // Step 11 Narration controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [voiceActor] = useState("Adam (Deep Baritone)");

  // Step 15 Derivatives Tab
  const [activeDerivTab, setActiveDerivTab] = useState<"seo" | "shorts" | "raw">("seo");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Step 9 Visual Mapper Tab & MJ style parameters
  const [activeStep9Tab, setActiveStep9Tab] = useState<"timeline" | "raw">("timeline");
  const [mjStyle, setMjStyle] = useState(', cinematic documentary, detailed, 35mm photo, 8k, aspect ratio 16:9 --ar 16:9');
  const [copiedBeatIndex, setCopiedBeatIndex] = useState<number | null>(null);

  const versionLabel = artifact ? `v${artifact.version_number.toString().padStart(3, '0')}` : null;
  const isArtifactApproved = artifact?.status === 'approved';
  const isArtifactRejected = artifact?.status === 'rejected';
  const isArtifactSuperseded = artifact?.status === 'superseded';
  const hasRealContent = artifact?.content && artifact.content !== '__ERROR_MISSING_SNAPSHOT__' && artifact.content.length > 0;

  useEffect(() => {
    if (artifact?.id) {
      loadComments(artifact.id);
      stopSpeech();
    }
  }, [artifact?.id]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const loadComments = async (versionId: string) => {
    try {
      const db = await getDb();
      const rows = await db.select<any[]>(
        `SELECT id, feedback_text, created_at FROM human_reviews 
         WHERE artifact_version_id = $1 AND feedback_text IS NOT NULL AND feedback_text != ''
         ORDER BY created_at DESC`,
        [versionId]
      );
      setComments(rows);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !artifact) return;
    try {
      const db = await getDb();
      const now = new Date().toISOString();
      const rows = await db.select<any[]>(
        'SELECT episode_id, step_run_id FROM artifact_versions WHERE id = $1',
        [artifact.id]
      );
      if (rows.length > 0) {
        const { episode_id, step_run_id } = rows[0];
        await db.execute(
          `INSERT INTO human_reviews (id, episode_id, step_run_id, artifact_version_id, decision, feedback_text, reviewed_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'comment_' + Math.random().toString(36).substring(2, 11),
            episode_id,
            step_run_id,
            artifact.id,
            'comment',
            newComment.trim(),
            now,
            now
          ]
        );
        setNewComment("");
        loadComments(artifact.id);
      }
    } catch (err) {
      console.error('Failed to save comment:', err);
    }
  };

  const handleStartEdit = () => {
    if (artifact?.content) {
      setEditContent(artifact.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onSaveEdit) {
      onSaveEdit(editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // Step 11 TTS Player
  const playSpeech = () => {
    if (!artifact?.content) return;
    window.speechSynthesis.cancel();
    const cleanText = artifact.content.replace(/[#*`_-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 1000));
    utterance.rate = playbackRate;
    
    // Choose voice: prefer system's Spanish or English voice depending on channel/text
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith("es") || v.lang.startsWith("en"));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Load Compare Version content
  const handleSelectCompare = async (versionId: string) => {
    setCompareVersionId(versionId);
    try {
      const db = await getDb();
      const version = (await db.select<any[]>('SELECT * FROM artifact_versions WHERE id = $1', [versionId]))[0];
      if (version) {
        const { readSnapshot } = await import("../../lib/snapshot-manager");
        const content = await readSnapshot(version.local_snapshot_path);
        setCompareContent(content);
      }
    } catch (err) {
      console.error('Failed to load compare content:', err);
      setCompareContent('Error loading content.');
    }
  };

  const renderDiffLines = () => {
    if (!artifact?.content || !compareContent) return null;
    const linesA = compareContent.split('\n');
    const linesB = artifact.content.split('\n');
    const max = Math.max(linesA.length, linesB.length);
    
    const lines: React.ReactNode[] = [];
    for (let i = 0; i < max; i++) {
      const a = linesA[i] || '';
      const b = linesB[i] || '';
      const isDiff = a !== b;
      lines.push(
        <div key={i} className={`grid grid-cols-2 gap-4 border-b border-border/40 py-1.5 text-xs font-mono whitespace-pre-wrap leading-relaxed ${isDiff ? 'bg-warning/5' : ''}`}>
          <div className={`p-1.5 rounded ${isDiff && a ? 'bg-red-950/40 text-red-300' : 'text-textMuted'}`}>
            {a || <span className="opacity-20">---</span>}
          </div>
          <div className={`p-1.5 rounded ${isDiff && b ? 'bg-green-950/40 text-green-300' : 'text-textMain'}`}>
            {b || <span className="opacity-20">---</span>}
          </div>
        </div>
      );
    }
    return lines;
  };

  // Parsing metadata for derivatives
  const derivData = stepNumber === 15 && artifact?.content ? parseDerivatives(artifact.content) : null;
  const visualBeats = stepNumber === 9 && artifact?.content ? parseVisualBeats(artifact.content) : [];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-textMain">Review Console</h3>
          {artifact && (
            <p className="text-[10px] font-bold text-textMuted mt-0.5">
              Source: {artifact.source_type} | Version: {versionLabel}
            </p>
          )}
        </div>
        {versionLabel && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${isArtifactApproved ? 'bg-success/15 text-success' : isArtifactRejected ? 'bg-danger/15 text-danger' : 'bg-surfaceHighlight text-warning animate-pulse'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isArtifactApproved ? 'bg-success' : isArtifactRejected ? 'bg-danger' : 'bg-warning'}`}></span>
            <span>{isArtifactApproved ? 'Approved' : isArtifactRejected ? 'Rejected' : 'Awaiting Review'}</span>
          </div>
        )}
      </div>

      {/* Step 11 Narration Preview Component */}
      {stepNumber === 11 && hasRealContent && !isEditing && (
        <div className="bg-surface border border-border/80 rounded-xl p-4 mb-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-1.5">
              <Volume2 className="w-4 h-4 text-primaryHover" />
              <span>Voice Narration Preview</span>
            </span>
            <span className="text-[10px] text-textMuted">Listen and calibrate voice pacing before approval</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {isPlaying ? (
                <button onClick={stopSpeech} className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-xs font-extrabold transition-all shadow">
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Preview</span>
                </button>
              ) : (
                <button onClick={playSpeech} className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-xs font-extrabold transition-all shadow">
                  <Play className="w-4 h-4 fill-white" />
                  <span>Listen Script</span>
                </button>
              )}
              
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-textMuted font-bold">Speed:</span>
                <select value={playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))}
                  className="bg-background border border-border rounded-lg text-xs font-bold text-white px-2 py-1 outline-none">
                  <option value="0.8">0.8x</option>
                  <option value="1">1.0x (Normal)</option>
                  <option value="1.1">1.1x</option>
                  <option value="1.2">1.2x</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-background/50 border border-border/60 px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
              <span className="text-textMuted">Voice Profile:</span>
              <span className="font-bold text-white">{voiceActor}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewer / Editor / Derivatives */}
      {artifact?.content === '__ERROR_MISSING_SNAPSHOT__' ? (
        <div className="flex-1 bg-danger/10 border border-danger/30 rounded-xl p-6 mb-5 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-10 h-10 text-danger mb-3" />
          <h3 className="text-sm font-extrabold text-danger mb-1">Snapshot File Missing</h3>
          <p className="text-xs text-danger/80">Local content file could not be read from disk.</p>
        </div>
      ) : isEditing ? (
        <div className="flex-1 flex flex-col mb-5 min-h-[300px]">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-xs text-primaryHover font-bold">Editing candidate content draft...</span>
            <div className="flex space-x-2">
              <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs border border-border rounded-xl hover:bg-surfaceHighlight transition-colors font-medium">Cancel</button>
              <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs bg-primary text-white rounded-xl hover:bg-primaryHover transition-colors font-bold">Save Version</button>
            </div>
          </div>
          <textarea
            className="flex-1 w-full bg-surface border border-primary/30 rounded-xl p-4 text-xs font-mono leading-relaxed text-textMain focus:border-primary outline-none resize-none"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
          />
        </div>
      ) : stepNumber === 15 && derivData ? (
        // Custom Step 15 Derivatives Tabbed Workspace
        <div className="flex-1 flex flex-col mb-5 min-h-[350px]">
          <div className="flex bg-surface border border-border/80 p-0.5 rounded-xl mb-4 shrink-0">
            <button
              onClick={() => setActiveDerivTab("seo")}
              className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-extrabold py-2 px-3 rounded-lg transition-all ${activeDerivTab === "seo" ? "bg-primary text-white" : "text-textMuted hover:text-textMain"}`}
            >
              <Globe className="w-4 h-4" />
              <span>YouTube SEO Package</span>
            </button>
            <button
              onClick={() => setActiveDerivTab("shorts")}
              className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-extrabold py-2 px-3 rounded-lg transition-all ${activeDerivTab === "shorts" ? "bg-primary text-white" : "text-textMuted hover:text-textMain"}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Shorts & TikTok Script</span>
            </button>
            <button
              onClick={() => setActiveDerivTab("raw")}
              className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-extrabold py-2 px-3 rounded-lg transition-all ${activeDerivTab === "raw" ? "bg-primary text-white" : "text-textMuted hover:text-textMain"}`}
            >
              <FileText className="w-4 h-4" />
              <span>Raw Text View</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
            {activeDerivTab === "seo" && (
              <div className="space-y-4">
                {/* Titles */}
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">CTR Optimized Titles</h4>
                  <div className="space-y-2">
                    {derivData.titles.map((title, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-background/50 border border-border/60 p-3 rounded-xl hover:border-primary/45 transition-colors">
                        <span className="text-xs text-white font-medium">{title}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(title);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 1500);
                          }}
                          className="text-textMuted hover:text-primary transition-colors p-1"
                        >
                          {copiedIndex === idx ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Video Description</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(derivData.description);
                        alert("Description copied to clipboard!");
                      }}
                      className="text-[10px] text-primaryHover hover:underline font-bold"
                    >
                      Copy Description
                    </button>
                  </div>
                  <div className="bg-background/60 border border-border/60 p-4 rounded-xl text-xs text-textMain whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                    {derivData.description}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">Metadata Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {derivData.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-primary/10 border border-primary/20 text-white font-mono font-bold px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeDerivTab === "shorts" && (
              <div className="space-y-3 flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">TikTok / Reels Clip Outline</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(derivData.shorts);
                      alert("Shorts script copied!");
                    }}
                    className="text-[10px] text-primaryHover hover:underline font-bold"
                  >
                    Copy Script
                  </button>
                </div>
                <div className="bg-background/60 border border-border/60 p-4 rounded-xl text-xs text-textMain leading-relaxed font-sans max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                  {derivData.shorts}
                </div>
              </div>
            )}

            {activeDerivTab === "raw" && (
              <div className="font-mono text-xs whitespace-pre-wrap select-all leading-relaxed select-text p-1">
                {artifact?.content}
              </div>
            )}
          </div>
        </div>
      ) : stepNumber === 9 && visualBeats.length > 0 ? (
        // Custom Step 9 Visual Mapper Tabbed Workspace
        <div className="flex-1 flex flex-col mb-5 min-h-[350px]">
          <div className="flex bg-surface border border-border/80 p-0.5 rounded-xl mb-4 shrink-0">
            <button
              onClick={() => setActiveStep9Tab("timeline")}
              className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-extrabold py-2 px-3 rounded-lg transition-all ${activeStep9Tab === "timeline" ? "bg-primary text-white" : "text-textMuted hover:text-textMain"}`}
            >
              <Sliders className="w-4 h-4" />
              <span>Interactive Beat Mapper</span>
            </button>
            <button
              onClick={() => setActiveStep9Tab("raw")}
              className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-extrabold py-2 px-3 rounded-lg transition-all ${activeStep9Tab === "raw" ? "bg-primary text-white" : "text-textMuted hover:text-textMain"}`}
            >
              <FileText className="w-4 h-4" />
              <span>Raw Text View</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
            {activeStep9Tab === "timeline" && (
              <div className="space-y-4">
                {/* Midjourney Global Suffix Config */}
                <div className="bg-background/40 border border-border/50 p-4 rounded-xl space-y-2">
                  <label className="text-[10px] font-extrabold text-primaryHover uppercase tracking-wider block">Midjourney Style Suffix Parameters</label>
                  <input
                    type="text"
                    value={mjStyle}
                    onChange={e => setMjStyle(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-lg px-3 py-2 text-xs text-textMain focus:border-primary outline-none"
                    placeholder="e.g. , 35mm photograph, documentary style, moody, detailed, 8k, aspect ratio 16:9 --ar 16:9"
                  />
                  <p className="text-[9px] text-textMuted">This will automatically append to your beat descriptions when copying imagine prompts.</p>
                </div>

                {/* Beats List */}
                <div className="space-y-4">
                  {visualBeats.map((beat, idx) => {
                    const fullPrompt = `/imagine prompt: ${beat.suggestion.trim()}${mjStyle}`;
                    return (
                      <div key={idx} className="bg-background/30 border border-border/60 rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/20">{beat.number}</span>
                            <span className="text-[10px] bg-surfaceHighlight border border-border px-2 py-0.5 rounded text-textMuted uppercase font-bold tracking-wider">{beat.type}</span>
                          </div>
                          {beat.rhythm && (
                            <span className="text-[10px] text-textMuted font-mono">Rhythm: <strong className="text-white font-extrabold">{beat.rhythm}</strong></span>
                          )}
                        </div>

                        {beat.excerpt && (
                          <div className="text-[11px] text-textMuted italic bg-background/50 border border-border/30 px-3 py-2 rounded-lg leading-relaxed">
                            "{beat.excerpt}"
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-textMuted uppercase tracking-wider block">Visual Director Suggestion</label>
                          <div className="text-xs text-textMain font-sans leading-relaxed">{beat.suggestion}</div>
                        </div>

                        <div className="bg-background/70 border border-border/70 p-3 rounded-lg flex items-center justify-between gap-3">
                          <div className="font-mono text-[10px] text-primaryHover truncate flex-1 leading-none select-all">{fullPrompt}</div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(fullPrompt);
                              setCopiedBeatIndex(idx);
                              setTimeout(() => setCopiedBeatIndex(null), 1500);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-white flex items-center space-x-1.5 shrink-0 transition-colors"
                          >
                            {copiedBeatIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-success" />
                                <span className="text-success">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Prompt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStep9Tab === "raw" && (
              <div className="font-mono text-xs whitespace-pre-wrap select-all leading-relaxed select-text p-1">
                {artifact?.content}
              </div>
            )}
          </div>
        </div>
      ) : stepNumber === 16 ? (
        // Custom Step 16 Publishing + NLE Timelines Exporter Workspace
        <div className="flex-1 flex flex-col mb-5 min-h-[350px]">
          {/* Exporter control panel */}
          <div className="bg-surface border border-border/80 rounded-xl p-4 mb-4 shadow-sm flex flex-col shrink-0">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>NLE Exporter Tool</span>
              </span>
              <span className="text-[10px] text-textMuted">Generate and export timelines & markers directly to editors</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  const srt = generateSRT(artifact?.content || "");
                  downloadFile("subtitles_skeleton.srt", srt, "text/plain");
                }}
                className="flex items-center justify-center space-x-2 bg-background hover:bg-surfaceHighlight border border-border/80 px-4 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all hover:border-primary/40 shadow-sm"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span>Download SRT Captions</span>
              </button>

              <button
                onClick={() => {
                  const { davinci } = generateMarkers(artifact?.content || "");
                  downloadFile("davinci_markers.txt", davinci, "text/plain");
                }}
                className="flex items-center justify-center space-x-2 bg-background hover:bg-surfaceHighlight border border-border/80 px-4 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all hover:border-primary/40 shadow-sm"
              >
                <Sliders className="w-4 h-4 text-primary" />
                <span>DaVinci Markers (.txt)</span>
              </button>

              <button
                onClick={() => {
                  const { premiere } = generateMarkers(artifact?.content || "");
                  downloadFile("premiere_markers.csv", premiere, "text/csv");
                }}
                className="flex items-center justify-center space-x-2 bg-background hover:bg-surfaceHighlight border border-border/80 px-4 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all hover:border-primary/40 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Premiere Markers (.csv)</span>
              </button>
            </div>
          </div>

          {/* Standard Text Viewer below */}
          <div className="flex-1 bg-surface border border-border rounded-xl p-5 overflow-y-auto font-mono text-xs leading-relaxed text-textMain whitespace-pre-wrap select-text">
            {artifact?.content || 'No content loaded.'}
          </div>
        </div>
      ) : (
        // Standard Text Viewer
        <div className="flex-1 bg-surface border border-border rounded-xl p-5 overflow-y-auto mb-5 font-mono text-xs leading-relaxed text-textMain whitespace-pre-wrap select-text">
          {artifact?.content || 'No content loaded.'}
        </div>
      )}

      {/* Action buttons bar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 grid grid-cols-5 gap-3 mb-5 shrink-0">
        <button 
          onClick={onApprove} 
          disabled={!artifact || !hasRealContent || isArtifactApproved || isEditing}
          className="col-span-2 flex items-center justify-center space-x-2 bg-success text-white py-2 rounded-xl font-bold hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
        >
          <CheckCircle className="w-4 h-4 fill-white text-success" />
          <span>{isArtifactApproved ? 'Version Approved' : 'Approve Version'}</span>
        </button>
        
        <button 
          onClick={onReject}
          disabled={!artifact || isArtifactApproved || isArtifactRejected || isArtifactSuperseded || isEditing}
          className="flex flex-col items-center justify-center space-y-0.5 bg-background border border-border py-1.5 rounded-xl hover:bg-surfaceHighlight transition-colors text-danger disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">{isArtifactRejected ? 'Rejected' : 'Reject'}</span>
        </button>
        
        <button 
          onClick={handleStartEdit}
          disabled={!artifact || !hasRealContent || isEditing}
          className="flex flex-col items-center justify-center space-y-0.5 bg-background border border-border py-1.5 rounded-xl hover:bg-surfaceHighlight transition-colors text-primaryHover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit3 className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Manual Edit</span>
        </button>
        
        <button 
          disabled={!versions || versions.length < 2}
          onClick={() => {
            setShowCompare(true);
            const otherVersions = versions?.filter(v => v.id !== artifact?.id) || [];
            if (otherVersions.length > 0 && !compareVersionId) {
              handleSelectCompare(otherVersions[0].id);
            }
          }}
          className="flex flex-col items-center justify-center space-y-0.5 bg-background border border-border py-1.5 rounded-xl hover:bg-surfaceHighlight transition-colors text-textMuted disabled:opacity-50 disabled:cursor-not-allowed" 
          title={versions && versions.length >= 2 ? "Compare versions" : "Need at least 2 versions to compare"}
        >
          <GitCompare className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Compare</span>
        </button>
      </div>

      {/* Version History List */}
      <div className="border-t border-border/80 pt-4 mb-4 shrink-0">
        <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2.5 flex items-center space-x-2 text-white">
          <History className="w-4 h-4 text-textMuted" />
          <span>Version History ({versions?.length || 0})</span>
        </h4>
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {versions?.map(v => {
            const isSelected = artifact?.id === v.id;
            return (
              <div 
                key={v.id}
                onClick={() => onSelectVersion?.(v.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'bg-primary/5 border-primary/40' : 'bg-background/45 border-border/60 hover:bg-surfaceHighlight'
                }`}
              >
                <div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-textMain'}`}>
                    Version {v.version_number.toString().padStart(3, '0')}
                  </span>
                  <span className="text-[10px] text-textMuted ml-3 font-semibold">
                    {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  {isSelected && <span className="text-[10px] font-extrabold text-primary">Currently Viewing</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    v.status === 'approved' ? 'bg-success/15 text-success' :
                    v.status === 'rejected' ? 'bg-danger/15 text-danger' :
                    v.status === 'superseded' ? 'bg-textMuted/15 text-textMuted' :
                    'bg-warning/15 text-warning'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mina & Ale Comments Section */}
      {artifact && (
        <div className="border-t border-border/80 pt-4 shrink-0">
          <h4 className="text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center space-x-2 text-white">
            <MessageSquare className="w-4 h-4 text-warning" />
            <span>Mina & Ale Feedback Notes ({comments.length})</span>
          </h4>
          
          <div className="flex gap-2.5 mb-3.5">
            <input
              type="text"
              placeholder="Leave a note/request changes for this version..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddComment()}
              className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2 text-xs text-textMain focus:border-primary outline-none"
            />
            <button
              onClick={handleAddComment}
              className="bg-primary hover:bg-primaryHover text-white px-3.5 py-2 rounded-xl transition-all shadow text-xs font-bold flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-textMuted italic text-center py-2">No comments left yet. Write one to guide edits!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="bg-background/40 border border-border/80 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-extrabold text-primaryHover">MINA & ALE</span>
                    <span className="text-[9px] text-textMuted font-semibold">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-textMain leading-relaxed select-text font-medium text-white">{c.feedback_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Visual Diff Viewer Modal */}
      {showCompare && artifact && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-surface border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-primaryHover" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Side-by-Side Version Diff</h3>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-textMuted">Compare with:</span>
                <select
                  value={compareVersionId || ""}
                  onChange={e => handleSelectCompare(e.target.value)}
                  className="bg-background border border-border rounded-xl text-xs font-bold text-white px-3 py-1.5 outline-none"
                >
                  {versions?.filter(v => v.id !== artifact.id).map(v => (
                    <option key={v.id} value={v.id}>Version {v.version_number.toString().padStart(3, '0')}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCompare(false)}
                  className="bg-surface border border-border text-xs px-3.5 py-1.5 rounded-xl font-bold hover:bg-surfaceHighlight transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background/30">
              <div className="grid grid-cols-2 gap-4 border-b border-border/80 pb-2 mb-2 text-xs font-extrabold uppercase tracking-wider text-textMuted shrink-0">
                <div>Historical Draft Version</div>
                <div>Current Draft ({versionLabel})</div>
              </div>
              <div className="flex-1 select-text">
                {compareContent ? renderDiffLines() : (
                  <p className="text-xs text-textMuted italic text-center py-8">Select a version above to compare.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

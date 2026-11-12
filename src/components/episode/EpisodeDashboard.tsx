import { useState, useEffect } from "react";
import { Plus, CheckCircle, AlertCircle, Clock, Layers, ArrowRight, Search, Trash2, Globe, MessageSquare, Lightbulb, Sliders, Calendar, User, Cpu, BarChart2 } from "lucide-react";
import { getEpisodes, getChannels, deleteChannel, updateEpisode, deleteEpisode } from "../../lib/episode-service";
import { getStepRuns } from "../../lib/workflow-engine";
import { STEPS } from "../../config/steps";
import { Episode, WorkflowStepRun, WorkflowState, Channel } from "../../types";
import { getDb } from "../../lib/database";
import { getSandboxIdeas, addSandboxIdea, deleteSandboxIdea, SandboxIdea } from "../../lib/sandbox-service";
import { getSetting, saveSetting } from "../../lib/settings-service";
import ChannelEditForm from "../channel/ChannelEditForm";
import ChannelForm from "../channel/ChannelForm";


const PROVIDER_MODELS_LOCAL = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview", "o1-mini"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  qwen: ["qwen3-235b-a22b", "qwen3-32b", "qwen3-14b", "qwen3-8b", "qwen3-4b", "qwen3-1.7b", "qwen3-0.6b", "qwen-plus", "qwen-max", "qwen-turbo", "qwen2.5-72b-instruct", "qwen2.5-32b-instruct", "qwen2.5-14b-instruct", "qwen2.5-7b-instruct"]
};

interface EpisodeDashboardProps {
  projectId: string;
  currentEpisodeId?: string | null;
  onSelectEpisode: (episodeId: string) => void;
  onCreateEpisode: (initialTitle?: string, initialTopic?: string, initialChannelId?: string) => void;
}

interface AuditLogItem {
  event_description: string;
  event_type: string;
  created_at: string;
}

// Generate premium gradients for covers based on seed text
function getGradientStyle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',   // Indigo -> Cyan
    'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)',   // Fuchsia -> Violet
    'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',   // Emerald -> Blue
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',   // Amber -> Red
    'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',   // Pink -> Rose
    'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',   // Violet -> Blue
    'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',   // Cyan -> Emerald
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

function getStepStateClass(state: WorkflowState) {
  switch (state) {
    case 'approved':
      return 'bg-success shadow-sm shadow-success/40 border-success/50';
    case 'awaiting_human_review':
    case 'awaiting_review':
      return 'bg-warning shadow-sm shadow-warning/40 border-warning/50 animate-pulse';
    case 'running':
      return 'bg-primaryHover shadow-sm shadow-primary/40 border-primaryHover/50 animate-pulse';
    case 'ready':
    case 'input_ready':
      return 'bg-primary border-primary/50';
    case 'blocked':
      return 'bg-surfaceHighlight border-border/40';
    default:
      return 'bg-border/30 border-transparent';
  }
}

export default function EpisodeDashboard({ projectId, currentEpisodeId, onSelectEpisode, onCreateEpisode }: EpisodeDashboardProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stepRunsMap, setStepRunsMap] = useState<Record<string, WorkflowStepRun[]>>({});
  const [sandboxIdeas, setSandboxIdeas] = useState<SandboxIdea[]>([]);
  const [newIdeaText, setNewIdeaText] = useState("");
  const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [activeModelKeys, setActiveModelKeys] = useState<Record<string, boolean>>({
    openai: false,
    gemini: false,
    deepseek: false,
    kimi: false,
    qwen: false
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "drafting" | "review" | "completed">("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "unassigned" | "Mina" | "Ale">("all");
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);


  // Weekly Scheduler Slots State
  const [scheduledEpisodes, setScheduledEpisodes] = useState<Record<string, string>>({});

  // Dashboard Navigation Tabs & Analytics / Routing States
  const [dashboardTab, setDashboardTab] = useState<'queue' | 'analytics' | 'routing'>('queue');

  interface CostUsageStat {
    provider: string;
    model: string;
    token_input_count: number;
    token_output_count: number;
    estimated_cost: number;
    created_at: string;
  }
  const [analyticsData, setAnalyticsData] = useState<CostUsageStat[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [routingSettings, setRoutingSettings] = useState<Record<string, { provider: string; model: string }>>({});
  const [savingRoutingKey, setSavingRoutingKey] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    loadData();
    loadSchedule();
  }, [projectId]);

  useEffect(() => {
    if (dashboardTab === 'analytics') {
      loadAnalytics();
    } else if (dashboardTab === 'routing') {
      loadRoutingSettings();
    }
  }, [dashboardTab]);

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const db = await getDb();
      const rows = await db.select<CostUsageStat[]>(
        `SELECT provider, model, token_input_count, token_output_count, estimated_cost, created_at 
         FROM artifact_versions 
         WHERE provider IS NOT NULL OR estimated_cost IS NOT NULL`
      );
      setAnalyticsData(rows || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadRoutingSettings = async () => {
    try {
      const map: Record<string, { provider: string; model: string }> = {};
      for (let i = 1; i <= 16; i++) {
        const provider = await getSetting(`step_${i}_provider`) || 'openai';
        const model = await getSetting(`step_${i}_model`) || '';
        map[i.toString()] = { provider, model };
      }
      setRoutingSettings(map);
    } catch (err) {
      console.error("Failed to load routing settings:", err);
    }
  };

  const handleUpdateRouting = async (stepId: number, provider: string, model: string) => {
    const key = `${stepId}`;
    setSavingRoutingKey(key);
    try {
      await saveSetting(`step_${stepId}_provider`, provider);
      await saveSetting(`step_${stepId}_model`, model);
      setRoutingSettings(prev => ({
        ...prev,
        [key]: { provider, model }
      }));
    } catch (err) {
      console.error("Failed to save step routing:", err);
    } finally {
      setSavingRoutingKey(null);
    }
  };

  const loadSchedule = async () => {
    try {
      const db = await getDb();
      const rows = await db.select<any[]>(
        "SELECT episode_id, value_text FROM episode_variables WHERE variable_key = $1",
        ['schedule_slot']
      );
      const map: Record<string, string> = {};
      rows.forEach(r => {
        map[r.value_text] = r.episode_id;
      });
      setScheduledEpisodes(map);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
  };

  const setEpisodeSlot = async (episodeId: string, slotName: string) => {
    try {
      const db = await getDb();
      const key = 'schedule_slot';
      
      // Clear this slot if it's already assigned to another episode
      await db.execute(
        "DELETE FROM episode_variables WHERE variable_key = $1 AND value_text = $2",
        [key, slotName]
      );
      
      // Also clear any other slot for this specific episode to avoid duplicate slots
      await db.execute(
        "DELETE FROM episode_variables WHERE episode_id = $1 AND variable_key = $2",
        [episodeId, key]
      );

      // Insert new slot assignment
      await db.execute(
        `INSERT INTO episode_variables (id, episode_id, variable_key, value_text, source_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'epvar_' + Math.random().toString(36).substring(2, 11),
          episodeId,
          key,
          slotName,
          'human_input',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      loadSchedule();
    } catch (err) {
      console.error('Failed to save slot:', err);
    }
  };

  const clearEpisodeSlot = async (slotName: string) => {
    try {
      const db = await getDb();
      await db.execute(
        "DELETE FROM episode_variables WHERE variable_key = $1 AND value_text = $2",
        ['schedule_slot', slotName]
      );
      loadSchedule();
    } catch (err) {
      console.error('Failed to clear slot:', err);
    }
  };

  const updateChannelDirector = async (channelId: string, director: string) => {
    try {
      const db = await getDb();
      const chan = channels.find(c => c.id === channelId);
      if (!chan) return;
      const metadata = chan.metadata_json ? JSON.parse(chan.metadata_json) : {};
      metadata.director = director;
      
      await db.execute(
        'UPDATE channels SET metadata_json = $1, updated_at = $2 WHERE id = $3',
        [JSON.stringify(metadata), new Date().toISOString(), channelId]
      );
      
      // Reload channels state
      const ch = await getChannels(projectId);
      setChannels(ch);
    } catch (err) {
      console.error('Failed to update channel director:', err);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const eps = await getEpisodes(projectId);
      setEpisodes(eps);

      const chs = await getChannels(projectId);
      setChannels(chs);

      // Load runs for each episode
      const runsMap: Record<string, WorkflowStepRun[]> = {};
      for (const ep of eps) {
        try {
          const runs = await getStepRuns(ep.id);
          runsMap[ep.id] = runs;
        } catch {
          runsMap[ep.id] = [];
        }
      }
      setStepRunsMap(runsMap);

      // Load sandbox ideas
      try {
        const ideas = await getSandboxIdeas();
        setSandboxIdeas(ideas);
      } catch (err) {
        console.error('Failed to load sandbox ideas:', err);
      }

      const db = await getDb();
      try {
        const logs = await db.select<AuditLogItem[]>(
          'SELECT event_description, event_type, created_at FROM audit_events ORDER BY created_at DESC LIMIT 6'
        );
        setActivityLogs(logs);
      } catch {
        setActivityLogs([]);
      }

      // Check connections state dynamically
      const dToken = await getSetting("gdrive_access_token") || "";
      setIsDriveConnected(!!dToken);

      const oKey = await getSetting("openai_api_key") || "";
      const gKey = await getSetting("gemini_api_key") || "";
      const dsKey = await getSetting("deepseek_api_key") || "";
      const kKey = await getSetting("kimi_api_key") || "";
      const qKey = await getSetting("qwen_api_key") || "";
      setIsAiConfigured(!!(oKey || gKey || dsKey || kKey || qKey));
      setActiveModelKeys({
        openai: !!oKey,
        gemini: !!gKey,
        deepseek: !!dsKey,
        kimi: !!kKey,
        qwen: !!qKey
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Sandbox Idea
  const handleAddIdea = async () => {
    if (!newIdeaText.trim()) return;
    try {
      await addSandboxIdea(newIdeaText);
      setNewIdeaText("");
      const ideas = await getSandboxIdeas();
      setSandboxIdeas(ideas);
    } catch (e) {
      console.error("Failed to add sandbox idea", e);
    }
  };

  // Delete Sandbox Idea
  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteSandboxIdea(id);
      const ideas = await getSandboxIdeas();
      setSandboxIdeas(ideas);
    } catch (e) {
      console.error("Failed to delete idea", e);
    }
  };

  // Calculate Statistics
  const totalEpisodes = episodes.length;
  let totalApprovedSteps = 0;
  let totalTotalSteps = 0;
  let awaitingReviewCount = 0;

  episodes.forEach(ep => {
    const runs = stepRunsMap[ep.id] || [];
    totalTotalSteps += runs.length;
    totalApprovedSteps += runs.filter(r => r.state === 'approved').length;
    awaitingReviewCount += runs.filter(r => r.state === 'awaiting_human_review' || r.state === 'awaiting_review').length;
  });

  const averageProgress = totalTotalSteps > 0 ? Math.round((totalApprovedSteps / totalTotalSteps) * 100) : 0;

  // Analytics calculations
  const totalCost = analyticsData.reduce((sum, r) => sum + (r.estimated_cost || 0), 0);
  const totalInputTokens = analyticsData.reduce((sum, r) => sum + (r.token_input_count || 0), 0);
  const totalOutputTokens = analyticsData.reduce((sum, r) => sum + (r.token_output_count || 0), 0);

  // Group by Provider
  const providerStats: Record<string, { calls: number; cost: number; tokens: number }> = {};
  analyticsData.forEach(r => {
    const prov = r.provider || 'openai';
    if (!providerStats[prov]) {
      providerStats[prov] = { calls: 0, cost: 0, tokens: 0 };
    }
    providerStats[prov].calls += 1;
    providerStats[prov].cost += r.estimated_cost || 0;
    providerStats[prov].tokens += (r.token_input_count || 0) + (r.token_output_count || 0);
  });

  // Filter episodes
  const filteredEpisodes = episodes.filter(ep => {
    const matchesSearch = 
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.episode_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChannel = channelFilter === "all" || ep.channel_id === channelFilter;

    const runs = stepRunsMap[ep.id] || [];
    const approvedCount = runs.filter(r => r.state === 'approved').length;
    const progressPercent = runs.length > 0 ? Math.round((approvedCount / runs.length) * 100) : 0;

    let matchesStatus = true;
    if (statusFilter === "completed") {
      matchesStatus = progressPercent === 100;
    } else if (statusFilter === "review") {
      matchesStatus = runs.some(r => r.state === 'awaiting_human_review' || r.state === 'awaiting_review');
    } else if (statusFilter === "drafting") {
      matchesStatus = progressPercent > 0 && progressPercent < 100;
    }

    const matchesAssignee = assigneeFilter === "all" || 
      (assigneeFilter === "unassigned" && !ep.assigned_to) || 
      ep.assigned_to === assigneeFilter;

    return matchesSearch && matchesChannel && matchesStatus && matchesAssignee;
  });

  // Split filtered episodes into priority (attention needed) and regular queue
  const priorityEpisodes: Episode[] = [];
  const regularEpisodes: Episode[] = [];

  filteredEpisodes.forEach(ep => {
    const runs = stepRunsMap[ep.id] || [];
    const needsAttention = runs.some(r => 
      r.state === 'awaiting_human_review' || 
      r.state === 'awaiting_review' || 
      r.state === 'running'
    );
    if (needsAttention) {
      priorityEpisodes.push(ep);
    } else {
      regularEpisodes.push(ep);
    }
  });

  const renderEpisodeCard = (ep: Episode, isPriority = false) => {
    const runs = stepRunsMap[ep.id] || [];
    const approvedCount = runs.filter(r => r.state === 'approved').length;
    const isActive = ep.id === currentEpisodeId;
    const progressPercent = runs.length > 0 ? Math.round((approvedCount / runs.length) * 100) : 0;
    const nextStep = runs.find(r => r.state !== 'approved' && r.state !== 'blocked');
    const gradientStyle = getGradientStyle(ep.id);
    const channel = channels.find(c => c.id === ep.channel_id);

    // Find which step is running or awaiting review specifically for priority banner
    const activeStepRun = runs.find(r => r.state === 'awaiting_human_review' || r.state === 'awaiting_review' || r.state === 'running');
    const stepLabelText = activeStepRun ? STEPS.find(s => s.id === activeStepRun.step_number)?.label : "";
    const isRunningState = activeStepRun?.state === 'running';

    return (
      <div key={ep.id}
        onClick={() => onSelectEpisode(ep.id)}
        className={`group bg-surface hover:bg-surfaceHighlight/40 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/45 hover:-translate-y-1 flex flex-col justify-between ${
          isActive 
            ? isPriority 
              ? 'border-warning ring-1 ring-warning/30 shadow-lg shadow-warning/5' 
              : 'border-primary/90 ring-1 ring-primary/30 shadow-lg shadow-primary/5' 
            : isPriority 
              ? 'border-warning/35'
              : 'border-border/80'
        }`}>
        
        {/* Cover Gradient */}
        <div className="h-24 relative flex items-end p-4" style={{ background: gradientStyle }}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white tracking-wider">
            EP{ep.episode_code}
          </div>
          {channel && (
            <div className={`absolute top-3 right-3 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow ${
              isPriority ? 'bg-warning text-black' : 'bg-primary text-white'
            }`}>
              {channel.name}
            </div>
          )}
          <div className="relative z-10 text-white w-full">
            <h3 className="text-base font-extrabold leading-snug truncate drop-shadow-md text-white">{ep.title}</h3>
            <p className="text-[11px] text-white/90 font-semibold truncate mt-0.5 drop-shadow">{ep.topic}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-textMuted mb-2">
              <span className="font-bold text-textMuted">{progressPercent}% complete</span>
              <span className="font-mono text-[10px] font-bold bg-surfaceHighlight border border-border/80 px-2 py-0.5 rounded text-textMain">
                {approvedCount}/16 Approved
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 mb-3 overflow-hidden border border-border/40 shadow-inner">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Priority Indicator Banner */}
            {isPriority && activeStepRun && (
              <div className="mb-3 bg-warning/5 border border-warning/20 p-2.5 rounded-xl flex items-center space-x-2.5">
                <span className={`w-2 h-2 rounded-full ${isRunningState ? 'bg-info animate-pulse' : 'bg-warning animate-ping'}`} />
                <div className="text-[10px] min-w-0 flex-1 font-semibold">
                  <span className="font-black text-textMain uppercase">Step {activeStepRun.step_number}: {stepLabelText}</span>
                  <span className="text-textMuted block mt-0.5 truncate">{isRunningState ? 'AI is generating details...' : 'Directorial input requested'}</span>
                </div>
              </div>
            )}

            {/* Director Assignment Selector */}
            <div className="flex items-center justify-between text-[10px] text-textMuted mb-3 bg-background/20 border border-border/50 px-2.5 py-1.5 rounded-xl" onClick={e => e.stopPropagation()}>
              <span className="font-extrabold flex items-center space-x-1.5 uppercase tracking-wide">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Director:</span>
              </span>
              <select
                value={ep.assigned_to || ""}
                onChange={async (e) => {
                  const val = e.target.value;
                  await updateEpisode(ep.id, { assigned_to: val || undefined });
                  loadData();
                }}
                className="bg-transparent border-none text-white font-extrabold outline-none cursor-pointer text-[10px] hover:text-primaryHover transition-colors focus:ring-0 p-0 text-right pr-2"
              >
                <option value="" className="bg-surface text-textMuted">Unassigned</option>
                <option value="Mina" className="bg-surface text-white">Mina</option>
                <option value="Ale" className="bg-surface text-white">Ale</option>
              </select>
            </div>

            {/* 16-Step Production Pipeline Dots */}
            <div className="flex items-center justify-between gap-[3px] bg-background/30 border border-border/60 p-2 rounded-xl mb-4 shadow-inner">
              {STEPS.map(step => {
                const run = runs.find(r => r.step_number === step.id);
                const state = run?.state as WorkflowState || 'blocked';
                const stateColorClass = getStepStateClass(state);
                return (
                  <div
                    key={step.id}
                    className={`h-2 flex-1 rounded-[2px] transition-all duration-300 border-[0.5px] border-black/10 hover:scale-y-125 ${stateColorClass}`}
                    title={`${step.id.toString().padStart(2, '0')} ${step.label}: ${state}`}
                  />
                );
              })}
            </div>
          </div>

          {nextStep ? (
            <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-3">
              <span className="text-xs text-textMain font-bold truncate flex-1" title={STEPS.find(s => s.id === nextStep.step_number)?.label}>
                Next: <span className="text-primaryHover font-extrabold">S{nextStep.step_number.toString().padStart(2, '0')} {STEPS.find(s => s.id === nextStep.step_number)?.label}</span>
              </span>
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`¿Estás seguro de que deseas borrar el episodio "${ep.title}"? Esta acción eliminará permanentemente todos sus artefactos y datos.`)) {
                      try {
                        await deleteEpisode(ep.id);
                        loadData();
                      } catch (err) {
                        console.error('Failed to delete episode:', err);
                      }
                    }
                  }}
                  className="p-1.5 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  title="Borrar Episodio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onSelectEpisode(ep.id); }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 text-white text-[11px] font-extrabold rounded-lg transition-all duration-200"
                >
                  <span>Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-3">
              <span className="text-xs text-success font-extrabold flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Ready to Publish</span>
              </span>
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`¿Estás seguro de que deseas borrar el episodio "${ep.title}"? Esta acción eliminará permanentemente todos sus artefactos y datos.`)) {
                      try {
                        await deleteEpisode(ep.id);
                        loadData();
                      } catch (err) {
                        console.error('Failed to delete episode:', err);
                      }
                    }
                  }}
                  className="p-1.5 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  title="Borrar Episodio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onSelectEpisode(ep.id); }}
                  className="text-xs bg-success/15 hover:bg-success/25 text-success font-extrabold px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  Open Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-textMuted text-sm font-semibold">Loading Production Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8 relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-border/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-textMain tracking-tight">Production Studio</h1>
            <p className="text-sm text-textMuted mt-1">Co-manage multiple video channel queues, research, and script compilations.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Metrics Bar */}
            <div className="flex items-center space-x-4 bg-surface/40 border border-border/80 px-4 py-2 rounded-2xl">
              <div className="text-center px-1">
                <span className="block text-[10px] text-textMuted font-extrabold uppercase tracking-wider">Episodes</span>
                <span className="text-sm font-black text-textMain">{totalEpisodes}</span>
              </div>
              <span className="text-border/60">|</span>
              <div className="text-center px-1">
                <span className="block text-[10px] text-textMuted font-extrabold uppercase tracking-wider">Progress</span>
                <span className="text-sm font-black text-success">{averageProgress}%</span>
              </div>
              <span className="text-border/60">|</span>
              <div className="text-center px-1 flex flex-col items-center">
                <span className="block text-[10px] text-textMuted font-extrabold uppercase tracking-wider">Awaiting Review</span>
                <span className="text-sm font-black text-warning flex items-center justify-center gap-1.5">
                  {awaitingReviewCount > 0 && <span className="w-1.5 h-1.5 bg-warning rounded-full animate-ping"></span>}
                  {awaitingReviewCount}
                </span>
              </div>
            </div>

            <button onClick={() => onCreateEpisode()}
              className="flex items-center justify-center space-x-2 px-5 py-3 bg-primary hover:bg-primaryHover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-98">
              <Plus className="w-4.5 h-4.5" /><span>New Episode</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs Bar */}
        <div className="flex border-b border-border bg-surface/30 p-1.5 rounded-2xl mb-8 space-x-2 w-fit">
          <button 
            onClick={() => setDashboardTab('queue')}
            className={`flex items-center space-x-2 px-5 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all ${
              dashboardTab === 'queue' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-102' 
                : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Production Queue</span>
          </button>
          <button 
            onClick={() => setDashboardTab('analytics')}
            className={`flex items-center space-x-2 px-5 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all ${
              dashboardTab === 'analytics' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-102' 
                : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Cost & Usage Analytics</span>
          </button>
          <button 
            onClick={() => setDashboardTab('routing')}
            className={`flex items-center space-x-2 px-5 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all ${
              dashboardTab === 'routing' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-102' 
                : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Step AI Routing</span>
          </button>
        </div>

        {dashboardTab === 'queue' && (
          <>
            {/* Quick Guide Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-start space-x-3 text-xs text-textMuted leading-relaxed relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
              <Lightbulb className="w-5 h-5 text-primaryHover shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-white uppercase tracking-wider block mb-0.5">Quick Studio Guide</span>
                To produce a video, select any episode draft from the queue below. Inside the **Workspace**, you'll write creative guidelines, run step-specific AI models, and review the candidates. Click **Approve** on each step to progress along the 16-stage pipeline.
              </div>
            </div>

        {/* --- 2. Two-Column Dashboard Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT AREA: Episode queue & active channels list (8/12 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Filter Control Bar */}
            <div className="bg-surface border border-border/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  placeholder="Search episodes, topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl pl-9 pr-4 py-2 text-sm text-textMain placeholder-textMuted/60 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Filtering Options */}
              <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
                <select
                  value={assigneeFilter}
                  onChange={e => setAssigneeFilter(e.target.value as any)}
                  className="bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-semibold text-textMain focus:border-primary outline-none cursor-pointer"
                >
                  <option value="all">All Directors</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="Mina">Mina</option>
                  <option value="Ale">Ale</option>
                </select>

                <select
                  value={channelFilter}
                  onChange={e => setChannelFilter(e.target.value)}
                  className="bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-semibold text-textMain focus:border-primary outline-none cursor-pointer"
                >
                  <option value="all">All Channels</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <div className="flex bg-background border border-border/80 rounded-xl p-0.5">
                  {(["all", "drafting", "review", "completed"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                        statusFilter === f ? "bg-primary text-white" : "text-textMuted hover:text-textMain"
                      }`}
                    >
                      {f === "all" ? "All" : f === "completed" ? "Done" : f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Action Hub */}
            {priorityEpisodes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-warning">Attention Required</h3>
                  </div>
                  <span className="text-[10px] text-textMuted font-extrabold">{priorityEpisodes.length} Items</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-warning/5 border border-warning/15 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-warning/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
                  {priorityEpisodes.map(ep => renderEpisodeCard(ep, true))}
                </div>
              </div>
            )}

            {/* Catalog Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-textMuted">General Queue</h3>
                <span className="text-[10px] text-textMuted font-extrabold">{regularEpisodes.length} drafts</span>
              </div>

              {regularEpisodes.length === 0 ? (
                <div className="bg-surface border border-border/60 rounded-2xl p-12 text-center shadow-inner">
                  <AlertCircle className="w-10 h-10 text-textMuted/60 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white">No episodes match your criteria</h4>
                  <p className="text-xs text-textMuted mt-1">Try resetting search filters or create a new episode draft.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularEpisodes.map(ep => renderEpisodeCard(ep, false))}
                </div>
              )}
            </div>

            {/* Active Channels Grid Directory */}
            <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-2">
                    <Globe className="w-4.5 h-4.5 text-primaryHover" />
                    <span>Active Channels Directory</span>
                  </h3>
                  <p className="text-[10px] text-textMuted mt-0.5">Manage channel metadata, directors, and channel specific episodes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primaryHover hover:text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-200 border border-primary/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Channel</span>
                  </button>
                  <span className="text-[10px] text-textMuted font-bold bg-background px-3 py-1 rounded-lg border border-border/60">
                    Total: {channels.length} Channels
                  </span>
                </div>
              </div>

              {channels.length === 0 ? (
                <p className="text-xs text-textMuted italic text-center py-6">No channels created yet. Add one from the sidebar!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {channels.map(chan => {
                    const chanEpisodes = episodes.filter(e => e.channel_id === chan.id);
                    const activeCount = chanEpisodes.filter(e => e.status !== 'published').length;
                    const completedCount = chanEpisodes.filter(e => {
                      const runs = stepRunsMap[e.id] || [];
                      const approvedCount = runs.filter(r => r.state === 'approved').length;
                      return runs.length > 0 && approvedCount === runs.length;
                    }).length;
                    
                    const metadata = chan.metadata_json ? JSON.parse(chan.metadata_json) : {};
                    const director = metadata.director || "Mina & Ale";

                    return (
                      <div 
                        key={chan.id} 
                        className="bg-background/45 border border-border/80 p-4 rounded-xl hover:border-primary/45 transition-all shadow-inner flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-xs font-extrabold text-white">{chan.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[9px] bg-primary/20 text-white px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  {chan.language || "Multilingual"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => setEditingChannelId(chan.id)}
                                className="text-[9px] text-primaryHover hover:underline font-bold px-2 py-0.5 rounded bg-primary/10 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete channel "${chan.name}"? This action cannot be undone.`)) {
                                    try {
                                      await deleteChannel(chan.id);
                                      loadData();
                                    } catch (err) {
                                      console.error('Failed to delete channel:', err);
                                    }
                                  }
                                }}
                                className="text-[9px] text-red-400 hover:underline font-bold px-2 py-0.5 rounded bg-red-400/10 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Director Assignment */}
                          <div className="flex items-center justify-between bg-surface/50 border border-border/50 px-2.5 py-1.5 rounded-lg mb-3.5 text-[10px]">
                            <span className="text-textMuted font-bold flex items-center space-x-1">
                              <User className="w-3.5 h-3.5 text-textMuted" />
                              <span>Director:</span>
                            </span>
                            <select
                              value={director}
                              onChange={(e) => updateChannelDirector(chan.id, e.target.value)}
                              className="bg-background border border-border/80 rounded text-[10px] font-bold text-white px-1.5 py-0.5 outline-none cursor-pointer focus:border-primary"
                            >
                              <option value="Mina">Mina</option>
                              <option value="Ale">Ale</option>
                              <option value="Mina & Ale">Mina & Ale</option>
                            </select>
                          </div>

                          {/* Mini metrics bar */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] mb-3">
                            <div className="bg-surface/40 p-1.5 rounded border border-border/50">
                              <div className="text-[8px] text-textMuted font-bold uppercase">Total</div>
                              <div className="font-extrabold text-white mt-0.5">{chanEpisodes.length}</div>
                            </div>
                            <div className="bg-surface/40 p-1.5 rounded border border-border/50">
                              <div className="text-[8px] text-textMuted font-bold uppercase">Active</div>
                              <div className="font-extrabold text-primaryHover mt-0.5">{activeCount}</div>
                            </div>
                            <div className="bg-surface/40 p-1.5 rounded border border-border/50">
                              <div className="text-[8px] text-textMuted font-bold uppercase">Done</div>
                              <div className="font-extrabold text-success mt-0.5">{completedCount}</div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onCreateEpisode("", "", chan.id)}
                          className="w-full bg-primary hover:bg-primaryHover text-white py-1.5 rounded-lg font-bold transition-all text-[10px] flex items-center justify-center space-x-1 shadow mt-2"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New Episode</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT AREA: Brainstorming & Diagnostics (4/12 Columns) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Weekly Video Planner (Compact Vertical Sidebar View) */}
            <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Weekly Video Planner</span>
                </h3>
                <span className="text-[9px] bg-primary/10 border border-primary/20 text-white font-mono font-bold px-2 py-0.5 rounded">
                  4 slots/wk
                </span>
              </div>

              {/* Stack of 4 slots */}
              <div className="space-y-3">
                {["Video 1 (Monday)", "Video 2 (Wednesday)", "Video 3 (Friday)", "Video 4 (Saturday)"].map(slot => {
                  const epId = scheduledEpisodes[slot];
                  const scheduledEp = episodes.find(e => e.id === epId);
                  
                  return (
                    <div 
                      key={slot} 
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                        scheduledEp 
                          ? 'bg-background/40 border-primary/25 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5' 
                          : 'bg-background/20 border-dashed border-border/60 hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-extrabold text-primaryHover uppercase block mb-1">{slot}</span>
                          {scheduledEp ? (
                            <div 
                              onClick={() => onSelectEpisode(scheduledEp.id)} 
                              className="cursor-pointer group/slot"
                            >
                              <span className="text-xs font-extrabold text-white block truncate group-hover/slot:text-primaryHover transition-colors">
                                {scheduledEp.title}
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[9px] bg-primary/15 px-1.5 py-0.2 rounded font-mono font-bold text-primary text-white tracking-wider">
                                  EP{scheduledEp.episode_code}
                                </span>
                                <span className={`text-[8px] font-extrabold px-1 rounded uppercase ${
                                  scheduledEp.status === 'published' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                                }`}>
                                  {scheduledEp.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 py-1">
                              <Clock className="w-3 h-3 text-textMuted/45 animate-pulse" />
                              <span className="text-[9px] text-textMuted/60 font-bold italic">Unassigned slot</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Scheduler dropdown */}
                      <div className="mt-2.5 pt-2 border-t border-border/30">
                        <select
                          value={epId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              setEpisodeSlot(val, slot);
                            } else {
                              clearEpisodeSlot(slot);
                            }
                          }}
                          className="w-full bg-background border border-border/70 rounded-lg text-[9px] font-bold text-white px-2 py-1 outline-none cursor-pointer hover:border-primary/45 transition-colors"
                        >
                          <option value="">-- Assign Video --</option>
                          {episodes.map(e => (
                            <option key={e.id} value={e.id}>EP{e.episode_code} - {e.title.substring(0, 20)}...</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sandbox (Ideas Scratchpad) - Larger visual impact! */}
            <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning/40 to-warning" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-textMain mb-2.5 flex items-center space-x-2 border-b border-border/60 pb-2">
                <Lightbulb className="w-4.5 h-4.5 text-warning" />
                <span>Creative Sandbox Ideas Board</span>
              </h3>
              <p className="text-xs text-textMuted mb-4 leading-relaxed">
                Jot down fresh topics, outline titles, and dump hooks. Convert any idea directly into a full production episode with a single click.
              </p>
              
              {/* Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Type a video idea or hook..."
                  value={newIdeaText}
                  onChange={e => setNewIdeaText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddIdea()}
                  className="flex-1 bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-textMain outline-none focus:border-primary placeholder-textMuted/50 font-medium"
                />
                <button
                  onClick={handleAddIdea}
                  className="bg-primary hover:bg-primaryHover text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* List (Taller scroll area) */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {sandboxIdeas.length === 0 ? (
                   <p className="text-xs text-textMuted italic text-center py-4">No ideas written yet. Drop a line above!</p>
                ) : (
                  sandboxIdeas.map(idea => (
                    <div 
                      key={idea.id} 
                      className="bg-background/40 border border-border/80 p-3.5 rounded-xl flex items-start justify-between gap-3 hover:border-warning/50 hover:bg-background/70 hover:-translate-y-0.5 transition-all duration-300 shadow-inner group/idea"
                    >
                      <p className="text-xs text-textMain leading-relaxed break-words flex-1 select-text font-medium text-white">
                        {idea.content}
                      </p>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            const content = idea.content;
                            const title = content.length > 50 ? content.substring(0, 50) + "..." : content;
                            onCreateEpisode(title, content);
                          }}
                          className="text-textMuted hover:text-primary p-1 rounded hover:bg-primary/10 transition-all"
                          title="Convert to Episode"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="text-textMuted hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-all shrink-0"
                          title="Delete Idea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-textMain mb-3.5 flex items-center space-x-2 border-b border-border/60 pb-2">
                <MessageSquare className="w-4.5 h-4.5 text-success" />
                <span>Recent Studio Activity</span>
              </h3>
              {activityLogs.length === 0 ? (
                <p className="text-xs text-textMuted italic text-center py-4">No recent activity logged. Run tasks to populate!</p>
              ) : (
                <div className="space-y-4 relative pl-3.5 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/80">
                  {activityLogs.map((log, index) => (
                    <div key={index} className="relative text-xs leading-relaxed select-text font-medium">
                      <span className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-surface" />
                      <div className="text-white font-bold">{log.event_description}</div>
                      <div className="text-[10px] text-textMuted flex items-center space-x-2 mt-0.5 font-semibold">
                        <span className="font-mono uppercase text-primaryHover">{log.event_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Collapsible Developer diagnostics console */}
        <div className="mt-8 border-t border-border/60 pt-6">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-textMuted hover:text-textMain transition-colors mb-4"
          >
            <Sliders className="w-4 h-4" />
            <span>{showDiagnostics ? "Hide" : "Show"} System Diagnostics Console</span>
          </button>

          {showDiagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-surface/30 border border-border/80 rounded-2xl p-6 shadow-sm">
              {/* Database status */}
              <div className="flex flex-col justify-between bg-background/50 px-4 py-3.5 rounded-xl border border-border/80 shadow-inner font-semibold animate-fade-in">
                <div className="text-[10px] text-textMuted uppercase font-bold">SQLite Database</div>
                <span className="flex items-center space-x-1.5 text-success font-extrabold text-[10px] mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
                  <span>ONLINE</span>
                </span>
              </div>

              {/* Drive status */}
              <div className="flex flex-col justify-between bg-background/50 px-4 py-3.5 rounded-xl border border-border/80 shadow-inner font-semibold animate-fade-in">
                <div className="text-[10px] text-textMuted uppercase font-bold">Google Drive Sync</div>
                {isDriveConnected ? (
                  <span className="flex items-center space-x-1.5 text-success font-extrabold text-[10px] mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5 text-textMuted font-extrabold text-[10px] mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-textMuted/40"></span>
                    <span>NOT CONNECTED</span>
                  </span>
                )}
              </div>

              {/* AI Config status */}
              <div className="flex flex-col bg-background/50 p-4 rounded-xl border border-border/80 shadow-inner space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-textMuted uppercase">AI Prompt Engine</span>
                  {isAiConfigured ? (
                    <span className="flex items-center space-x-1.5 text-success font-extrabold text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                      <span>READY</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1.5 text-warning font-extrabold text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                      <span>KEY MISSING</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1 pt-1 border-t border-border/40 text-[9px] font-mono text-center font-bold">
                  {[
                    { name: 'OPENAI', active: activeModelKeys.openai },
                    { name: 'GEMINI', active: activeModelKeys.gemini },
                    { name: 'DEEPSEEK', active: activeModelKeys.deepseek },
                    { name: 'KIMI', active: activeModelKeys.kimi },
                    { name: 'QWEN', active: activeModelKeys.qwen },
                  ].map(model => (
                    <div 
                      key={model.name} 
                      className={`py-0.5 rounded transition-colors duration-200 ${
                        model.active 
                          ? 'bg-success/15 text-success border border-success/20 shadow-sm shadow-success/5' 
                          : 'bg-textMuted/5 text-textMuted/40 border border-border/40'
                      }`}
                      title={`${model.name}: ${model.active ? 'Configured' : 'Not Loaded'}`}
                    >
                      {model.name.substring(0, 4)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Workspace storage */}
              <div className="text-[10px] text-textMuted leading-relaxed bg-background/30 p-4 rounded-xl border border-border/60 font-semibold shadow-inner flex flex-col justify-between animate-fade-in">
                <span className="font-extrabold text-textMain uppercase text-[9px]">Active Storage Backend:</span>
                <code className="font-mono text-[9px] text-primaryHover break-all select-all block mt-1">
                  {localStorage.getItem('serverSyncEnabled') === 'true'
                    ? `LAN Sync Server (${localStorage.getItem('serverUrl') || 'http://localhost:5000'})`
                    : 'Local AppData (SQLite + Snapshots)'}
                </code>
              </div>
            </div>
          )}
        </div>
      </>
    )}

    {dashboardTab === 'analytics' && (
      <div className="space-y-6">
        <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-border/60 pb-3 mb-6">
            <BarChart2 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider">Cost & Usage Analytics</h3>
              <p className="text-xs text-textMuted mt-0.5">Track generative AI completion model metrics, token volumes, and expenses.</p>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-textMuted text-xs font-semibold">Aggregating token consumption records...</p>
            </div>
          ) : analyticsData.length === 0 ? (
            <div className="py-12 text-center text-textMuted border border-dashed border-border rounded-xl">
              <p className="text-sm italic">No token usage data logged yet.</p>
              <p className="text-xs mt-1">Run steps in the production workspace using the AI Generator to see cost analytics here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-background/40 border border-border/85 p-5 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-wider text-textMuted">Total Expense</div>
                  <div className="text-2xl font-black text-success mt-1">${totalCost.toFixed(5)}</div>
                  <div className="text-[9px] text-textMuted mt-0.5">Cumulative API cost</div>
                </div>
                <div className="bg-background/40 border border-border/85 p-5 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-wider text-textMuted">Total Input Tokens</div>
                  <div className="text-2xl font-black text-textMain mt-1">{totalInputTokens.toLocaleString()}</div>
                  <div className="text-[9px] text-textMuted mt-0.5">Prompt context sent</div>
                </div>
                <div className="bg-background/40 border border-border/85 p-5 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-wider text-textMuted">Total Output Tokens</div>
                  <div className="text-2xl font-black text-textMain mt-1">{totalOutputTokens.toLocaleString()}</div>
                  <div className="text-[9px] text-textMuted mt-0.5">Generated responses</div>
                </div>
                <div className="bg-background/40 border border-border/85 p-5 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-wider text-textMuted">Total Calls</div>
                  <div className="text-2xl font-black text-primary mt-1">{analyticsData.length}</div>
                  <div className="text-[9px] text-textMuted mt-0.5">API requests serviced</div>
                </div>
              </div>

              {/* Provider Breakdown Cards */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-textMain mb-4">Cost Distribution by Model Provider</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(providerStats).map(([prov, statsVal]) => {
                    const stats = statsVal as { calls: number; cost: number; tokens: number };
                    const percentage = totalCost > 0 ? (stats.cost / totalCost) * 100 : 0;
                    return (
                      <div key={prov} className="bg-background/30 border border-border/70 rounded-2xl p-5 hover:border-primary/20 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-border/30 pb-2">
                            <div className="text-xs font-black uppercase text-textMain tracking-wider font-mono flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              {prov}
                            </div>
                            <div className="text-xs font-extrabold text-success">${stats.cost.toFixed(5)}</div>
                          </div>
                          <div className="space-y-2 text-[10px] text-textMuted font-bold">
                            <div className="flex justify-between">
                              <span>Total API Requests:</span>
                              <span className="text-textMain">{stats.calls}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Consumed Tokens:</span>
                              <span className="text-textMain">{stats.tokens.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[9px] font-bold text-textMuted mb-1">
                            <span>Share of Total Budget:</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historical Log */}
              <div className="bg-background/20 rounded-2xl border border-border/60 p-5 mt-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-textMain mb-4">Latest Generative API Calls</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-textMuted border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-[10px] uppercase font-bold text-textMuted">
                        <th className="pb-3 font-extrabold">Timestamp</th>
                        <th className="pb-3 font-extrabold">Provider</th>
                        <th className="pb-3 font-extrabold">Model</th>
                        <th className="pb-3 font-extrabold">Input Tokens</th>
                        <th className="pb-3 font-extrabold">Output Tokens</th>
                        <th className="pb-3 font-extrabold text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.slice().reverse().map((run, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-surface/20 transition-colors">
                          <td className="py-2.5 font-mono text-[10px]">{new Date(run.created_at).toLocaleString()}</td>
                          <td className="py-2.5 font-bold uppercase text-textMain">{run.provider}</td>
                          <td className="py-2.5 font-mono text-textMain">{run.model}</td>
                          <td className="py-2.5 font-mono">{(run.token_input_count || 0).toLocaleString()}</td>
                          <td className="py-2.5 font-mono">{(run.token_output_count || 0).toLocaleString()}</td>
                          <td className="py-2.5 font-mono text-success text-right font-bold">${(run.estimated_cost || 0).toFixed(5)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {dashboardTab === 'routing' && (
      <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-border/60 pb-3 mb-6">
          <Cpu className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider">Step-Level AI Model Routing</h3>
            <p className="text-xs text-textMuted mt-0.5">Map individual workspace production steps to distinct AI models and settings.</p>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
          {STEPS.map((step) => {
            const config = routingSettings[step.id.toString()] || { provider: 'openai', model: '' };
            const isSaving = savingRoutingKey === step.id.toString();

            const handleRowProviderChange = (newProv: string) => {
              let defaultModel = "";
              if (newProv === 'openai') defaultModel = "gpt-4o";
              else if (newProv === 'gemini') defaultModel = "gemini-1.5-pro";
              else if (newProv === 'deepseek') defaultModel = "deepseek-chat";
              else if (newProv === 'kimi') defaultModel = "moonshot-v1-8k";
              else if (newProv === 'qwen') defaultModel = "qwen-plus";

              handleUpdateRouting(step.id, newProv, defaultModel);
            };

            const handleRowModelChange = (newModel: string) => {
              handleUpdateRouting(step.id, config.provider, newModel);
            };

            return (
              <div key={step.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background/40 border border-border/60 rounded-xl hover:border-primary/20 transition-colors gap-4 animate-fade-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border/80 flex items-center justify-center font-mono font-black text-xs text-textMuted">
                    {step.id.toString().padStart(2, '0')}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-textMain flex items-center gap-1.5">
                      <step.icon className="w-3.5 h-3.5 text-textMuted" />
                      {step.label}
                    </div>
                    <p className="text-[10px] text-textMuted mt-0.5">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {/* Provider Select */}
                  <select
                    value={config.provider}
                    disabled={isSaving}
                    onChange={(e) => handleRowProviderChange(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-textMain outline-none focus:border-primary"
                  >
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="gemini">Google (Gemini)</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="kimi">Kimi (Moonshot)</option>
                    <option value="qwen">Qwen (AliCloud)</option>
                  </select>

                  {/* Model Select */}
                  <select
                    value={config.model || PROVIDER_MODELS_LOCAL[config.provider as keyof typeof PROVIDER_MODELS_LOCAL]?.[0]}
                    disabled={isSaving}
                    onChange={(e) => handleRowModelChange(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-textMain outline-none min-w-[120px] focus:border-primary"
                  >
                    {(PROVIDER_MODELS_LOCAL[config.provider as keyof typeof PROVIDER_MODELS_LOCAL] || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  {isSaving && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      </div>

      {editingChannelId && (
        <ChannelEditForm
          channelId={editingChannelId}
          onClose={() => setEditingChannelId(null)}
          onUpdated={() => {
            setEditingChannelId(null);
            loadData();
          }}
        />
      )}

      {showCreateChannel && (
        <ChannelForm
          projectId={projectId}
          onClose={() => setShowCreateChannel(false)}
          onCreated={() => {
            setShowCreateChannel(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

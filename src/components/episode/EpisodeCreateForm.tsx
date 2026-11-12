import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { CreateEpisodeInput, createEpisode, getChannels } from "../../lib/episode-service";
import { Channel } from "../../types";
import ChannelForm from "../channel/ChannelForm";

interface EpisodeCreateFormProps {
  projectId: string;
  onClose: () => void;
  onCreated: (episodeId: string) => void;
  initialTitle?: string;
  initialTopic?: string;
  initialChannelId?: string;
}

export default function EpisodeCreateForm({ projectId, onClose, onCreated, initialTitle, initialTopic, initialChannelId }: EpisodeCreateFormProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showChannelForm, setShowChannelForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState(initialTitle || '');
  const [topic, setTopic] = useState(initialTopic || '');
  const [primaryWork, setPrimaryWork] = useState('');
  const [channelId, setChannelId] = useState(initialChannelId || '');
  const [assignedTo, setAssignedTo] = useState(() => localStorage.getItem('activeProfile') || '');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [targetRegion, setTargetRegion] = useState('Latin America');
  const [targetAudience, setTargetAudience] = useState('General audience');
  const [desiredTone, setDesiredTone] = useState('Intelligent');
  const [spoilerPolicy, setSpoilerPolicy] = useState('ALLOWED');
  const [adaptationPolicy, setAdaptationPolicy] = useState('INCLUDE MAJOR ADAPTATIONS');
  const [researchDepth, setResearchDepth] = useState('DEEP RESEARCH DOSSIER');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const ch = await getChannels(projectId);
      setChannels(ch);
      const activeChanId = initialChannelId || (ch.length > 0 ? ch[0].id : '');
      if (activeChanId) {
        setChannelId(activeChanId);
        const selectedChan = ch.find(c => c.id === activeChanId);
        if (selectedChan) {
          applyChannelDefaults(selectedChan);
        }
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  const applyChannelDefaults = (channel: Channel) => {
    if (channel.language) setTargetLanguage(channel.language);
    if (channel.region) setTargetRegion(channel.region);
    if (channel.target_audience) setTargetAudience(channel.target_audience);
    if (channel.desired_tone) setDesiredTone(channel.desired_tone);
    if (channel.spoiler_policy) setSpoilerPolicy(channel.spoiler_policy);
    if (channel.adaptation_policy) setAdaptationPolicy(channel.adaptation_policy);
  };

  const handleChannelChange = (newChannelId: string) => {
    setChannelId(newChannelId);
    const channel = channels.find(c => c.id === newChannelId);
    if (channel) applyChannelDefaults(channel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Episode title is required.'); return; }
    if (!topic.trim()) { setError('Episode topic is required.'); return; }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const input: CreateEpisodeInput = {
        title: title.trim(),
        topic: topic.trim(),
        primary_work: primaryWork.trim() || undefined,
        channel_id: channelId || undefined,
        target_language: targetLanguage,
        target_region: targetRegion,
        target_audience: targetAudience,
        desired_tone: desiredTone,
        spoiler_policy: spoilerPolicy,
        adaptation_policy: adaptationPolicy,
        research_depth: researchDepth,
        assigned_to: assignedTo || undefined,
      };
      const episodeId = await createEpisode(projectId, input);
      onCreated(episodeId);
    } catch (err: any) {
      console.error('[EpisodeCreateForm] Error creating episode:', err);
      setError(typeof err === 'string' ? err : err.message || JSON.stringify(err) || 'Failed to create episode.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelCreated = async (newChannelId: string) => {
    setShowChannelForm(false);
    await loadChannels();
    setChannelId(newChannelId);
    const ch = await getChannels(projectId);
    const newChannel = ch.find(c => c.id === newChannelId);
    if (newChannel) applyChannelDefaults(newChannel);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
            <h2 className="text-lg font-semibold text-textMain">Create New Episode</h2>
            <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Title + Topic */}
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Episode Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none"
                placeholder="e.g. The Architecture of Memory" />
            </div>
            
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Topic *</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none resize-none"
                placeholder="e.g. How human memory works, the science of forgetting, and what AI gets wrong about remembering" />
            </div>

            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Primary Work / Subject</label>
              <input type="text" value={primaryWork} onChange={e => setPrimaryWork(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none"
                placeholder="e.g. Moonwalking with Einstein by Joshua Foer" />
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Assign Responsible Director</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                <option value="">Unassigned (Both Mina & Ale)</option>
                <option value="Mina">Mina</option>
                <option value="Ale">Ale</option>
              </select>
            </div>

            {/* Channel Selector */}
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Channel</label>
              <div className="flex space-x-2">
                <select value={channelId} onChange={e => handleChannelChange(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                  <option value="">No channel</option>
                  {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowChannelForm(true)}
                  className="px-3 py-2 bg-surfaceHighlight border border-border rounded text-xs hover:border-primary/50 transition-colors flex items-center space-x-1">
                  <Plus className="w-3 h-3" /><span>New</span>
                </button>
              </div>
              <p className="text-[10px] text-textMuted mt-1">Selecting a channel inherits its default settings below.</p>
            </div>

            {/* Creative Settings */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-textMain mb-3">Creative Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-textMuted block mb-1">Language</label>
                  <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                    <option>Spanish</option><option>English</option><option>Turkish</option><option>Portuguese</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-textMuted block mb-1">Region</label>
                  <input type="text" value={targetRegion} onChange={e => setTargetRegion(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-textMuted block mb-1">Audience</label>
                  <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-textMuted block mb-1">Tone</label>
                  <input type="text" value={desiredTone} onChange={e => setDesiredTone(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-textMuted block mb-1">Spoiler Policy</label>
                  <select value={spoilerPolicy} onChange={e => setSpoilerPolicy(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                    <option>ALLOWED</option><option>NOT ALLOWED</option><option>PARTIAL</option><option>UNKNOWN</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-textMuted block mb-1">Adaptation Policy</label>
                  <select value={adaptationPolicy} onChange={e => setAdaptationPolicy(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                    <option>INCLUDE MAJOR ADAPTATIONS</option><option>PRIMARY VERSION ONLY</option>
                    <option>CONTROLLED CONTRAST</option><option>ADAPTATION-CENTERED</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="text-xs font-medium text-textMuted block mb-1">Research Depth</label>
                <select value={researchDepth} onChange={e => setResearchDepth(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                  <option>DEEP RESEARCH DOSSIER</option>
                  <option>STANDARD RESEARCH BRIEF</option>
                  <option>FAST OVERVIEW</option>
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded p-2">{error}</p>}
            
            <div className="flex justify-end space-x-3 pt-2 border-t border-border">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-surfaceHighlight transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 text-sm bg-primary text-white rounded font-medium hover:bg-primaryHover transition-colors disabled:opacity-50">
                <Plus className="w-4 h-4" /><span>{isSaving ? 'Creating...' : 'Create Episode & Start'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {showChannelForm && (
        <ChannelForm projectId={projectId} onClose={() => setShowChannelForm(false)} onCreated={handleChannelCreated} />
      )}
    </>
  );
}

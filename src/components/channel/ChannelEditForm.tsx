import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { getChannel, updateChannel, CreateChannelInput } from "../../lib/episode-service";

interface ChannelEditFormProps {
  channelId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const TONE_OPTIONS = [
  'Intelligent', 'Stylish', 'Darkly Funny', 'Emotionally Precise',
  'Cinematic', 'Culturally Analytical', 'Elegant', 'Critical', 'Intimate'
];

const NARRATOR_OPTIONS = ['First person', 'Third person', 'Hybrid', 'Observational'];

export default function ChannelEditForm({ channelId, onClose, onUpdated }: ChannelEditFormProps) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [region, setRegion] = useState('Latin America');
  const [targetAudience, setTargetAudience] = useState('General audience');
  const [desiredTone, setDesiredTone] = useState('Intelligent');
  const [narratorMode, setNarratorMode] = useState('First person');
  const [visualStyle, setVisualStyle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [spoilerPolicy, setSpoilerPolicy] = useState('ALLOWED');
  const [adaptationPolicy, setAdaptationPolicy] = useState('INCLUDE MAJOR ADAPTATIONS');
  const [outroTemplate, setOutroTemplate] = useState('');
  const [sponsorGuidelines, setSponsorGuidelines] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    async function load() {
      try {
        const chan = await getChannel(channelId);
        if (chan) {
          setName(chan.name || '');
          setLanguage(chan.language || 'Spanish');
          setRegion(chan.region || 'Latin America');
          setTargetAudience(chan.target_audience || 'General audience');
          setDesiredTone(chan.desired_tone || 'Intelligent');
          setNarratorMode(chan.narrator_mode || 'First person');
          setVisualStyle(chan.visual_style || '');
          setDurationMinutes(chan.default_duration_minutes || 25);
          setSpoilerPolicy(chan.spoiler_policy || 'ALLOWED');
          setAdaptationPolicy(chan.adaptation_policy || 'INCLUDE MAJOR ADAPTATIONS');
          setOutroTemplate(chan.outro_template || '');
          setSponsorGuidelines(chan.sponsor_guidelines || '');
        }
      } catch (err) {
        console.error('Failed to load channel for editing:', err);
        setError('Failed to load channel details.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [channelId]);
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Channel name is required.'); return; }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const input: Partial<CreateChannelInput> = {
        name: name.trim(),
        language,
        region,
        target_audience: targetAudience,
        desired_tone: desiredTone,
        narrator_mode: narratorMode,
        visual_style: visualStyle || undefined,
        default_duration_minutes: durationMinutes,
        spoiler_policy: spoilerPolicy,
        adaptation_policy: adaptationPolicy,
        outro_template: outroTemplate || '',
        sponsor_guidelines: sponsorGuidelines || '',
      };
      await updateChannel(channelId, input);
      onUpdated();
    } catch (err: any) {
      console.error('[ChannelEditForm] Error updating channel:', err);
      setError(typeof err === 'string' ? err : err.message || 'Failed to update channel.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-xl p-8 flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-textMuted text-xs font-semibold">Loading Channel Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <h2 className="text-sm font-extrabold text-textMain uppercase tracking-wider">Edit Channel Settings</h2>
          <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Channel Name */}
          <div>
            <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Channel Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Mina-Ale Spanish" />
          </div>

          {/* Language + Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                <option>Spanish</option><option>English</option><option>Turkish</option><option>Portuguese</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Region</label>
              <input type="text" value={region} onChange={e => setRegion(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
          </div>

          {/* Audience + Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Desired Tone</label>
              <select value={desiredTone} onChange={e => setDesiredTone(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Narrator + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Narrator Mode</label>
              <select value={narratorMode} onChange={e => setNarratorMode(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                {NARRATOR_OPTIONS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Default Duration (min)</label>
              <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
          </div>

          {/* Policies */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Spoiler Policy</label>
              <select value={spoilerPolicy} onChange={e => setSpoilerPolicy(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                <option>ALLOWED</option><option>NOT ALLOWED</option><option>PARTIAL</option><option>UNKNOWN</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Adaptation Policy</label>
              <select value={adaptationPolicy} onChange={e => setAdaptationPolicy(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none">
                <option>INCLUDE MAJOR ADAPTATIONS</option><option>PRIMARY VERSION ONLY</option>
                <option>CONTROLLED CONTRAST</option><option>ADAPTATION-CENTERED</option>
              </select>
            </div>
          </div>

          {/* Visual Style */}
          <div>
            <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Visual Style</label>
            <input type="text" value={visualStyle} onChange={e => setVisualStyle(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none"
              placeholder="e.g. Cinematic, dark backgrounds, archival footage" />
          </div>

          {/* Outro Template */}
          <div>
            <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Global Outro Template / Links</label>
            <textarea value={outroTemplate} onChange={e => setOutroTemplate(e.target.value)} rows={2}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none resize-none"
              placeholder="e.g. Subscribe and support us on Patreon at patreon.com/channel name" />
          </div>

          {/* Sponsor Guidelines */}
          <div>
            <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-1">Sponsor / Partnership Guidelines</label>
            <textarea value={sponsorGuidelines} onChange={e => setSponsorGuidelines(e.target.value)} rows={2}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none resize-none"
              placeholder="e.g. This segment is sponsored by Audible. Keep the tone natural." />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
          
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-surfaceHighlight transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2 text-sm bg-primary text-white rounded font-medium hover:bg-primaryHover transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /><span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Settings, Cloud, HardDrive, LayoutDashboard, Clapperboard, BookOpen, MessageSquare } from "lucide-react";
import SettingsModal from "./SettingsModal";
import { getEpisodes } from "../../lib/episode-service";
import { getSetting } from "../../lib/settings-service";
import { Episode } from "../../types";

type AppView = 'dashboard' | 'workspace' | 'prompts';

interface TopBarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  currentEpisodeId?: string | null;
  onEpisodeChange: (episodeId: string) => void;
  projectId: string;
  onToggleChat?: () => void;
}

export default function TopBar({ currentView, onViewChange, currentEpisodeId, onEpisodeChange, projectId, onToggleChat }: TopBarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [activeProfile, setActiveProfile] = useState('Mina');

  useEffect(() => {
    loadEpisodes();
  }, [projectId]);

  const loadEpisodes = async () => {
    try {
      const eps = await getEpisodes(projectId);
      setEpisodes(eps);
    } catch (err) {
      console.error('Failed to load episodes for TopBar:', err);
    }
  };

  const checkDriveStatus = async () => {
    try {
      const token = await getSetting("gdrive_access_token");
      setIsDriveConnected(!!token);
    } catch {
      setIsDriveConnected(false);
    }
  };

  // Re-load episodes when switching away from dashboard (they may have changed)
  useEffect(() => {
    if (currentView === 'workspace') {
      loadEpisodes();
    }
    checkDriveStatus();
    setActiveProfile(localStorage.getItem('activeProfile') || 'Mina');
  }, [currentView, showSettings]);

  const currentEpisode = episodes.find(e => e.id === currentEpisodeId);

  return (
    <>
      <header className="h-14 border-b border-border/80 bg-surface/85 backdrop-blur-md flex items-center px-5 shrink-0 justify-between shadow-sm z-30 transition-all duration-300">
        <div className="flex items-center space-x-5">
          {/* View Switcher */}
          <div className="flex items-center space-x-1 bg-background/60 rounded-xl p-1 border border-border/50">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50'
              }`}>
              <LayoutDashboard className="w-3.5 h-3.5" /><span>Dashboard</span>
            </button>
            <button
              onClick={() => onViewChange('workspace')}
              disabled={!currentEpisodeId}
              title={!currentEpisodeId ? "Select an episode from the dropdown first to access the workspace" : "Go to Production Workspace"}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                currentView === 'workspace'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed'
              }`}>
              <Clapperboard className="w-3.5 h-3.5" /><span>Workspace</span>
            </button>
            <button
              onClick={() => onViewChange('prompts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                currentView === 'prompts'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50'
              }`}>
              <BookOpen className="w-3.5 h-3.5" /><span>Prompts</span>
            </button>
          </div>

          <span className="text-border/60 font-light">|</span>

          {/* Episode Selector */}
          <select 
            value={currentEpisodeId || ''} 
            onChange={e => {
              if (e.target.value) {
                onEpisodeChange(e.target.value);
                onViewChange('workspace');
              }
            }}
            className="bg-surfaceHighlight border border-border/80 rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-textMain cursor-pointer transition-all hover:bg-surfaceHighlight/80 max-w-xs shadow-sm"
          >
            <option value="" disabled className="bg-background">Select Episode...</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id} className="bg-background">
                EP{ep.episode_code} — {ep.title}
              </option>
            ))}
          </select>

          {currentEpisode && (
            <>
              <span className="text-border/60 font-light">|</span>
              <span className="text-primaryHover text-xs font-semibold bg-primary/10 px-3 py-1 rounded-full border border-primary/20 truncate max-w-[240px]">
                {currentEpisode.target_language || 'EN'} / {currentEpisode.desired_tone || 'Standard'}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-5 text-xs text-textMuted font-medium">
          {isDriveConnected ? (
            <div className="flex items-center space-x-2 text-success font-semibold bg-success/15 px-3 py-1 rounded-full border border-success/20 shadow-inner" title="Google Drive connected">
              <Cloud className="w-3.5 h-3.5 animate-pulse text-success" />
              <span>Drive Synced</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-textMuted bg-surfaceHighlight/40 px-3 py-1 rounded-full border border-border/50" title="Google Drive disconnected">
              <Cloud className="w-3.5 h-3.5 text-textMuted/45" />
              <span>Not Synced</span>
            </div>
          )}
          
          {localStorage.getItem('serverSyncEnabled') === 'true' ? (
            <div className="flex items-center space-x-2 text-primaryHover font-semibold bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-inner" title="Connected to network database">
              <HardDrive className="w-3.5 h-3.5 text-primary" />
              <span>Network DB</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-success font-semibold bg-success/15 px-3 py-1 rounded-full border border-success/20 shadow-inner" title="Connected to local SQLite database">
              <HardDrive className="w-3.5 h-3.5 text-success" />
              <span>Local DB</span>
            </div>
          )}
          
          <span className="text-border/60 font-light">|</span>

          <div className="flex items-center space-x-3.5">
            <div className="flex items-center space-x-1.5 bg-primary/15 border border-primary/25 text-primaryHover px-2.5 py-1 rounded-full font-extrabold text-[10px] tracking-wider uppercase select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>{activeProfile}</span>
            </div>
            {onToggleChat && (
              <button 
                onClick={onToggleChat}
                className="hover:text-textMain transition-all hover:scale-105"
                title="Toggle Studio Chat"
              >
                <MessageSquare className="w-4 h-4 text-textMuted hover:text-textMain" />
              </button>
            )}
            <button 
              onClick={() => setShowSettings(true)}
              className="hover:text-textMain transition-all hover:scale-105"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-textMuted hover:text-textMain" />
            </button>
          </div>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

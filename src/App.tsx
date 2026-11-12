import { useState, useEffect } from "react";
import AppShell from "./components/layout/AppShell";
import StepWorkspace from "./components/workflow/StepWorkspace";
import DebugPanel from "./components/workflow/DebugPanel";
import EpisodeDashboard from "./components/episode/EpisodeDashboard";
import EpisodeCreateForm from "./components/episode/EpisodeCreateForm";
import PromptLibrary from "./components/prompts/PromptLibrary";
import { useWorkflow } from "./hooks/useWorkflow";
import "./index.css";

const PROJECT_ID = 'proj_default';

type AppView = 'dashboard' | 'workspace' | 'prompts';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [prefilledTitle, setPrefilledTitle] = useState('');
  const [prefilledTopic, setPrefilledTopic] = useState('');
  const [prefilledChannelId, setPrefilledChannelId] = useState<string | undefined>(undefined);
  const [showDebug, setShowDebug] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Ctrl+Shift+D toggles debug panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { 
    isInitializing, 
    initError,
    activeStep, 
    stepStates, 
    activeArtifact,
    artifactVersions,
    activeTemplate,
    renderedPrompt,
    humanNotes,
    finalThesis,
    narratorMode,
    activeEpisode,
    handleVersionSelect,
    handleSaveTemplate,
    handleSaveHumanNotes,
    handleUpdateEpisode,
    handleStepChange, 
    handleAction,
    refreshState
  } = useWorkflow(currentEpisodeId);

  const handleEpisodeCreated = (episodeId: string) => {
    setShowCreateEpisode(false);
    setCurrentEpisodeId(episodeId);
    setCurrentView('workspace');
  };

  const handleSelectEpisode = (episodeId: string) => {
    setCurrentEpisodeId(episodeId);
    setCurrentView('workspace');
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center text-primary font-medium">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Initializing Local Workspace...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center text-danger font-medium p-6">
        <div className="flex flex-col items-center space-y-4 max-w-lg text-center bg-danger/10 border border-danger/30 p-6 rounded-lg">
          <p className="text-lg font-semibold">Database Initialization Failed</p>
          <p className="text-sm opacity-80">{initError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-danger text-white rounded text-sm hover:bg-danger/80 transition-colors">
            Retry Launch
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell 
        activeStepNumber={activeStep} 
        onStepChange={handleStepChange}
        stepStates={stepStates}
        currentView={currentView}
        onViewChange={setCurrentView}
        currentEpisodeId={currentEpisodeId}
        onEpisodeChange={handleSelectEpisode}
        projectId={PROJECT_ID}
        showBottomNav={currentView === 'workspace' && !!currentEpisodeId}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      >
        {currentView === 'dashboard' ? (
          <EpisodeDashboard
            projectId={PROJECT_ID}
            currentEpisodeId={currentEpisodeId}
            onSelectEpisode={handleSelectEpisode}
            onCreateEpisode={(title, topic, channelId) => {
              if (title || topic || channelId) {
                setPrefilledTitle(title || '');
                setPrefilledTopic(topic || '');
                setPrefilledChannelId(channelId);
              }
              setShowCreateEpisode(true);
            }}
          />
        ) : currentView === 'prompts' ? (
          <PromptLibrary />
        ) : currentEpisodeId ? (
          <div className="flex flex-col h-full w-full">
            {/* Debug Panel — Ctrl+Shift+D */}
            {showDebug && (
              <div className="shrink-0 px-2 pt-2">
                <DebugPanel 
                  episodeId={currentEpisodeId}
                  activeStep={activeStep}
                  uiStepState={stepStates[activeStep] || 'blocked'}
                  onRefresh={refreshState}
                />
              </div>
            )}

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden">
              <StepWorkspace 
                episodeId={currentEpisodeId}
                stepNumber={activeStep} 
                stepState={stepStates[activeStep] || 'blocked'}
                activeArtifact={activeArtifact}
                artifactVersions={artifactVersions}
                activeTemplate={activeTemplate}
                renderedPrompt={renderedPrompt}
                humanNotes={humanNotes}
                finalThesis={finalThesis}
                narratorMode={narratorMode}
                activeEpisode={activeEpisode}
                onVersionSelect={handleVersionSelect}
                onSaveTemplate={handleSaveTemplate}
                onSaveHumanNotes={handleSaveHumanNotes}
                onUpdateEpisode={handleUpdateEpisode}
                onAction={(action, content) => handleAction(activeStep, action, content)} 
                onStepChange={handleStepChange}
                stepStates={stepStates}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-textMuted">
            <p>Select an episode from the Dashboard to begin.</p>
          </div>
        )}
      </AppShell>

      {showCreateEpisode && (
        <EpisodeCreateForm
          projectId={PROJECT_ID}
          onClose={() => {
            setShowCreateEpisode(false);
            setPrefilledTitle('');
            setPrefilledTopic('');
            setPrefilledChannelId(undefined);
          }}
          onCreated={handleEpisodeCreated}
          initialTitle={prefilledTitle}
          initialTopic={prefilledTopic}
          initialChannelId={prefilledChannelId}
        />
      )}
    </>
  );
}

export default App;

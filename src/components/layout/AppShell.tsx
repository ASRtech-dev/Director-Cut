import { ReactNode } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import ChatSidebar from "../chat/ChatSidebar";
import { WorkflowState } from "../../types";

type AppView = 'dashboard' | 'workspace' | 'prompts';

interface AppShellProps {
  children: ReactNode;
  activeStepNumber?: number;
  onStepChange?: (stepId: number) => void;
  stepStates?: Record<number, WorkflowState>;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  currentEpisodeId?: string | null;
  onEpisodeChange: (episodeId: string) => void;
  projectId: string;
  showBottomNav?: boolean;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export default function AppShell({ 
  children, activeStepNumber = 1, onStepChange, stepStates = {},
  currentView, onViewChange, currentEpisodeId, onEpisodeChange, projectId,
  showBottomNav = true, isChatOpen, onToggleChat
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopBar 
        currentView={currentView} 
        onViewChange={onViewChange}
        currentEpisodeId={currentEpisodeId}
        onEpisodeChange={onEpisodeChange}
        projectId={projectId}
        onToggleChat={onToggleChat}
      />
      <main className="flex-1 flex overflow-hidden relative">
        {children}
        <ChatSidebar isOpen={isChatOpen} onClose={onToggleChat} />
      </main>
      {showBottomNav && currentView === 'workspace' && onStepChange && (
        <BottomNav 
          activeStepNumber={activeStepNumber} 
          onStepChange={onStepChange}
          stepStates={stepStates}
        />
      )}
    </div>
  );
}

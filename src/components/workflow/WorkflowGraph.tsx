import { STEPS } from "../../config/steps";
import { Lock, Check, AlertCircle, Play, Sparkles } from "lucide-react";

interface WorkflowGraphProps {
  activeStepNumber: number;
  onStepChange?: (stepId: number) => void;
  stepStates: Record<number, string>;
}

const PHASES = [
  { name: "Phase 1: Creative & Prep", range: [1, 4] },
  { name: "Phase 2: Drafting & Polish", range: [5, 8] },
  { name: "Phase 3: Sound & Visual Design", range: [9, 12] },
  { name: "Phase 4: Sourcing & Publishing", range: [13, 16] },
];

export default function WorkflowGraph({ activeStepNumber, onStepChange, stepStates }: WorkflowGraphProps) {
  
  const getStatusStyle = (state: string, isActive: boolean) => {
    switch (state) {
      case 'approved':
        return {
          cardClass: `border-success/30 bg-success/5 text-success hover:bg-success/10 ${isActive ? 'ring-2 ring-success' : ''}`,
          badgeClass: "bg-success/20 text-success border border-success/30",
          iconColor: "text-success",
          statusText: "Approved"
        };
      case 'awaiting_review':
        return {
          cardClass: `border-warning/45 bg-warning/5 text-warning hover:bg-warning/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse ${isActive ? 'ring-2 ring-warning' : ''}`,
          badgeClass: "bg-warning/20 text-warning border border-warning/35",
          iconColor: "text-warning",
          statusText: "Review"
        };
      case 'ready':
        return {
          cardClass: `border-primary/30 bg-primary/5 text-textMain hover:bg-primary/10 ${isActive ? 'ring-2 ring-primary' : ''}`,
          badgeClass: "bg-primary/20 text-primary border border-primary/30",
          iconColor: "text-primary",
          statusText: "Ready"
        };
      case 'running':
        return {
          cardClass: `border-info/40 bg-info/5 text-info hover:bg-info/10 animate-pulse ${isActive ? 'ring-2 ring-info' : ''}`,
          badgeClass: "bg-info/20 text-info border border-info/30",
          iconColor: "text-info",
          statusText: "Running"
        };
      case 'blocked':
      default:
        return {
          cardClass: "border-border/40 bg-surface/30 text-textMuted opacity-45 cursor-not-allowed",
          badgeClass: "bg-border/20 text-textMuted border border-border/10",
          iconColor: "text-textMuted/40",
          statusText: "Locked"
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar p-1">
      <div className="border-b border-border pb-3 shrink-0">
        <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
          Interactive Production Roadmap
        </h3>
        <p className="text-xs text-textMuted mt-0.5">
          Visual workflow mapping of this episode's 16 production milestones. Click any unlocked step card to jump straight into its workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 min-h-[400px]">
        {PHASES.map((phase) => {
          const phaseSteps = STEPS.filter(
            (s) => s.id >= phase.range[0] && s.id <= phase.range[1]
          );

          return (
            <div key={phase.name} className="flex flex-col space-y-3 bg-surface/30 p-4 rounded-2xl border border-border/50 backdrop-blur-md">
              <h4 className="text-xs font-black text-textMuted uppercase tracking-wider mb-1">
                {phase.name}
              </h4>
              
              <div className="flex flex-col space-y-3 flex-1">
                {phaseSteps.map((step) => {
                  const Icon = step.icon;
                  const state = stepStates[step.id] || 'blocked';
                  const isActive = step.id === activeStepNumber;
                  const isBlocked = state === 'blocked';
                  const style = getStatusStyle(state, isActive);

                  return (
                    <button
                      key={step.id}
                      disabled={isBlocked}
                      onClick={() => onStepChange?.(step.id)}
                      className={`w-full flex items-center space-x-3.5 p-3 rounded-xl border text-left transition-all duration-300 relative group select-none ${style.cardClass} ${
                        !isBlocked ? 'cursor-pointer hover:-translate-y-0.5 shadow-sm hover:shadow-md' : ''
                      }`}
                    >
                      {/* Step Number Badge */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-black text-xs ${style.badgeClass}`}>
                        {step.id.toString().padStart(2, '0')}
                      </div>

                      {/* Info block */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-bold text-xs truncate text-textMain group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
                          {step.label}
                        </div>
                        <p className="text-[10px] text-textMuted truncate mt-0.5">
                          {step.description}
                        </p>
                      </div>

                      {/* Icon overlay badge */}
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {state === 'approved' && (
                          <div className="bg-success/20 p-1 rounded-full border border-success/30">
                            <Check className="w-3 h-3 text-success stroke-[3px]" />
                          </div>
                        )}
                        {state === 'awaiting_review' && (
                          <div className="bg-warning/20 p-1 rounded-full border border-warning/35">
                            <AlertCircle className="w-3 h-3 text-warning" />
                          </div>
                        )}
                        {state === 'ready' && (
                          <div className="bg-primary/20 p-1 rounded-full border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-2.5 h-2.5 fill-primary text-primary" />
                          </div>
                        )}
                        {isBlocked && (
                          <Lock className="w-3 h-3 text-textMuted/40" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend Footer */}
      <div className="bg-surface/50 border border-border/80 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold text-textMuted mt-auto shrink-0">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success"></span> Approved</span>
        <span className="flex items-center gap-1.5 animate-pulse"><span className="w-2.5 h-2.5 rounded-full bg-warning"></span> Awaiting Review</span>
        <span className="flex items-center gap-1.5 animate-pulse"><span className="w-2.5 h-2.5 rounded-full bg-info"></span> Processing</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Ready to Run</span>
        <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-textMuted/50" /> Locked Steps</span>
      </div>
    </div>
  );
}

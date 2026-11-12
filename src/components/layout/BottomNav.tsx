import { STEPS } from "../../config/steps";

function StateIndicator({ state }: { state: string }) {
  switch(state) {
    case 'approved': 
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/40 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success border-2 border-surface"></span>
        </span>
      );
    case 'awaiting_review': 
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-warning/50 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-warning border-2 border-surface"></span>
        </span>
      );
    case 'ready': 
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-surface"></span>
        </span>
      );
    case 'blocked': 
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-textMuted/30 border border-surface"></span>
        </span>
      );
    default: 
      return null;
  }
}

interface BottomNavProps {
  activeStepNumber: number;
  onStepChange: (stepId: number) => void;
  stepStates: Record<number, string>;
}

export default function BottomNav({ activeStepNumber, onStepChange, stepStates }: BottomNavProps) {
  return (
    <footer className="h-24 border-t border-border/80 bg-surface/90 backdrop-blur-md flex items-center justify-center shrink-0 px-6 py-2 shadow-2xl z-20 transition-all duration-300">
      <div className="flex items-center space-x-1.5 w-full max-w-7xl justify-between overflow-x-auto no-scrollbar py-1">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === activeStepNumber;
          const state = stepStates[step.id] || 'blocked';
          const isDisabled = state === 'blocked';
          
          return (
            <button 
              key={step.id}
              onClick={() => onStepChange(step.id)}
              disabled={isDisabled}
              className={`flex flex-col items-center justify-center min-w-16 w-16 h-18 rounded-xl transition-all duration-300 relative ${
                isActive 
                  ? 'bg-primary text-white scale-105 border border-primary/30 shadow-lg shadow-primary/20 font-bold z-10' 
                  : isDisabled 
                  ? 'text-textMuted/30 cursor-not-allowed opacity-35' 
                  : 'text-textMuted hover:bg-surfaceHighlight/60 hover:text-textMain hover:scale-102 hover:shadow-sm'
              }`}
            >
              <div className="relative mb-1">
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'text-textMuted/80'}`} />
                <StateIndicator state={state} />
              </div>
              
              <span className="text-[9px] font-extrabold tracking-wider uppercase opacity-85 mb-0.5">
                {step.id < 10 ? `0${step.id}` : step.id}
              </span>
              <span className="text-[9px] font-semibold tracking-tight text-center leading-none max-w-full truncate px-1">
                {step.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </footer>
  );
}

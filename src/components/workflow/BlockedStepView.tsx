import { Lock, AlertTriangle } from "lucide-react";
import { STEPS } from "../../config/steps";

interface BlockedStepViewProps {
  stepNumber: number;
  missingDependencies?: string[];
}

export default function BlockedStepView({ stepNumber, missingDependencies = [] }: BlockedStepViewProps) {
  const isMvpStep = stepNumber <= 5;
  const stepConfig = STEPS.find(s => s.id === stepNumber);
  const StepIcon = stepConfig?.icon || Lock;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
      <div className="w-20 h-20 rounded-full bg-border/20 flex items-center justify-center mb-6">
        <StepIcon className="w-10 h-10 text-textMuted/40" />
      </div>

      <h2 className="text-xl font-bold text-textMain mb-2">
        Step {stepNumber.toString().padStart(2, '0')} — {stepConfig?.label || 'Unknown'}
      </h2>
      <p className="text-sm text-textMuted mb-6 max-w-md">{stepConfig?.description}</p>

      {!isMvpStep ? (
        <>
          <div className="bg-info/10 border border-info/30 rounded-lg p-4 max-w-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-info">Planned for a later implementation phase</p>
                <p className="text-xs text-info/80 mt-1">
                  This step is visible in the workflow navigation but is not yet executable in the MVP. 
                  Complete Steps 01–05 first.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 max-w-lg mb-6">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-warning">This step is blocked</p>
                <p className="text-xs text-warning/80 mt-1">
                  Complete and approve the required upstream steps to unlock this step.
                </p>
              </div>
            </div>
          </div>

          {missingDependencies.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4 max-w-lg">
              <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3">Missing Dependencies</h3>
              <ul className="space-y-2 text-left">
                {missingDependencies.map((dep, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm text-danger">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger"></div>
                    <span>{dep}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

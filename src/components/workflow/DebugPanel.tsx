import { useState } from 'react';
import { Bug, RefreshCw, Wrench, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { runStepDiagnostic, repairStep01, createTestCandidate, DiagnosticResult } from '../../lib/debug-workflow';

interface DebugPanelProps {
  episodeId: string;
  activeStep: number;
  uiStepState: string;
  onRefresh: () => void;
}

export default function DebugPanel({ episodeId, activeStep, uiStepState, onRefresh }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [repairResult, setRepairResult] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<string[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setRepairResult(null);
    setTestLog(null);
    try {
      const result = await runStepDiagnostic(episodeId, activeStep);
      setDiagnostic(result);
    } catch (e: any) {
      console.error('Diagnostic failed:', e);
    }
    setIsRunning(false);
  };

  const handleRepair = async () => {
    setIsRunning(true);
    try {
      const msg = await repairStep01(episodeId);
      setRepairResult(msg);
      onRefresh();
    } catch (e: any) {
      setRepairResult(`ERROR: ${e.message}`);
    }
    setIsRunning(false);
  };

  const handleTestCandidate = async () => {
    setIsRunning(true);
    try {
      const log = await createTestCandidate(episodeId);
      setTestLog(log);
      onRefresh();
    } catch (e: any) {
      setTestLog([`FATAL: ${e.message}`]);
    }
    setIsRunning(false);
  };

  return (
    <div className="border border-warning/50 rounded-lg bg-warning/5 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-warning hover:bg-warning/10 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4" />
          <span className="text-sm font-medium">Debug Workflow Panel</span>
          <span className="text-xs opacity-70">Step {activeStep} | UI State: {uiStepState}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button 
              onClick={runDiagnostic}
              disabled={isRunning}
              className="flex items-center space-x-1 bg-warning/20 border border-warning/40 text-warning px-3 py-1.5 rounded text-xs font-medium hover:bg-warning/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Run Step {activeStep} Diagnostic</span>
            </button>
            <button 
              onClick={handleRepair}
              disabled={isRunning}
              className="flex items-center space-x-1 bg-primary/20 border border-primary/40 text-primary px-3 py-1.5 rounded text-xs font-medium hover:bg-primary/30 disabled:opacity-50"
            >
              <Wrench className="w-3 h-3" />
              <span>Repair Step 01</span>
            </button>
            <button 
              onClick={handleTestCandidate}
              disabled={isRunning}
              className="flex items-center space-x-1 bg-success/20 border border-success/40 text-success px-3 py-1.5 rounded text-xs font-medium hover:bg-success/30 disabled:opacity-50"
            >
              <FlaskConical className="w-3 h-3" />
              <span>Create Test Candidate for Step 01</span>
            </button>
          </div>

          {/* Repair Result */}
          {repairResult && (
            <div className={`text-xs font-mono p-2 rounded ${repairResult.includes('ERROR') || repairResult.includes('FAILED') ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              {repairResult}
            </div>
          )}

          {/* Test Candidate Log */}
          {testLog && (
            <div className="bg-background border border-border rounded p-2 max-h-64 overflow-y-auto">
              <h4 className="text-xs font-semibold text-warning mb-1">Test Candidate Log:</h4>
              {testLog.map((line, i) => (
                <div 
                  key={i} 
                  className={`text-xs font-mono ${
                    line.includes('FATAL') || line.includes('FAILED') ? 'text-danger' : 
                    line.includes('COMPLETE') || line.includes('OK') ? 'text-success' : 'text-textMuted'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Diagnostic Results */}
          {diagnostic && (
            <div className="bg-background border border-border rounded p-3 space-y-2 text-xs font-mono">
              <h4 className="text-sm font-semibold text-warning mb-2">Diagnostic Results</h4>
              
              <Section title="Database">
                <Row label="Connection" value={diagnostic.dbConnectionOk ? '✅ OK' : '❌ FAILED'} ok={diagnostic.dbConnectionOk} />
                <Row label="Total Step Runs" value={String(diagnostic.totalStepRunsInDb)} ok={diagnostic.totalStepRunsInDb === 16} />
              </Section>

              <Section title="Paths">
                <Row label="DB (AppConfig)" value={diagnostic.appConfigPath || 'unknown'} />
                <Row label="Snapshots (AppLocalData)" value={diagnostic.appLocalDataPath || 'unknown'} />
              </Section>

              <Section title="All Step States">
                <div className="text-[10px] text-textMuted break-all">
                  {diagnostic.allStepStates.length > 0 ? diagnostic.allStepStates.join(' | ') : 'NONE — DB has no step runs!'}
                </div>
              </Section>

              <Section title={`Step ${diagnostic.stepNumber} Run`}>
                <Row label="step_run_id" value={diagnostic.stepRunId || 'NOT FOUND'} ok={!!diagnostic.stepRunId} />
                <Row label="DB State" value={diagnostic.stepRunState || 'N/A'} ok={diagnostic.stepRunState !== 'blocked'} />
                <Row label="UI State" value={uiStepState} ok={uiStepState !== 'blocked'} />
                <Row label="State Match" value={diagnostic.stepRunState === uiStepState ? '✅ Match' : `❌ MISMATCH (DB=${diagnostic.stepRunState}, UI=${uiStepState})`} ok={diagnostic.stepRunState === uiStepState} />
                <Row label="step_definition_id" value={diagnostic.stepDefinitionId || 'N/A'} />
                <Row label="step_key" value={diagnostic.stepKey || 'N/A'} />
                <Row label="selected_version_id" value={diagnostic.selectedArtifactVersionId || 'none'} />
              </Section>

              <Section title="Dependencies">
                <Row label="Count" value={String(diagnostic.dependencyCount)} ok={diagnostic.stepNumber === 1 ? diagnostic.dependencyCount === 0 : true} />
                {diagnostic.dependencyDetails.map((d, i) => (
                  <div key={i} className="text-textMuted pl-2">→ {d}</div>
                ))}
                {diagnostic.dependencyCount === 0 && <div className="text-success">No dependencies — this step should never be blocked.</div>}
              </Section>

              <Section title="Artifacts">
                <Row label="Count" value={String(diagnostic.artifactCount)} />
                {diagnostic.artifactIds.map(id => (
                  <div key={id} className="text-textMuted pl-2">→ {id}</div>
                ))}
              </Section>

              <Section title="Artifact Versions">
                <Row label="Count" value={String(diagnostic.artifactVersionCount)} />
                {diagnostic.artifactVersionDetails.map(v => (
                  <div key={v.id} className="text-textMuted pl-2">
                    → v{v.version} [{v.status}] id={v.id} path={v.path}
                  </div>
                ))}
              </Section>

              <Section title="Snapshot">
                <Row label="Path" value={diagnostic.latestSnapshotPath || 'none'} />
                <Row label="File Exists" value={diagnostic.snapshotFileExists === null ? 'N/A' : diagnostic.snapshotFileExists ? '✅ Yes' : '❌ No'} ok={diagnostic.snapshotFileExists === true} />
                <Row label="Read Success" value={diagnostic.snapshotReadSuccess === null ? 'N/A' : diagnostic.snapshotReadSuccess ? '✅ Yes' : '❌ No'} ok={diagnostic.snapshotReadSuccess === true} />
                {diagnostic.snapshotContentPreview && (
                  <div className="text-textMuted pl-2 break-all">Preview: "{diagnostic.snapshotContentPreview}"</div>
                )}
                {diagnostic.snapshotReadError && (
                  <div className="text-danger pl-2">Error: {diagnostic.snapshotReadError}</div>
                )}
              </Section>

              {diagnostic.errors.length > 0 && (
                <Section title="Errors">
                  {diagnostic.errors.map((e, i) => (
                    <div key={i} className="text-danger">❌ {e}</div>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border/50 pt-1">
      <div className="text-warning text-[10px] font-bold uppercase tracking-wider mb-1">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-textMuted shrink-0">{label}:</span>
      <span className={`text-right break-all ${ok === false ? 'text-danger font-bold' : ok === true ? 'text-success' : 'text-textMain'}`}>{value}</span>
    </div>
  );
}

import { useState } from "react";
import { Save, TerminalSquare, AlertCircle } from "lucide-react";
import { RenderedPromptResult } from "../../lib/prompt-engine";

interface ManualPasteModeProps {
  renderedPrompt?: RenderedPromptResult | null;
  onSave: (content: string) => void;
}

export default function ManualPasteMode({ renderedPrompt, onSave }: ManualPasteModeProps) {
  const [content, setContent] = useState("");
  
  const unresolved = renderedPrompt?.unresolvedPlaceholders || [];
  const hasUnresolved = unresolved.length > 0;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      <div className="flex items-center space-x-3 mb-4">
        <TerminalSquare className="w-5 h-5 text-textMuted" />
        <h3 className="text-lg font-medium">Manual Paste Mode</h3>
      </div>
      
      {hasUnresolved && (
        <div className="bg-danger/10 border border-danger/30 rounded p-3 mb-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-danger mb-1">Cannot Generate Yet</h4>
            <p className="text-xs text-danger/80">
              The prompt for this step has unresolved dependencies ({unresolved.map(u => `[${u}]`).join(', ')}). 
              You must complete and approve upstream steps before you can save a candidate here.
            </p>
          </div>
        </div>
      )}

      {!hasUnresolved && renderedPrompt && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2 text-textMuted">Rendered Prompt (Copy this to your AI)</h4>
          <div className="bg-surface border border-border rounded p-4 text-xs font-mono text-textMuted whitespace-pre-wrap max-h-48 overflow-y-auto">
            {renderedPrompt.renderedText}
          </div>
        </div>
      )}

      <p className="text-sm text-textMuted mb-2">
        Paste the output from your external AI provider here. 
      </p>

      <textarea 
        className="flex-1 w-full bg-surface border border-border rounded-lg p-4 text-sm font-mono focus:border-primary outline-none resize-none text-textMain"
        placeholder={hasUnresolved ? "Waiting for upstream dependencies..." : "Paste generated output here..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={hasUnresolved}
      />

      <div className="flex justify-end mt-4">
        <button 
          onClick={() => onSave(content)}
          disabled={!content.trim() || hasUnresolved}
          className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded font-medium hover:bg-primaryHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>Save as Candidate</span>
        </button>
      </div>
    </div>
  );
}

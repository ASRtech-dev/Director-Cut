import { useState, useEffect } from "react";
import { Sparkles, AlertCircle, Save, Loader2, Play } from "lucide-react";
import { RenderedPromptResult } from "../../lib/prompt-engine";
import { generateCompletion } from "../../lib/llm-service";
import { getSetting, saveSetting } from "../../lib/settings-service";

interface AIGeneratorModeProps {
  renderedPrompt?: RenderedPromptResult | null;
  onSave: (content: string) => void;
  stepNumber: number;
}

const PROVIDER_MODELS: Record<'openai' | 'gemini' | 'deepseek' | 'kimi' | 'qwen', string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview", "o1-mini"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  qwen: ["qwen3-235b-a22b", "qwen3-32b", "qwen3-14b", "qwen3-8b", "qwen3-4b", "qwen3-1.7b", "qwen3-0.6b", "qwen-plus", "qwen-max", "qwen-turbo", "qwen2.5-72b-instruct", "qwen2.5-32b-instruct", "qwen2.5-14b-instruct", "qwen2.5-7b-instruct"]
};

export default function AIGeneratorMode({ renderedPrompt, onSave, stepNumber }: AIGeneratorModeProps) {
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'deepseek' | 'kimi' | 'qwen'>('openai');
  const [modelName, setModelName] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [tokenUsage, setTokenUsage] = useState<{ input?: number; output?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unresolved = renderedPrompt?.unresolvedPlaceholders || [];
  const hasUnresolved = unresolved.length > 0;

  // Load step-specific defaults on mount or step change
  useEffect(() => {
    async function loadStepSettings() {
      setError(null);
      const stepProvider = await getSetting(`step_${stepNumber}_provider`);
      const stepModel = await getSetting(`step_${stepNumber}_model`);

      if (stepProvider) {
        setProvider(stepProvider as any);
        if (stepModel) {
          setModelName(stepModel);
          const defaultModels = PROVIDER_MODELS[stepProvider as keyof typeof PROVIDER_MODELS] || [];
          const isCustom = !defaultModels.includes(stepModel);
          setIsCustomModel(isCustom);
          if (isCustom) {
            setCustomModelText(stepModel);
          }
        }
      } else {
        // Fallback to OpenAI defaults if no step-specific settings
        setProvider('openai');
        const defaultModel = await getSetting("openai_model") || "gpt-4o";
        setModelName(defaultModel);
        setIsCustomModel(false);
      }
    }
    loadStepSettings();
  }, [stepNumber]);

  // Check API keys when provider changes
  useEffect(() => {
    async function checkSettings() {
      let key = "";
      if (provider === 'openai') {
        key = await getSetting("openai_api_key") || "";
      } else if (provider === 'gemini') {
        key = await getSetting("gemini_api_key") || "";
      } else if (provider === 'deepseek') {
        key = await getSetting("deepseek_api_key") || "";
      } else if (provider === 'kimi') {
        key = await getSetting("kimi_api_key") || "";
      } else if (provider === 'qwen') {
        key = await getSetting("qwen_api_key") || "";
      }
      setIsKeyConfigured(!!key);
    }
    checkSettings();
  }, [provider]);

  const handleProviderChange = async (newProv: 'openai' | 'gemini' | 'deepseek' | 'kimi' | 'qwen') => {
    setProvider(newProv);
    await saveSetting(`step_${stepNumber}_provider`, newProv);

    let model = "";
    if (newProv === 'openai') model = await getSetting("openai_model") || "gpt-4o";
    else if (newProv === 'gemini') model = await getSetting("gemini_model") || "gemini-1.5-pro";
    else if (newProv === 'deepseek') model = await getSetting("deepseek_model") || "deepseek-chat";
    else if (newProv === 'kimi') model = await getSetting("kimi_model") || "moonshot-v1-8k";
    else if (newProv === 'qwen') model = await getSetting("qwen_model") || "qwen-plus";

    setModelName(model);
    await saveSetting(`step_${stepNumber}_model`, model);

    const defaultModels = PROVIDER_MODELS[newProv] || [];
    const isCustom = model ? !defaultModels.includes(model) : false;
    setIsCustomModel(isCustom);
    if (isCustom) {
      setCustomModelText(model);
    }
  };

  const handleModelChange = async (val: string) => {
    if (val === 'custom') {
      setIsCustomModel(true);
      const initialCustom = customModelText || PROVIDER_MODELS[provider][0];
      setCustomModelText(initialCustom);
      setModelName(initialCustom);
      await saveSetting(`step_${stepNumber}_model`, initialCustom);
    } else {
      setIsCustomModel(false);
      setModelName(val);
      await saveSetting(`step_${stepNumber}_model`, val);
    }
  };

  const handleCustomModelTextChange = async (text: string) => {
    setCustomModelText(text);
    setModelName(text);
    await saveSetting(`step_${stepNumber}_model`, text);
  };

  const handleGenerate = async () => {
    if (!renderedPrompt?.renderedText) return;
    setIsGenerating(true);
    setError(null);
    setTokenUsage(null);
    try {
      const response = await generateCompletion(provider, renderedPrompt.renderedText, modelName);
      setGeneratedText(response.text);
      if (response.inputTokens || response.outputTokens) {
        setTokenUsage({ input: response.inputTokens, output: response.outputTokens });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate text from LLM API.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider">AI Direct Execution</h3>
        </div>
        
        <div className="flex items-center space-x-3 text-xs">
          <label className="text-textMuted font-medium uppercase text-[10px]">Provider:</label>
          <select 
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as any)}
            disabled={isGenerating}
            className="bg-surface border border-border rounded px-2.5 py-1 font-medium focus:border-primary outline-none text-textMain"
          >
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="gemini">Google (Gemini)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="kimi">Kimi (Moonshot)</option>
            <option value="qwen">Qwen (AliCloud)</option>
          </select>

          <label className="text-textMuted font-medium uppercase text-[10px] ml-2">Model:</label>
          {isCustomModel ? (
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={customModelText}
                onChange={(e) => handleCustomModelTextChange(e.target.value)}
                disabled={isGenerating}
                placeholder="Enter model name..."
                className="bg-surface border border-border rounded px-2.5 py-1 font-mono text-[11px] focus:border-primary outline-none text-textMain w-36"
              />
              <button
                onClick={() => handleModelChange(PROVIDER_MODELS[provider][0])}
                disabled={isGenerating}
                className="text-textMuted hover:text-textMain px-2 py-1 rounded bg-surfaceHighlight border border-border/50 text-[10px]"
                title="Select from list"
              >
                Back
              </button>
            </div>
          ) : (
            <select
              value={modelName}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isGenerating}
              className="bg-surface border border-border rounded px-2.5 py-1 font-mono text-[11px] focus:border-primary outline-none text-textMain min-w-[120px]"
            >
              {PROVIDER_MODELS[provider]?.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
          )}
        </div>
      </div>

      {/* Warnings & Errors */}
      {hasUnresolved && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 flex items-start space-x-3 text-xs shrink-0">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-danger mb-1">Cannot Execute Yet</h4>
            <p className="text-danger/80">
              The prompt for this step has unresolved dependencies ({unresolved.map(u => `[${u}]`).join(', ')}). 
              You must complete and approve upstream steps before you can generate outputs.
            </p>
          </div>
        </div>
      )}

      {!hasUnresolved && !isKeyConfigured && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start space-x-3 text-xs shrink-0">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-warning mb-1">API Key Missing</h4>
            <p className="text-warning/80 text-left">
              You haven't configured your API key for {
                provider === 'openai' ? 'OpenAI' :
                provider === 'gemini' ? 'Gemini' :
                provider === 'deepseek' ? 'DeepSeek' :
                provider === 'kimi' ? 'Kimi' : 'Qwen'
              } yet. 
              Please click the <strong>Gear (Settings)</strong> icon in the top right, select the <strong>AI API Keys</strong> tab, enter your key, and click Save.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-xs text-danger font-mono whitespace-pre-wrap shrink-0">
          {error}
        </div>
      )}

      {/* Main Execution block */}
      {!hasUnresolved && (
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="flex flex-col items-center py-2 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isKeyConfigured}
              className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Candidates...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Run Prompt via API</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-textMuted mt-1.5 font-semibold">
              This will execute the template using your custom guidelines to generate a new candidate draft.
            </span>
          </div>

          {/* Result view */}
          <div className="flex-1 flex flex-col min-h-0 bg-surface border border-border rounded-lg p-4 relative">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">AI Generation Output</span>
              {tokenUsage && (
                <span className="text-[10px] text-success bg-success/15 px-2 py-0.5 rounded font-mono border border-success/30">
                  Usage: {tokenUsage.input ?? 0} in / {tokenUsage.output ?? 0} out
                </span>
              )}
            </div>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-textMuted p-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-center leading-relaxed">The LLM is processing the prompt. This may take 10-30 seconds depending on the prompt complexity.</p>
              </div>
            ) : generatedText ? (
              <textarea
                className="flex-1 w-full bg-background border border-border rounded p-3 text-xs font-mono focus:border-primary outline-none resize-none text-textMain overflow-y-auto"
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-textMuted text-xs font-mono">
                Click "Run Prompt via API" to start execution...
              </div>
            )}
          </div>

          {/* Action Footer */}
          {generatedText && !isGenerating && (
            <div className="flex justify-end shrink-0">
              <button
                onClick={() => onSave(generatedText)}
                className="flex items-center space-x-2 bg-success text-white px-6 py-2.5 rounded font-medium hover:bg-success/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save as Candidate Version</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

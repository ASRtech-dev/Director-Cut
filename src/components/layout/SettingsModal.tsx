import { useState, useEffect } from "react";
import { X, CheckCircle, Database, AlertTriangle, Key, Cloud, Lock, Users } from "lucide-react";
import { importSeedPrompts } from "../../lib/prompt-seed";
import { resetDatabase } from "../../lib/database";
import { getSetting, saveSetting } from "../../lib/settings-service";
import { testConnection } from "../../lib/llm-service";
import { getOAuthUrl, exchangeAuthCode, disconnectDrive } from "../../lib/drive-service";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'gdrive' | 'database' | 'sync'>('api');
  
  // Sync States
  const [activeProfile, setActiveProfile] = useState('Mina');
  const [serverSyncEnabled, setServerSyncEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:5000');
  const [syncConnectionStatus, setSyncConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [giphyApiKey, setGiphyApiKey] = useState('');
  
  // API states
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-pro');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat');
  const [kimiKey, setKimiKey] = useState('');
  const [kimiModel, setKimiModel] = useState('moonshot-v1-8k');
  const [qwenKey, setQwenKey] = useState('');
  const [qwenModel, setQwenModel] = useState('qwen-plus');
  
  // Google Drive states
  const [gdriveClientId, setGdriveClientId] = useState('');
  const [gdriveClientSecret, setGdriveClientSecret] = useState('');
  const [gdriveRedirectUri, setGdriveRedirectUri] = useState('http://localhost:14200');
  const [gdriveAuthCode, setGdriveAuthCode] = useState('');
  const [gdriveFolderId, setGdriveFolderId] = useState('');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  
  // Status states
  const [openaiTestStatus, setOpenaiTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [geminiTestStatus, setGeminiTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [deepseekTestStatus, setDeepseekTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [kimiTestStatus, setKimiTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [qwenTestStatus, setQwenTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [qwenError, setQwenError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Existing states
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    async function load() {
      const oKey = await getSetting("openai_api_key") || "";
      const oModel = await getSetting("openai_model") || "gpt-4o";
      const gKey = await getSetting("gemini_api_key") || "";
      const gModel = await getSetting("gemini_model") || "gemini-1.5-pro";
      const dKey = await getSetting("deepseek_api_key") || "";
      const dModel = await getSetting("deepseek_model") || "deepseek-chat";
      const kKey = await getSetting("kimi_api_key") || "";
      const kModel = await getSetting("kimi_model") || "moonshot-v1-8k";
      const qKey = await getSetting("qwen_api_key") || "";
      const qModel = await getSetting("qwen_model") || "qwen-plus";
      
      const dClientId = await getSetting("gdrive_client_id") || "";
      const dClientSecret = await getSetting("gdrive_client_secret") || "";
      const dRedirectUri = await getSetting("gdrive_redirect_uri") || "http://localhost:14200";
      const dFolderId = await getSetting("gdrive_root_folder_id") || "";
      const dToken = await getSetting("gdrive_access_token") || "";

      setOpenaiKey(oKey);
      setOpenaiModel(oModel);
      setGeminiKey(gKey);
      setGeminiModel(gModel);
      setDeepseekKey(dKey);
      setDeepseekModel(dModel);
      setKimiKey(kKey);
      setKimiModel(kModel);
      setQwenKey(qKey);
      setQwenModel(qModel);
      setGdriveClientId(dClientId);
      setGdriveClientSecret(dClientSecret);
      setGdriveRedirectUri(dRedirectUri);
      setGdriveFolderId(dFolderId);
      setIsDriveConnected(!!dToken);

      const prof = localStorage.getItem('activeProfile') || 'Mina';
      const syncOn = localStorage.getItem('serverSyncEnabled') === 'true';
      const sUrl = localStorage.getItem('serverUrl') || 'http://localhost:5000';
      const gApiKey = localStorage.getItem('giphyApiKey') || '';
      setActiveProfile(prof);
      setServerSyncEnabled(syncOn);
      setServerUrl(sUrl);
      setGiphyApiKey(gApiKey);
    }
    load();
  }, []);

  const handleSaveSync = async () => {
    setError(null);
    setSaveSuccess(false);
    try {
      localStorage.setItem('activeProfile', activeProfile);
      localStorage.setItem('serverSyncEnabled', serverSyncEnabled ? 'true' : 'false');
      localStorage.setItem('serverUrl', serverUrl);
      localStorage.setItem('giphyApiKey', giphyApiKey);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      setError(e.message || "Failed to save sync preferences.");
    }
  };

  const handleTestSyncConnection = async () => {
    setSyncConnectionStatus('testing');
    try {
      const normalizedUrl = serverUrl.replace(/\/$/, '');
      const res = await fetch(`${normalizedUrl}/api/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setSyncConnectionStatus('success');
          return;
        }
      }
      setSyncConnectionStatus('failed');
    } catch (e) {
      setSyncConnectionStatus('failed');
    }
  };

  const handleSaveAPIs = async () => {
    setError(null);
    setSaveSuccess(false);
    try {
      await saveSetting("openai_api_key", openaiKey);
      await saveSetting("openai_model", openaiModel);
      await saveSetting("gemini_api_key", geminiKey);
      await saveSetting("gemini_model", geminiModel);
      await saveSetting("deepseek_api_key", deepseekKey);
      await saveSetting("deepseek_model", deepseekModel);
      await saveSetting("kimi_api_key", kimiKey);
      await saveSetting("kimi_model", kimiModel);
      await saveSetting("qwen_api_key", qwenKey);
      await saveSetting("qwen_model", qwenModel);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || "Failed to save API settings.");
    }
  };

  const handleTestOpenAI = async () => {
    setOpenaiTestStatus('testing');
    const success = await testConnection('openai', openaiKey, openaiModel);
    setOpenaiTestStatus(success ? 'success' : 'failed');
  };

  const handleTestGemini = async () => {
    setGeminiTestStatus('testing');
    const success = await testConnection('gemini', geminiKey, geminiModel);
    setGeminiTestStatus(success ? 'success' : 'failed');
  };

  const handleTestDeepseek = async () => {
    setDeepseekTestStatus('testing');
    const success = await testConnection('deepseek', deepseekKey, deepseekModel);
    setDeepseekTestStatus(success ? 'success' : 'failed');
  };

  const handleTestKimi = async () => {
    setKimiTestStatus('testing');
    const success = await testConnection('kimi', kimiKey, kimiModel);
    setKimiTestStatus(success ? 'success' : 'failed');
  };

  const handleTestQwen = async () => {
    setQwenTestStatus('testing');
    setQwenError(null);
    try {
      const success = await testConnection('qwen', qwenKey, qwenModel);
      setQwenTestStatus(success ? 'success' : 'failed');
      if (!success) {
        setQwenError("Connection test failed: server returned false.");
      }
    } catch (e: any) {
      setQwenTestStatus('failed');
      setQwenError(e.message || "Connection test failed.");
    }
  };

  const handleConnectDrive = async () => {
    setError(null);
    if (!gdriveClientId || !gdriveClientSecret) {
      setError("Client ID and Client Secret are required to connect.");
      return;
    }
    
    // Save client info first
    await saveSetting("gdrive_client_id", gdriveClientId);
    await saveSetting("gdrive_client_secret", gdriveClientSecret);
    await saveSetting("gdrive_redirect_uri", gdriveRedirectUri);
    await saveSetting("gdrive_root_folder_id", gdriveFolderId);
    
    if (gdriveAuthCode) {
      try {
        await exchangeAuthCode(gdriveClientId, gdriveClientSecret, gdriveRedirectUri, gdriveAuthCode);
        setIsDriveConnected(true);
        setGdriveAuthCode("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (e: any) {
        setError(e.message || "OAuth Code exchange failed.");
      }
    } else {
      const url = getOAuthUrl(gdriveClientId, gdriveRedirectUri);
      window.open(url, '_blank');
      setError("Please authorize in your browser, copy the code, paste it below, and click Connect.");
    }
  };

  const handleDisconnectDrive = async () => {
    setError(null);
    try {
      await disconnectDrive();
      setIsDriveConnected(false);
      setGdriveAuthCode("");
    } catch (e: any) {
      setError(e.message || "Failed to disconnect Google Drive.");
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    try {
      const count = await importSeedPrompts();
      setImportSuccess(count);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setError(e.message || "Failed to import seed prompts.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      await resetDatabase();
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      setError(e.message || "Failed to reset database.");
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surfaceHighlight/40">
          <div>
            <h2 className="text-lg font-semibold text-textMain">Developer Settings</h2>
            <p className="text-xs text-textMuted mt-0.5">Configure APIs and storage preferences</p>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-surface px-6">
          <button
            onClick={() => { setActiveTab('api'); setError(null); }}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'api' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>AI API Keys</span>
          </button>
          <button
            onClick={() => { setActiveTab('gdrive'); setError(null); }}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'gdrive' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive</span>
          </button>
          <button
            onClick={() => { setActiveTab('database'); setError(null); }}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'database' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Local Database</span>
          </button>
          <button
            onClick={() => { setActiveTab('sync'); setError(null); }}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'sync' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sync & Profiles</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {activeTab === 'api' && (
            <div className="space-y-5">
              {/* OpenAI Section */}
              <div className="space-y-2 border-b border-border/50 pb-5">
                <h3 className="text-xs font-semibold text-textMain uppercase tracking-wider flex items-center space-x-2">
                  <span>OpenAI Configuration</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted uppercase font-medium">API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none text-textMain"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textMuted uppercase font-medium">Model</label>
                    <select
                      value={openaiModel}
                      onChange={e => setOpenaiModel(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2 py-1.5 text-sm focus:border-primary outline-none text-textMain"
                    >
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="o1-preview">o1-preview</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleTestOpenAI}
                    disabled={openaiTestStatus === 'testing'}
                    className="text-xs text-primary hover:text-primaryHover font-medium disabled:opacity-50"
                  >
                    {openaiTestStatus === 'testing' ? 'Testing...' : 
                     openaiTestStatus === 'success' ? '✓ Connection OK' :
                     openaiTestStatus === 'failed' ? '✗ Connection Failed' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Gemini Section */}
              <div className="space-y-2 border-b border-border/50 pb-5">
                <h3 className="text-xs font-semibold text-textMain uppercase tracking-wider flex items-center space-x-2">
                  <span>Gemini Configuration</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted uppercase font-medium">API Key</label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none text-textMain"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textMuted uppercase font-medium">Model</label>
                    <select
                      value={geminiModel}
                      onChange={e => setGeminiModel(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2 py-1.5 text-sm focus:border-primary outline-none text-textMain"
                    >
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleTestGemini}
                    disabled={geminiTestStatus === 'testing'}
                    className="text-xs text-primary hover:text-primaryHover font-medium disabled:opacity-50"
                  >
                    {geminiTestStatus === 'testing' ? 'Testing...' : 
                     geminiTestStatus === 'success' ? '✓ Connection OK' :
                     geminiTestStatus === 'failed' ? '✗ Connection Failed' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* DeepSeek Section */}
              <div className="space-y-2 border-b border-border/50 pb-5">
                <h3 className="text-xs font-semibold text-textMain uppercase tracking-wider flex items-center space-x-2">
                  <span>DeepSeek Configuration</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted uppercase font-medium">API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={deepseekKey}
                      onChange={e => setDeepseekKey(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none text-textMain"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textMuted uppercase font-medium">Model</label>
                    <select
                      value={deepseekModel}
                      onChange={e => setDeepseekModel(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2 py-1.5 text-sm focus:border-primary outline-none text-textMain"
                    >
                      <option value="deepseek-chat">deepseek-chat</option>
                      <option value="deepseek-reasoner">deepseek-reasoner</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleTestDeepseek}
                    disabled={deepseekTestStatus === 'testing'}
                    className="text-xs text-primary hover:text-primaryHover font-medium disabled:opacity-50"
                  >
                    {deepseekTestStatus === 'testing' ? 'Testing...' : 
                     deepseekTestStatus === 'success' ? '✓ Connection OK' :
                     deepseekTestStatus === 'failed' ? '✗ Connection Failed' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Kimi Section */}
              <div className="space-y-2 border-b border-border/50 pb-5">
                <h3 className="text-xs font-semibold text-textMain uppercase tracking-wider flex items-center space-x-2">
                  <span>Kimi Configuration</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted uppercase font-medium">API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={kimiKey}
                      onChange={e => setKimiKey(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none text-textMain"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textMuted uppercase font-medium">Model</label>
                    <select
                      value={kimiModel}
                      onChange={e => setKimiModel(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2 py-1.5 text-sm focus:border-primary outline-none text-textMain"
                    >
                      <option value="moonshot-v1-8k">moonshot-v1-8k</option>
                      <option value="moonshot-v1-32k">moonshot-v1-32k</option>
                      <option value="moonshot-v1-128k">moonshot-v1-128k</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleTestKimi}
                    disabled={kimiTestStatus === 'testing'}
                    className="text-xs text-primary hover:text-primaryHover font-medium disabled:opacity-50"
                  >
                    {kimiTestStatus === 'testing' ? 'Testing...' : 
                     kimiTestStatus === 'success' ? '✓ Connection OK' :
                     kimiTestStatus === 'failed' ? '✗ Connection Failed' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Qwen Section */}
              <div className="space-y-2 pb-2">
                <h3 className="text-xs font-semibold text-textMain uppercase tracking-wider flex items-center space-x-2">
                  <span>Qwen Configuration</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted uppercase font-medium">API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={qwenKey}
                      onChange={e => setQwenKey(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none text-textMain"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textMuted uppercase font-medium">Model</label>
                    <select
                      value={qwenModel}
                      onChange={e => setQwenModel(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2 py-1.5 text-sm focus:border-primary outline-none text-textMain"
                    >
                      <optgroup label="Qwen 3.5 & 3.6 (Latest)">
                        <option value="qwen3.6-max">qwen3.6-max</option>
                        <option value="qwen3.6-plus">qwen3.6-plus</option>
                        <option value="qwen3.5-max">qwen3.5-max</option>
                        <option value="qwen3.5-plus">qwen3.5-plus</option>
                      </optgroup>
                      <optgroup label="Qwen3 (Latest)">
                        <option value="qwen3-235b-a22b">qwen3-235b-a22b</option>
                        <option value="qwen3-32b">qwen3-32b</option>
                        <option value="qwen3-14b">qwen3-14b</option>
                        <option value="qwen3-8b">qwen3-8b</option>
                        <option value="qwen3-4b">qwen3-4b</option>
                        <option value="qwen3-1.7b">qwen3-1.7b</option>
                        <option value="qwen3-0.6b">qwen3-0.6b</option>
                      </optgroup>
                      <optgroup label="Qwen Plus / Max / Turbo">
                        <option value="qwen-plus">qwen-plus</option>
                        <option value="qwen-max">qwen-max</option>
                        <option value="qwen-turbo">qwen-turbo</option>
                      </optgroup>
                      <optgroup label="Qwen2.5">
                        <option value="qwen2.5-72b-instruct">qwen2.5-72b-instruct</option>
                        <option value="qwen2.5-32b-instruct">qwen2.5-32b-instruct</option>
                        <option value="qwen2.5-14b-instruct">qwen2.5-14b-instruct</option>
                        <option value="qwen2.5-7b-instruct">qwen2.5-7b-instruct</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col items-end pt-1">
                  <button
                    onClick={handleTestQwen}
                    disabled={qwenTestStatus === 'testing'}
                    className="text-xs text-primary hover:text-primaryHover font-medium disabled:opacity-50"
                  >
                    {qwenTestStatus === 'testing' ? 'Testing...' : 
                     qwenTestStatus === 'success' ? '✓ Connection OK' :
                     qwenTestStatus === 'failed' ? '✗ Connection Failed' : 'Test Connection'}
                  </button>
                  {qwenError && (
                    <p className="text-[10px] text-danger mt-1 text-right max-w-full break-all whitespace-pre-wrap">{qwenError}</p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 border-t border-border flex justify-end items-center space-x-4">
                {saveSuccess && <span className="text-xs text-success font-medium">Settings saved!</span>}
                <button
                  onClick={handleSaveAPIs}
                  className="bg-primary text-white hover:bg-primaryHover px-5 py-2 rounded text-sm font-medium transition-colors"
                >
                  Save API Keys
                </button>
              </div>
            </div>
          )}

          {activeTab === 'gdrive' && (
            <div className="space-y-4">
              <div className="bg-surfaceHighlight/30 border border-border rounded p-3 text-xs text-textMuted leading-relaxed flex items-start space-x-2">
                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                  To sync with Google Drive, you need to create a project in Google Cloud Console, enable the Google Drive API, and add a web Client Credentials object redirecting to: 
                  <span className="font-mono bg-surface px-1 py-0.5 rounded text-textMain border border-border/50 ml-1">{gdriveRedirectUri}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-textMuted uppercase font-medium">Google Client ID</label>
                  <input
                    type="text"
                    placeholder="xxx.apps.googleusercontent.com"
                    value={gdriveClientId}
                    onChange={e => setGdriveClientId(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono focus:border-primary outline-none text-textMain"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-textMuted uppercase font-medium">Google Client Secret</label>
                  <input
                    type="password"
                    placeholder="GOCSPX-..."
                    value={gdriveClientSecret}
                    onChange={e => setGdriveClientSecret(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono focus:border-primary outline-none text-textMain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-textMuted uppercase font-medium">Redirect URI</label>
                  <input
                    type="text"
                    value={gdriveRedirectUri}
                    onChange={e => setGdriveRedirectUri(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono focus:border-primary outline-none text-textMain"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-textMuted uppercase font-medium">Root Folder ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Folder ID on Google Drive"
                    value={gdriveFolderId}
                    onChange={e => setGdriveFolderId(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono focus:border-primary outline-none text-textMain"
                  />
                </div>
              </div>

              {/* Status & Code input */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-textMain">Connection Status:</span>
                  {isDriveConnected ? (
                    <span className="bg-success/10 text-success text-xs px-2.5 py-0.5 rounded-full font-semibold border border-success/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="bg-textMuted/15 text-textMuted text-xs px-2.5 py-0.5 rounded-full font-semibold border border-border flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-textMuted/40"></span>
                      <span>Disconnected</span>
                    </span>
                  )}
                </div>

                {!isDriveConnected ? (
                  <div className="space-y-2">
                    <label className="text-[10px] text-textMuted uppercase font-medium block">Step 2: Paste Authorization Code Here</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Paste Google Authorization Code"
                        value={gdriveAuthCode}
                        onChange={e => setGdriveAuthCode(e.target.value)}
                        className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono focus:border-primary outline-none text-textMain"
                      />
                      <button
                        onClick={handleConnectDrive}
                        className="bg-primary text-white hover:bg-primaryHover px-4 py-1.5 rounded text-xs font-medium shrink-0"
                      >
                        {gdriveAuthCode ? "Connect" : "Authorize..."}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={handleDisconnectDrive}
                      className="bg-danger/10 text-danger hover:bg-danger/25 border border-danger/30 px-4 py-1.5 rounded text-xs font-medium"
                    >
                      Disconnect Google Drive
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-textMain mb-2">Local Prompt Templates</h3>
                <p className="text-xs text-textMuted mb-4 leading-relaxed">
                  Import the real 16 step prompt templates from your local seed directory. 
                  This will safely add them as the newest template versions without overwriting existing data.
                </p>
                
                {importSuccess !== null ? (
                  <div className="bg-success/10 border border-success/30 rounded p-3 flex items-center space-x-3 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Successfully imported {importSuccess} templates. Reloading...</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleImport}
                    disabled={isImporting}
                    className="w-full flex items-center justify-center space-x-2 bg-surfaceHighlight border border-border hover:border-primary/50 text-textMain px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
                  >
                    <Database className="w-4 h-4 text-primary" />
                    <span>{isImporting ? "Importing..." : "Import real seed prompts"}</span>
                  </button>
                )}
              </div>

              {/* Reset Local Workspace */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-danger mb-2">Danger Zone</h3>
                <p className="text-xs text-textMuted mb-4 leading-relaxed">
                  Reset Local Workspace will delete all episodes, step runs, artifacts, and versions. 
                  The app will re-initialize with a fresh database on reload. Prompt templates are preserved.
                </p>
                
                {!showResetConfirm ? (
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-danger/10 border border-danger/30 hover:bg-danger/25 text-danger px-4 py-2 rounded transition-colors text-xs font-semibold"
                  >
                    <AlertTriangle className="w-4 h-4 text-danger" />
                    <span>Reset Local Workspace</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-danger font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleReset}
                        disabled={isResetting}
                        className="flex-1 bg-danger text-white px-4 py-2 rounded text-xs font-medium hover:bg-danger/90 disabled:opacity-50"
                      >
                        {isResetting ? "Resetting..." : "Yes, Reset Everything"}
                      </button>
                      <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 bg-surface border border-border text-textMain px-4 py-2 rounded text-xs font-medium hover:bg-surfaceHighlight"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* User Profile Selector */}
              <div className="space-y-3 pb-5 border-b border-border/50">
                <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider">Active User Profile</h3>
                <p className="text-xs text-textMuted leading-relaxed">
                  Select which co-director profile is active on this machine. Actions and approvals will be logged under this profile.
                </p>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 bg-surface hover:bg-surfaceHighlight border border-border px-4 py-2.5 rounded-xl cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="activeProfile"
                      value="Mina"
                      checked={activeProfile === 'Mina'}
                      onChange={() => setActiveProfile('Mina')}
                      className="accent-primary"
                    />
                    <span className="text-xs font-bold text-textMain">Mina (Co-Director)</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-surface hover:bg-surfaceHighlight border border-border px-4 py-2.5 rounded-xl cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="activeProfile"
                      value="Ale"
                      checked={activeProfile === 'Ale'}
                      onChange={() => setActiveProfile('Ale')}
                      className="accent-primary"
                    />
                    <span className="text-xs font-bold text-textMain">Ale (Co-Director)</span>
                  </label>
                </div>
              </div>

              {/* Local Network Sync Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider">Local Network Synchronization</h3>
                <p className="text-xs text-textMuted leading-relaxed">
                  Enable this to connect to a centralized SQLite server on your home network instead of storing data only on this computer.
                </p>

                <div className="flex items-center space-x-3 bg-surfaceHighlight/20 border border-border/50 p-3.5 rounded-xl">
                  <input
                    type="checkbox"
                    id="serverSyncEnabled"
                    checked={serverSyncEnabled}
                    onChange={e => setServerSyncEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <label htmlFor="serverSyncEnabled" className="text-xs font-bold text-textMain cursor-pointer select-none">
                    Enable Local Network Sync
                  </label>
                </div>

                {serverSyncEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-textMuted uppercase font-medium">Server Host Address</label>
                      <input
                        type="text"
                        placeholder="e.g. http://192.168.1.100:5000"
                        value={serverUrl}
                        onChange={e => setServerUrl(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm font-mono focus:border-primary outline-none text-textMain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleTestSyncConnection}
                        disabled={syncConnectionStatus === 'testing'}
                        className="text-xs text-primary hover:text-primaryHover font-medium disabled:opacity-50"
                      >
                        {syncConnectionStatus === 'testing' ? 'Testing Connection...' : 
                         syncConnectionStatus === 'success' ? '✓ Connected to Sync Host!' :
                         syncConnectionStatus === 'failed' ? '✗ Server Unreachable' : 'Test Connection'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Giphy API Configuration */}
                <div className="space-y-3 pt-5 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-textMain uppercase tracking-wider">GIPHY API Integration (Optional)</h3>
                  <p className="text-xs text-textMuted leading-relaxed">
                    Enter a GIPHY Developer API Key to search and send custom GIFs. If left empty, you can still select from preloaded reaction GIFs.
                  </p>
                  <div>
                    <label className="text-[10px] text-textMuted uppercase font-medium">GIPHY API Key</label>
                    <input
                      type="password"
                      placeholder="Enter Giphy API Key (e.g. 5xX4r...)"
                      value={giphyApiKey}
                      onChange={e => setGiphyApiKey(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm font-mono focus:border-primary outline-none text-textMain"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-border flex justify-end items-center space-x-4">
                {saveSuccess && <span className="text-xs text-success font-medium">Preferences saved! Reloading...</span>}
                <button
                  onClick={handleSaveSync}
                  className="bg-primary text-white hover:bg-primaryHover px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Sync Preferences
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded p-3 text-xs text-danger font-mono whitespace-pre-wrap">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

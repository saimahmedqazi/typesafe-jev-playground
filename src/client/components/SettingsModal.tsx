import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  Lock, 
  Sliders, 
  Cpu, 
  Server, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink 
} from 'lucide-react';
import { WorkbenchConfig } from '../types';
import { LLMProvider, SUPPORTED_MODELS, PROVIDER_DEFAULT_MODELS } from '../../adapters/types';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkbenchConfig;
  onChange: (updated: Partial<WorkbenchConfig>) => void;
}

export function SettingsModal({ isOpen, onClose, config, onChange }: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; models?: string[] } | null>(null);

  if (!isOpen) return null;

  const isNative = config.mode === 'native-jev';
  const currentKey = isNative ? config.nativeJevKey : config.llmApiKey;

  const handleProviderSelect = (p: LLMProvider) => {
    setTestResult(null);
    onChange({
      mode: 'llm-practice',
      provider: p,
      model: PROVIDER_DEFAULT_MODELS[p] || config.model,
    });
  };

  const handleNativeSelect = () => {
    setTestResult(null);
    onChange({
      mode: 'native-jev',
    });
  };

  const handleKeyChange = (newVal: string) => {
    setTestResult(null);
    if (isNative) {
      onChange({ nativeJevKey: newVal });
    } else {
      onChange({ llmApiKey: newVal });
    }
  };

  const handleClearKey = () => {
    handleKeyChange('');
    setTestResult(null);
  };

  const handleTestOrFetchModels = async () => {
    setIsFetchingModels(true);
    setTestResult(null);

    const activeKey = isNative ? config.nativeJevKey : config.llmApiKey;
    if (!activeKey) {
      setTestResult({
        ok: false,
        message: 'Please enter an API key to test connection.',
      });
      setIsFetchingModels(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isNative) {
        headers['x-user-jev-key'] = activeKey;
      } else {
        headers['x-user-llm-key'] = activeKey;
        headers['x-user-llm-provider'] = config.provider;
        if (config.customEndpoint) {
          headers['x-user-llm-endpoint'] = config.customEndpoint;
        }
      }

      const res = await fetch('/api/models', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: isNative ? 'native-jev' : config.provider,
          apiKey: activeKey,
          customEndpoint: config.customEndpoint,
        }),
      });

      const data = await res.json();
      if (data.success && data.live) {
        const modelNames = (data.models || []).map((m: { id: string }) => m.id);
        setTestResult({
          ok: true,
          message: `Connection successful! Fetched ${modelNames.length} live models from ${isNative ? 'Native Jev' : config.provider.toUpperCase()}.`,
          models: modelNames,
        });
      } else if (data.success && !data.live) {
        setTestResult({
          ok: true,
          message: data.message || 'Connection acknowledged (catalog loaded).',
        });
      } else {
        setTestResult({
          ok: false,
          message: data.error || 'Connection failed. Please check your API key.',
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Network error testing connection.',
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const suggestedModels = SUPPORTED_MODELS[config.provider as LLMProvider] || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d121f] border border-gray-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col text-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#0f172a]/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                API & Model Settings
              </h2>
              <p className="text-[11px] text-gray-400">
                Configure your execution engine, model, and in-memory credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Provider / Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Execution Backend
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProviderSelect('groq')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  !isNative && config.provider === 'groq'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-white">Groq</div>
                <div className="text-[10px] text-gray-400">LPU Ultra-Fast</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('openai')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  !isNative && config.provider === 'openai'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-white">OpenAI</div>
                <div className="text-[10px] text-gray-400">GPT-4o / Mini</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('anthropic')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  !isNative && config.provider === 'anthropic'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-white">Anthropic</div>
                <div className="text-[10px] text-gray-400">Claude 3.5</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('gemini')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  !isNative && config.provider === 'gemini'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-white">Gemini</div>
                <div className="text-[10px] text-gray-400">Google AI</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('custom')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  !isNative && config.provider === 'custom'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-white">Custom / Local</div>
                <div className="text-[10px] text-gray-400">Ollama / vLLM</div>
              </button>

              <button
                type="button"
                onClick={handleNativeSelect}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  isNative
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-purple-300">Native Jev</div>
                <div className="text-[10px] text-gray-400">Official Jev Runtime</div>
              </button>
            </div>
          </div>

          {/* Custom Base URL (if custom selected) */}
          {!isNative && config.provider === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">
                Custom Endpoint URL (OpenAI-compatible)
              </label>
              <input
                type="text"
                value={config.customEndpoint || ''}
                onChange={(e) => onChange({ customEndpoint: e.target.value })}
                placeholder="http://localhost:11434/v1/chat/completions"
                className="w-full bg-gray-950/80 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-400">
                Target endpoint for local Ollama, vLLM, LM Studio, or OpenRouter.
              </p>
            </div>
          )}

          {/* Single Unified API Key Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {isNative
                    ? 'Native Jev API Key'
                    : `${config.provider.toUpperCase()} API Key`}
                </span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>In-Memory Only</span>
              </span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={
                  isNative
                    ? 'jev_...'
                    : config.provider === 'groq'
                    ? 'gsk_...'
                    : config.provider === 'openai'
                    ? 'sk-...'
                    : config.provider === 'anthropic'
                    ? 'sk-ant-...'
                    : config.provider === 'gemini'
                    ? 'AIzaSy...'
                    : 'Optional for local endpoints'
                }
                className="w-full bg-gray-950/90 border border-gray-800 rounded-lg pl-3 pr-20 py-2.5 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {currentKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="p-1.5 rounded text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition-colors"
                    title="Clear key from memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              Never stored on disk or in browser storage. Passed directly in request memory headers.
            </p>
          </div>

          {/* Model Selection (Free-form text input + Live fetch) */}
          {!isNative && (
            <div className="space-y-2 pt-1 border-t border-gray-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">
                  Target Model Name
                </label>
                <button
                  type="button"
                  onClick={handleTestOrFetchModels}
                  disabled={isFetchingModels || !currentKey}
                  className="px-2.5 py-1 text-[11px] rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-blue-400 hover:text-blue-300 flex items-center space-x-1 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  <span>Fetch Models from Account</span>
                </button>
              </div>

              {/* Free-form text input */}
              <input
                type="text"
                value={config.model}
                onChange={(e) => onChange({ model: e.target.value })}
                placeholder="Type or pick any model name..."
                className="w-full bg-gray-950/80 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
              />

              {/* Quick Select Chips */}
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400">Popular defaults:</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onChange({ model: m.id })}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                        config.model === m.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                      }`}
                    >
                      {m.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Fetched Models Chips (if testResult has models) */}
              {testResult?.models && testResult.models.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Discovered on your account:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-gray-950/50 rounded-lg border border-gray-800">
                    {testResult.models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onChange({ model: m })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          config.model === m
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Result Message Box */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* Temperature Slider */}
          {!isNative && (
            <div className="space-y-1.5 pt-1 border-t border-gray-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">
                  Temperature: {config.temperature.toFixed(1)}
                </span>
                <span className="text-gray-400 text-[11px]">(0.0 = Deterministic)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Native Org ID (if native selected) */}
          {isNative && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">
                Organization ID (Optional)
              </label>
              <input
                type="text"
                value={config.nativeOrgId}
                onChange={(e) => onChange({ nativeOrgId: e.target.value })}
                placeholder="org_..."
                className="w-full bg-gray-950/80 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#0f172a]/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleTestOrFetchModels}
              disabled={isFetchingModels || !currentKey}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 disabled:opacity-40 transition-colors"
            >
              Test Connection
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
}

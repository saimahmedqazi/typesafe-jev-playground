import React, { useState } from 'react';
import { Key, Eye, EyeOff, Lock, Trash2, Cpu, Server, Sparkles } from 'lucide-react';
import { WorkbenchConfig } from '../types';
import { SUPPORTED_MODELS, PROVIDER_DEFAULT_MODELS, LLMProvider } from '../../adapters/types';

export interface ConfigPanelProps {
  config: WorkbenchConfig;
  onChange: (updated: Partial<WorkbenchConfig>) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showJevKey, setShowJevKey] = useState(false);

  const handleModeChange = (mode: 'llm-practice' | 'native-jev') => {
    onChange({ mode });
  };

  const handleProviderChange = (provider: LLMProvider) => {
    onChange({
      provider,
      model: PROVIDER_DEFAULT_MODELS[provider],
    });
  };

  const activeModels = SUPPORTED_MODELS[config.provider] || [];

  return (
    <div className="bg-[#0f172a]/90 border border-gray-800 rounded-xl p-5 flex flex-col space-y-6 shadow-sm">
      <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
        <Cpu className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white tracking-wide uppercase">1. Execution Configuration</h2>
      </div>

      {/* Execution Mode Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-gray-300">Execution Mode</label>
        <div className="grid grid-cols-1 gap-2">
          {/* Mode A: LLM Practice */}
          <button
            type="button"
            onClick={() => handleModeChange('llm-practice')}
            className={`text-left p-3 rounded-lg border transition-all ${
              config.mode === 'llm-practice'
                ? 'bg-blue-600/15 border-blue-500/60 ring-1 ring-blue-500/30'
                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>LLM Practice Mode</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                BYO Key
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Practice JEV semantics using your personal OpenAI, Anthropic, or Gemini API key.
            </p>
          </button>

          {/* Mode B: Native Jev */}
          <button
            type="button"
            onClick={() => handleModeChange('native-jev')}
            className={`text-left p-3 rounded-lg border transition-all ${
              config.mode === 'native-jev'
                ? 'bg-purple-600/15 border-purple-500/60 ring-1 ring-purple-500/30'
                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <span>Native Jev Mode</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Official Runtime
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Execute evaluations against official Jev infrastructure with authorized credentials.
            </p>
          </button>
        </div>
      </div>

      {/* LLM Practice Settings */}
      {config.mode === 'llm-practice' && (
        <div className="space-y-4 pt-1">
          {/* Provider Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">LLM Provider</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-950/60 border border-gray-800 rounded-lg">
              {(['openai', 'anthropic', 'gemini'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    config.provider === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Target Model</label>
            <select
              value={config.model}
              onChange={(e) => onChange({ model: e.target.value })}
              className="w-full bg-gray-950/80 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {activeModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400">
              {activeModels.find((m) => m.id === config.model)?.description}
            </p>
          </div>

          {/* Ephemeral LLM Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
                <Key className="w-3 h-3 text-amber-400" />
                <span>{config.provider.toUpperCase()} API Key</span>
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>In-Memory Only</span>
              </span>
            </div>
            <div className="relative">
              <input
                type={showLlmKey ? 'text' : 'password'}
                value={config.llmApiKey}
                onChange={(e) => onChange({ llmApiKey: e.target.value })}
                placeholder={
                  config.provider === 'openai'
                    ? 'sk-...'
                    : config.provider === 'anthropic'
                    ? 'sk-ant-...'
                    : 'AIzaSy...'
                }
                className="w-full bg-gray-950/80 border border-gray-800 rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowLlmKey(!showLlmKey)}
                  className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  title={showLlmKey ? 'Hide key' : 'Show key'}
                >
                  {showLlmKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {config.llmApiKey && (
                  <button
                    type="button"
                    onClick={() => onChange({ llmApiKey: '' })}
                    className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-gray-800"
                    title="Clear key from memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              Never stored on disk or database. Transmitted only as request header.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Temperature: {config.temperature.toFixed(1)}</span>
              <span className="text-gray-400 text-[10px]">(0.0 = Deterministic)</span>
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
        </div>
      )}

      {/* Native Jev Settings */}
      {config.mode === 'native-jev' && (
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
                <Key className="w-3 h-3 text-purple-400" />
                <span>Native Jev API Key</span>
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>In-Memory Only</span>
              </span>
            </div>
            <div className="relative">
              <input
                type={showJevKey ? 'text' : 'password'}
                value={config.nativeJevKey}
                onChange={(e) => onChange({ nativeJevKey: e.target.value })}
                placeholder="jev_api_key_..."
                className="w-full bg-gray-950/80 border border-gray-800 rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowJevKey(!showJevKey)}
                  className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  title={showJevKey ? 'Hide key' : 'Show key'}
                >
                  {showJevKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {config.nativeJevKey && (
                  <button
                    type="button"
                    onClick={() => onChange({ nativeJevKey: '' })}
                    className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-gray-800"
                    title="Clear key from memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Organization ID (Optional)</label>
            <input
              type="text"
              value={config.nativeOrgId}
              onChange={(e) => onChange({ nativeOrgId: e.target.value })}
              placeholder="org_..."
              className="w-full bg-gray-950/80 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 space-y-1">
            <div className="font-semibold text-purple-300 flex items-center space-x-1">
              <Server className="w-3.5 h-3.5" />
              <span>Native Jev Runtime Isolation</span>
            </div>
            <p className="text-purple-300/80">
              Evaluations route directly to official Jev infrastructure. No LLMs or prompt approximations are invoked.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

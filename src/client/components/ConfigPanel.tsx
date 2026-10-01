import React from 'react';
import { 
  Key, 
  Lock, 
  Cpu, 
  Server, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { WorkbenchConfig } from '../types';
import { sanitizeSecret } from '../../core/credentials';

export interface ConfigPanelProps {
  config: WorkbenchConfig;
  onChange: (updated: Partial<WorkbenchConfig>) => void;
  onOpenSettings: () => void;
}

export function ConfigPanel({ config, onChange, onOpenSettings }: ConfigPanelProps) {
  const isNative = config.mode === 'native-jev';
  const activeKey = isNative ? config.nativeJevKey : config.llmApiKey;
  const hasKey = Boolean(activeKey && activeKey.trim().length > 0);

  const handleModeChange = (mode: 'llm-practice' | 'native-jev') => {
    onChange({ mode });
  };

  return (
    <div className="bg-[#0f172a]/90 border border-gray-800 rounded-xl p-5 flex flex-col space-y-5 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">1. Execution Engine</h2>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-2.5 py-1 text-xs rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-blue-400 hover:text-blue-300 flex items-center space-x-1.5 transition-colors"
          title="Open API & Model Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Execution Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-300">Execution Mode</label>
        <div className="grid grid-cols-1 gap-2">
          
          {/* Mode A: LLM Practice */}
          <button
            type="button"
            onClick={() => handleModeChange('llm-practice')}
            className={`text-left p-3 rounded-lg border transition-all ${
              !isNative
                ? 'bg-blue-600/15 border-blue-500/60 ring-1 ring-blue-500/30'
                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>LLM Practice Mode</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                BYO Key
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Practice JEV logic with Groq, OpenAI, Anthropic, Gemini, or local models.
            </p>
          </button>

          {/* Mode B: Native Jev */}
          <button
            type="button"
            onClick={() => handleModeChange('native-jev')}
            className={`text-left p-3 rounded-lg border transition-all ${
              isNative
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
                Official
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Execute directly against official Jev infrastructure using authorized Jev credentials.
            </p>
          </button>
        </div>
      </div>

      {/* Engine & Model Summary Card */}
      <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300">Active Engine</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            Change
          </button>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
            <span className="text-gray-400 text-[11px]">Provider:</span>
            <span className="text-white capitalize font-semibold">
              {isNative ? 'Native Jev' : config.provider}
            </span>
          </div>

          {!isNative && (
            <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
              <span className="text-gray-400 text-[11px]">Model:</span>
              <span className="text-blue-300 truncate max-w-[170px]" title={config.model}>
                {config.model}
              </span>
            </div>
          )}

          {!isNative && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-400 text-[11px]">Temperature:</span>
              <span className="text-gray-200">
                {config.temperature.toFixed(1)} {config.temperature === 0 ? '(Deterministic)' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Single API Key Status Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <Key className="w-3 h-3 text-amber-400" />
            <span>API Credential Status</span>
          </label>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
            <Lock className="w-2.5 h-2.5" />
            <span>In-Memory Only</span>
          </span>
        </div>

        {hasKey ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-300">Key Configured</p>
                <p className="text-[10px] font-mono text-emerald-400/80">
                  {sanitizeSecret(activeKey)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs font-medium px-2.5 py-1 rounded bg-gray-900 border border-gray-700 text-gray-200 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">
                {isNative
                  ? 'A Native Jev API key is required to evaluate against official infrastructure.'
                  : `An API key for ${config.provider.toUpperCase()} is required to run evaluations.`}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors text-center"
            >
              Configure API Key in Settings
            </button>
          </div>
        )}
      </div>

      {/* Security Architecture Notice */}
      <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400 space-y-1">
        <div className="flex items-center space-x-1.5 text-gray-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Fallback BYOK Guarantee</span>
        </div>
        <p className="leading-relaxed text-[10px] text-gray-400">
          Keys stay in client memory. No public fallback keys exist. Upstream errors echoing keys are automatically redacted.
        </p>
      </div>

    </div>
  );
}

import React from 'react';
import { ShieldCheck, History, Sliders, BookOpen, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { WorkbenchHealth } from '../types';

export interface HeaderProps {
  health: WorkbenchHealth | null;
  loadingHealth: boolean;
  healthError: string | null;
  historyCount: number;
  hasKey: boolean;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenWalkthrough: () => void;
}

export function Header({
  health,
  loadingHealth,
  healthError,
  historyCount,
  hasKey,
  onOpenHistory,
  onOpenSettings,
  onOpenWalkthrough,
}: HeaderProps) {
  return (
    <header className="border-b border-gray-800 bg-[#0d121f]/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-semibold text-white tracking-wide">TypeSafe Jev Playground</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.0-alpha
            </span>
          </div>
          <p className="text-xs text-gray-400">BYO LLM &bull; Optional Jev Developer Experimentation Workbench</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        
        {/* Guide & Docs Walkthrough Button */}
        <button
          type="button"
          onClick={onOpenWalkthrough}
          className="px-2.5 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 transition-colors flex items-center space-x-1.5"
          title="Open Guide & Walkthrough"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Guide</span>
        </button>

        {/* History Trigger Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="px-2.5 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 transition-colors flex items-center space-x-1.5"
          title="Open Experiment History"
        >
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span>History</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300">
            {historyCount}
          </span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-2.5 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs text-gray-200 transition-colors flex items-center space-x-1.5"
          title="Configure API Credentials & Model"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Settings</span>
          {hasKey ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="API Key Configured" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="API Key Required" />
          )}
        </button>

        <div className="h-4 w-px bg-gray-800" />

        {/* Backend API Health Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400">API:</span>
          {loadingHealth ? (
            <span className="inline-flex items-center text-amber-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span> Connecting
            </span>
          ) : health ? (
            <span className="inline-flex items-center text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span> Connected ({health.version})
            </span>
          ) : (
            <span className="inline-flex items-center text-rose-400" title={healthError || 'Failed to connect'}>
              <span className="w-2 h-2 rounded-full bg-rose-400 mr-1.5"></span> Offline
            </span>
          )}
        </div>

        <div className="h-4 w-px bg-gray-800" />

        {/* Zero-Fallback Policy Pill */}
        <div className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Fallback BYOK</span>
        </div>
      </div>
    </header>
  );
}

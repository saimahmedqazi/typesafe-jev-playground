import React from 'react';
import { 
  Terminal, 
  Home, 
  Code2, 
  BarChart3, 
  Key, 
  BookOpen, 
  ExternalLink, 
  Settings, 
  User, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface SidebarProps {
  currentTab: 'playground' | 'usage';
  onSelectTab: (tab: 'playground' | 'usage') => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenWalkthrough: () => void;
  hasKey: boolean;
  historyCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  onOpenSettings,
  onOpenHistory,
  onOpenWalkthrough,
  hasKey,
  historyCount,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#090d16] border-r border-gray-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wider text-white font-mono uppercase">
            TYPESAFE AI
          </div>
          <div className="text-[10px] text-gray-500 font-medium">
            Jev Developer Workbench
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Platform
        </div>

        {/* Home */}
        <button
          type="button"
          onClick={onOpenWalkthrough}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-850/60 transition-colors text-left"
        >
          <Home className="w-4 h-4 text-gray-400" />
          <span>Home</span>
        </button>

        {/* Playground (Active) */}
        <button
          type="button"
          onClick={() => onSelectTab('playground')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'playground'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-850/60'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Playground</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        </button>

        {/* Usage / History */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('usage');
            onOpenHistory();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-850/60 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span>Usage</span>
          </div>
          {historyCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
              {historyCount}
            </span>
          )}
        </button>

        {/* API Keys */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-850/60 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <Key className="w-4 h-4 text-gray-400" />
            <span>API Keys</span>
          </div>
          {hasKey ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Key Configured" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Key Required" />
          )}
        </button>

        <div className="pt-4 pb-2 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Resources
        </div>

        {/* Documentation (External Link to docs.typesafe.ai) */}
        <a
          href="https://docs.typesafe.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-blue-400/90 hover:text-blue-300 hover:bg-gray-850/60 transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Documentation</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-300 transition-colors" />
        </a>

        {/* Walkthrough & Guide */}
        <button
          type="button"
          onClick={onOpenWalkthrough}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-850/60 transition-colors text-left"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Interactive Guide</span>
        </button>
      </nav>

      {/* Semantic Boundary Notice */}
      <div className="p-3 mx-3 my-2 rounded-lg bg-[#0e1626] border border-blue-500/20 text-[11px] text-gray-400 space-y-1">
        <div className="flex items-center space-x-1.5 text-blue-400 font-semibold text-[10px] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LLM Practice Mode</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-tight">
          Educational workbench for practicing JEV concepts with commodity LLMs. Not official Jev runtime.
        </p>
      </div>

      {/* Bottom Profile & Balance Footer */}
      <div className="p-3 border-t border-gray-800 bg-[#070a12] flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 font-bold text-xs shrink-0">
            BY
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">Developer Workspace</div>
            <div className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>100% Free Practice</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
          title="Configure API Keys & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

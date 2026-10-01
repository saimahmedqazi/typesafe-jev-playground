import React, { useEffect, useState } from 'react';
import { 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Server, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Key,
  ExternalLink
} from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  supportedModes: string[];
  ownerFallbackEnabled: boolean;
  version: string;
  description: string;
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState<'llm-practice' | 'native-jev'>('llm-practice');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: HealthData) => {
        setHealth(data);
        setLoadingHealth(false);
      })
      .catch((err) => {
        setHealthError(err.message);
        setLoadingHealth(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-200 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-gray-800 bg-[#0d121f]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold font-mono">
            ⚡
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

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400">API Status:</span>
            {loadingHealth ? (
              <span className="inline-flex items-center text-amber-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span> Connecting...
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

          <div className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Fallback BYOK</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col space-y-6">
        {/* Semantic Boundary Notice */}
        <section className="bg-[#0f172a]/70 border border-blue-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-sm">
              <h2 className="text-sm font-semibold text-white">Execution Mode & Semantic Architecture</h2>
              <p className="text-gray-300 leading-relaxed text-xs">
                The playground strictly separates <strong>LLM Practice Mode</strong> (which uses your own BYO LLM credentials to experiment with JEV concepts such as State, Atomic Questions, Noul, and Score) from <strong>Native Jev Mode</strong> (which connects directly to native Jev infrastructure). LLM Practice Mode provides a practical, accessible learning environment without misleading claims of runtime identity.
              </p>
            </div>
          </div>
        </section>

        {/* Execution Mode Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedMode('llm-practice')}
            className={`text-left p-5 rounded-xl border transition-all relative ${
              selectedMode === 'llm-practice'
                ? 'bg-[#131b2e] border-blue-500 shadow-md ring-1 ring-blue-500/30'
                : 'bg-[#0f1523] border-gray-800 hover:border-gray-700 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-white text-sm">Mode A: LLM Practice Mode</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                BYO LLM Key
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Supply your own OpenAI, Anthropic, or Gemini API key. Practice JEV evaluation concepts, state modeling, and atomic questions without needing a Jev license.
            </p>
            {selectedMode === 'llm-practice' && (
              <div className="mt-3 flex items-center space-x-1.5 text-xs text-blue-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Workbench Mode</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('native-jev')}
            className={`text-left p-5 rounded-xl border transition-all relative ${
              selectedMode === 'native-jev'
                ? 'bg-[#131b2e] border-blue-500 shadow-md ring-1 ring-blue-500/30'
                : 'bg-[#0f1523] border-gray-800 hover:border-gray-700 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-white text-sm">Mode B: Native Jev Mode</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Direct Jev Access
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Connect authorized Jev API credentials to execute directly against official Jev infrastructure with full runtime guarantees.
            </p>
            {selectedMode === 'native-jev' && (
              <div className="mt-3 flex items-center space-x-1.5 text-xs text-indigo-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Workbench Mode</span>
              </div>
            )}
          </button>
        </div>

        {/* 3-Column Preview Layout (Walking Skeleton) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Configuration & Credentials */}
          <div className="lg:col-span-4 bg-[#0d1322] border border-gray-800 rounded-xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">1. Configuration</h3>
              </div>
              <span className="text-[11px] text-gray-400">Ephemeral Memory</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Execution Mode</label>
                <div className="p-2.5 rounded-lg bg-[#090d16] border border-gray-800 text-gray-200 font-mono text-xs">
                  {selectedMode === 'llm-practice' ? 'llm-practice (BYO Key)' : 'native-jev (Authorized Access)'}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Provider</label>
                <div className="p-2.5 rounded-lg bg-[#090d16] border border-gray-800 text-gray-200 text-xs">
                  {selectedMode === 'llm-practice' ? 'OpenAI / Anthropic / Gemini (Configurable)' : 'Official Jev Runtime'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-medium text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cost Isolation Guarantee</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Your credentials are never stored to disk or database and never logged. The backend enforces that no repository-owner fallback key is ever used.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Question & State Workspace */}
          <div className="lg:col-span-5 bg-[#0d1322] border border-gray-800 rounded-xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">2. Evaluation Workspace</h3>
              </div>
              <span className="text-[11px] font-mono text-blue-400">STATE + ATOMIC QUESTION</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#090d16] border border-gray-800 space-y-2">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Walking Skeleton Status</span>
                <p className="text-xs text-gray-300">
                  Phase 1 Walking Skeleton is active. Full-stack TypeScript build, Express routing, and client reactivity are verified.
                </p>
                <div className="pt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-xs text-emerald-300">Phase 1: Foundation & Domain Models in progress</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800/80 text-[11px] text-gray-400 space-y-1">
                <div className="font-semibold text-gray-300">Upcoming in Phase 2:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Noul primitive: <code className="text-blue-300">is_sandwich</code> boolean evaluation</li>
                  <li>Score primitive: <code className="text-blue-300">new_score_1</code> continuous evaluation (0-1)</li>
                  <li>Interactive JSON State Editor with validation and presets</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 3: Result Inspector & Metadata */}
          <div className="lg:col-span-3 bg-[#0d1322] border border-gray-800 rounded-xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">3. System Inspector</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#090d16] border border-gray-800 space-y-2 font-mono text-[11px]">
                <div className="text-gray-400">Backend Health:</div>
                {health ? (
                  <div className="text-emerald-400 space-y-1">
                    <div>Status: {health.status}</div>
                    <div>Version: {health.version}</div>
                    <div>Owner Fallback: {health.ownerFallbackEnabled ? 'Enabled' : 'Disabled (Safe)'}</div>
                    <div className="text-gray-400 text-[10px] truncate">Modes: {health.supportedModes.join(', ')}</div>
                  </div>
                ) : (
                  <div className="text-gray-400">Fetching /api/health...</div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20 text-[11px] text-blue-300 flex items-center justify-between">
                <span>Evaluation pipeline</span>
                <span className="font-mono text-emerald-400 text-[10px]">READY</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 px-6 py-4 text-center text-xs text-gray-400 bg-[#090d16]">
        TypeSafe Jev Playground &bull; Built with strict TypeScript &bull; BYO LLM Key &bull; Safe Ephemeral Execution
      </footer>
    </div>
  );
}

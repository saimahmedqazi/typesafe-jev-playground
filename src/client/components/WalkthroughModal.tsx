import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Key, 
  CheckCircle2, 
  Sliders,
  Terminal,
  Server
} from 'lucide-react';

export const WALKTHROUGH_STORAGE_KEY = 'typesafe_jev_walkthrough_seen';

export interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function WalkthroughModal({ isOpen, onClose, onOpenSettings }: WalkthroughModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(WALKTHROUGH_STORAGE_KEY, 'true');
      } catch {
        // ignore localStorage error
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d121f] border border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col text-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#0f172a]/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                Welcome to TypeSafe Jev Playground
              </h2>
              <p className="text-xs text-gray-400">
                Developer workbench for practicing and experimenting with JEV semantics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* Section 1: What is JEV */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Layers className="w-3.5 h-3.5" />
              <span>1. What is JEV?</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              JEV is an evaluation framework where arbitrary structured state is evaluated against focused <strong>Atomic Questions</strong> to produce strictly typed results:
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 space-y-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  Noul Primitive
                </span>
                <p className="text-xs font-medium text-white pt-1">Categorical Truth Judgment</p>
                <p className="text-[11px] text-gray-400">
                  Returns a strict <code className="text-emerald-400 font-mono">boolean</code> value (<code className="text-emerald-400 font-mono">true</code> / <code className="text-emerald-400 font-mono">false</code>) along with confidence and step-by-step rationale.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 space-y-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                  Score Primitive
                </span>
                <p className="text-xs font-medium text-white pt-1">Continuous Quality Metric</p>
                <p className="text-[11px] text-gray-400">
                  Returns a normalized <code className="text-blue-400 font-mono">number</code> in the range <code className="text-blue-400 font-mono">[0.0, 1.0]</code> reflecting degree of alignment.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Two Execution Modes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>2. Supported Execution Modes</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 space-y-1.5">
                <span className="text-xs font-semibold text-blue-300 flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>LLM Practice Mode</span>
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Use your own LLM API key (Groq, OpenAI, Anthropic, Gemini, or Ollama) to practice JEV concepts. This is an educational practice layer, not the official Jev runtime.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-1.5">
                <span className="text-xs font-semibold text-purple-300 flex items-center space-x-1">
                  <Server className="w-3.5 h-3.5" />
                  <span>Native Jev Mode</span>
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Connect your native Jev credentials to execute against the official Jev infrastructure (<code className="text-purple-300 font-mono">api.jev.ai</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Privacy & Security Guarantee */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-gray-300">
              <p className="font-semibold text-emerald-300">Strict BYOK & Zero Storage Invariant</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Your API credentials exist in browser memory only. They are never written to disk, databases, or browser storage, and the server strictly rejects fallback to maintainer keys.
              </p>
            </div>
          </div>

          {/* Section 4: Official Jev References */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 space-y-2">
            <p className="text-xs font-semibold text-gray-300">Official Jev References & Documentation</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="https://jev.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-blue-400 hover:text-blue-300 flex items-center space-x-1.5 transition-colors"
              >
                <span>Official Jev Site (jev.ai)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/saimahmedqazi/typesafe-jev-playground"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white flex items-center space-x-1.5 transition-colors"
              >
                <span>Project GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 bg-[#0f172a]/60 flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0"
            />
            <span>Do not show automatically on startup</span>
          </label>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                handleDismiss();
                onOpenSettings();
              }}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors flex items-center space-x-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure API Key</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Start Experimenting
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

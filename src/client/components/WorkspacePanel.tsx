import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  AlignLeft, 
  RotateCcw, 
  Play, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Sliders,
  FileCode
} from 'lucide-react';
import { ClientQuestion, ClientPreset } from '../types';

export interface WorkspacePanelProps {
  questions: ClientQuestion[];
  activeQuestion: ClientQuestion | null;
  onSelectQuestion: (question: ClientQuestion) => void;
  stateJson: string;
  onChangeStateJson: (val: string) => void;
  onFormatJson: () => void;
  onResetState: () => void;
  onLoadPreset: (preset: ClientPreset) => void;
  onRunEvaluation: () => void;
  isEvaluating: boolean;
  canRun: boolean;
}

export function WorkspacePanel({
  questions,
  activeQuestion,
  onSelectQuestion,
  stateJson,
  onChangeStateJson,
  onFormatJson,
  onResetState,
  onLoadPreset,
  onRunEvaluation,
  isEvaluating,
  canRun,
}: WorkspacePanelProps) {
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  // Live JSON syntax validation
  const jsonValidation = useMemo(() => {
    try {
      const parsed = JSON.parse(stateJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'State must be a JSON object {...}' };
      }
      return { valid: true, error: null };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Invalid JSON syntax',
      };
    }
  }, [stateJson]);

  // Handle Tab key in textarea to insert 2 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = stateJson.substring(0, start) + '  ' + stateJson.substring(end);
      onChangeStateJson(newValue);
      // Restore cursor position after state update
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const currentPresets = activeQuestion?.presets || [];

  return (
    <div className="bg-[#0f172a]/90 border border-gray-800 rounded-xl p-5 flex flex-col space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">2. Question & State Workspace</h2>
        </div>
        {activeQuestion && (
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                activeQuestion.type === 'noul'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              Primitive: {activeQuestion.type}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
              Returns: {activeQuestion.expectedReturnType === 'boolean' ? 'boolean' : 'number [0, 1]'}
            </span>
          </div>
        )}
      </div>

      {/* Question Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Active Atomic Question</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {questions.map((q) => {
            const isSelected = activeQuestion?.id === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(q)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-emerald-600/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{q.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">{q.id}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{q.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Details & Instruction Callout */}
      {activeQuestion && (
        <div className="rounded-lg bg-gray-950/70 border border-gray-800 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="w-full px-3 py-2 flex items-center justify-between text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span className="flex items-center space-x-1.5 font-medium">
              <Sliders className="w-3 h-3 text-blue-400" />
              <span>Prompt Guidelines & Evaluation Rules</span>
            </span>
            {showPromptDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showPromptDetails && (
            <div className="px-3 pb-3 pt-1 border-t border-gray-800/60 space-y-2 text-gray-300">
              <p className="text-[11px] text-gray-400">{activeQuestion.description}</p>
              <div className="p-2 rounded bg-[#090d16] font-mono text-[11px] text-gray-300 whitespace-pre-wrap border border-gray-800">
                {activeQuestion.defaultState ? JSON.stringify(activeQuestion.defaultState, null, 2) : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive JSON State Editor */}
      <div className="space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-300 flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Target State (JSON)</span>
            </span>
            {jsonValidation.valid ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Valid JSON</span>
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center space-x-1" title={jsonValidation.error || ''}>
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Syntax Error</span>
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {currentPresets.length > 0 && (
              <select
                onChange={(e) => {
                  const preset = currentPresets.find((p) => p.id === e.target.value);
                  if (preset) {
                    onLoadPreset(preset);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[11px] text-gray-300 hover:border-gray-700 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Load Preset...</option>
                {currentPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onFormatJson}
              disabled={!jsonValidation.valid}
              className="px-2 py-1 text-[11px] rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 disabled:opacity-40 flex items-center space-x-1"
              title="Pretty format JSON"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Format</span>
            </button>

            <button
              type="button"
              onClick={onResetState}
              className="px-2 py-1 text-[11px] rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 flex items-center space-x-1"
              title="Reset to question default state"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Textarea Code Editor */}
        <div className="relative flex-1 min-h-[220px]">
          <textarea
            value={stateJson}
            onChange={(e) => onChangeStateJson(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className={`w-full h-full min-h-[220px] bg-[#090d16] border rounded-lg p-3 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-y ${
              jsonValidation.valid
                ? 'border-gray-800 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30'
                : 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
            }`}
            placeholder={'{\n  "attribute": "value"\n}'}
          />
        </div>
        {!jsonValidation.valid && jsonValidation.error && (
          <p className="text-[11px] text-rose-400 font-mono">{jsonValidation.error}</p>
        )}
      </div>

      {/* Execution Run Bar */}
      <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
        <span className="text-[11px] text-gray-500 flex items-center space-x-1">
          <span>Shortcut:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-400 text-[10px] font-mono">
            Ctrl + Enter
          </kbd>
        </span>

        <button
          type="button"
          onClick={onRunEvaluation}
          disabled={!canRun || !jsonValidation.valid || isEvaluating}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 hover:shadow-blue-500/30 transition-all flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isEvaluating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Evaluating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Evaluation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

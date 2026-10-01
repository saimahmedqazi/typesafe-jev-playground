import React, { useState, useMemo } from 'react';
import { 
  Code, 
  Trash2, 
  Play, 
  ChevronDown, 
  Plus, 
  AlignLeft, 
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StatePreset, STATE_PRESETS } from '../../registry/presets';

export interface WorkspacePanelProps {
  stateJson: string;
  onChangeStateJson: (val: string) => void;
  questionsJson: string;
  onChangeQuestionsJson: (val: string) => void;
  onFormatAll: () => void;
  onClear: () => void;
  onLoadPreset: (preset: StatePreset) => void;
  onAddQuestionTemplate: (type: 'noul' | 'score' | 'choice') => void;
  activeModelName: string;
  onOpenSettings: () => void;
  onRunEvaluation: () => void;
  isEvaluating: boolean;
  canRun: boolean;
}

export function WorkspacePanel({
  stateJson,
  onChangeStateJson,
  questionsJson,
  onChangeQuestionsJson,
  onFormatAll,
  onClear,
  onLoadPreset,
  onAddQuestionTemplate,
  activeModelName,
  onOpenSettings,
  onRunEvaluation,
  isEvaluating,
  canRun,
}: WorkspacePanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Validate State JSON
  const stateValidation = useMemo(() => {
    try {
      const parsed = JSON.parse(stateJson);
      if (typeof parsed !== 'object' || parsed === null) {
        return { valid: false, error: 'State must be a JSON object or string' };
      }
      return { valid: true, error: null };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [stateJson]);

  // Validate Questions JSON
  const questionsValidation = useMemo(() => {
    try {
      const parsed = JSON.parse(questionsJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'Questions must be a JSON object mapping question keys to definitions' };
      }
      return { valid: true, error: null };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [questionsJson]);

  // Tab key indents 2 spaces
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    val: string,
    onChange: (v: string) => void
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      onChange(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Compute line numbers
  const stateLines = useMemo(() => stateJson.split('\n').map((_, i) => i + 1), [stateJson]);
  const questionLines = useMemo(() => questionsJson.split('\n').map((_, i) => i + 1), [questionsJson]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-md">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-gray-800 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-200 uppercase tracking-wider text-[11px]">
            Playground
          </span>
          <select
            onChange={(e) => {
              const p = STATE_PRESETS.find((item) => item.id === e.target.value);
              if (p) onLoadPreset(p);
              e.target.value = '';
            }}
            defaultValue=""
            className="bg-[#21262d] border border-gray-700 rounded px-2.5 py-1 text-[11px] text-gray-300 hover:border-gray-600 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>Load Official Preset...</option>
            {STATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onFormatAll}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-gray-800 border border-gray-700 text-gray-300 flex items-center space-x-1"
            title="Format JSON"
          >
            <AlignLeft className="w-3 h-3 text-blue-400" />
            <span>Format</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 flex items-center space-x-1"
            title="Clear playground"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Editor Workspace Split View */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
        {/* 1. State Section */}
        <div className="flex flex-col space-y-1.5 flex-1 min-h-[160px]">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-300">State</span>
              <span className="text-[10px] text-gray-500 font-mono">(Entity data to evaluate)</span>
            </div>
            {stateValidation.valid ? (
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Valid JSON</span>
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 flex items-center space-x-1" title={stateValidation.error || ''}>
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Syntax Error</span>
              </span>
            )}
          </div>

          <div className="flex-1 flex bg-[#090d16] border border-gray-800 rounded-lg overflow-hidden font-mono text-xs">
            {/* Line numbers gutter */}
            <div className="bg-[#0e131f] select-none text-gray-600 px-2.5 py-2.5 text-right font-mono text-[11px] border-r border-gray-800/80">
              {stateLines.map((num) => (
                <div key={num} className="leading-5">{num}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              value={stateJson}
              onChange={(e) => onChangeStateJson(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, stateJson, onChangeStateJson)}
              spellCheck={false}
              className="flex-1 bg-transparent p-2.5 text-gray-200 font-mono text-xs leading-5 focus:outline-none resize-none min-h-[140px]"
              placeholder='{\n  "food": "Burger",\n  "definition": "A burger is a cooked patty served between two sliced buns..."\n}'
            />
          </div>
        </div>

        {/* 2. Questions Section */}
        <div className="flex flex-col space-y-1.5 flex-1 min-h-[220px]">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-300">Questions</span>
              <span className="text-[10px] text-gray-500 font-mono">(JEV Primitives: noul, score, choice)</span>
            </div>
            {questionsValidation.valid ? (
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Valid Questions Map</span>
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 flex items-center space-x-1" title={questionsValidation.error || ''}>
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Syntax Error</span>
              </span>
            )}
          </div>

          <div className="flex-1 flex bg-[#090d16] border border-gray-800 rounded-lg overflow-hidden font-mono text-xs">
            {/* Line numbers gutter */}
            <div className="bg-[#0e131f] select-none text-gray-600 px-2.5 py-2.5 text-right font-mono text-[11px] border-r border-gray-800/80">
              {questionLines.map((num) => (
                <div key={num} className="leading-5">{num}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              value={questionsJson}
              onChange={(e) => onChangeQuestionsJson(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, questionsJson, onChangeQuestionsJson)}
              spellCheck={false}
              className="flex-1 bg-transparent p-2.5 text-gray-200 font-mono text-xs leading-5 focus:outline-none resize-none min-h-[200px]"
              placeholder='{\n  "is_sandwich": {\n    "type": "noul",\n    "instructions": "Is `food` a sandwich?",\n    "criteria": {\n      "true": "A sandwich is a kebab closed in bun",\n      "false": "No bread enclosing filling"\n    }\n  }\n}'
            />
          </div>

          {/* Add Question Dropdown */}
          <div className="relative pt-1">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-2.5 py-1 rounded bg-[#161b22] hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3 h-3 text-blue-400" />
              <span>Add Question</span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {showAddMenu && (
              <div className="absolute z-20 mt-1 w-56 rounded-lg bg-[#161b22] border border-gray-700 shadow-xl py-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onAddQuestionTemplate('noul');
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-800 text-gray-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-emerald-400">Noul</span>
                  <span className="text-[10px] text-gray-400 font-mono">Yes / No</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddQuestionTemplate('score');
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-800 text-gray-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-blue-400">Score</span>
                  <span className="text-[10px] text-gray-400 font-mono">Continuous [0, 1]</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddQuestionTemplate('choice');
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-800 text-gray-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-purple-400">Choice</span>
                  <span className="text-[10px] text-gray-400 font-mono">Categorical</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar (Matches official playground footer) */}
      <div className="px-4 py-3 bg-[#161b22] border-t border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-mono transition-colors"
            title="Configure Execution Provider and Model"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{activeModelName}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400 text-[10px] font-mono">
              Ctrl + Enter
            </kbd>
          </span>

          <button
            type="button"
            onClick={onRunEvaluation}
            disabled={!canRun || !stateValidation.valid || !questionsValidation.valid || isEvaluating}
            className="px-5 py-2 rounded-lg bg-white hover:bg-gray-200 text-gray-950 font-semibold text-xs transition-all flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed shadow"
          >
            {isEvaluating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <span>Run request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  AlignLeft, 
  RotateCcw, 
  Play, 
  ChevronDown, 
  ChevronUp,
  Sliders,
  FileCode,
  Plus,
  X,
  Tag
} from 'lucide-react';
import { QuestionPrimitiveType } from '../../core/domain';
import { ClientQuestion, ClientPreset } from '../types';

export interface WorkspacePanelProps {
  questions: ClientQuestion[];
  activePrimitive: QuestionPrimitiveType;
  onSelectPrimitive: (prim: QuestionPrimitiveType) => void;
  activeQuestion: ClientQuestion | null;
  onSelectQuestion: (question: ClientQuestion) => void;
  isCustomQuestion: boolean;
  onToggleCustomQuestion: (isCustom: boolean) => void;
  customQuestionText: string;
  onChangeCustomQuestionText: (val: string) => void;
  choices: string[];
  onChangeChoices: (choices: string[]) => void;
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
  activePrimitive,
  onSelectPrimitive,
  activeQuestion,
  onSelectQuestion,
  isCustomQuestion,
  onToggleCustomQuestion,
  customQuestionText,
  onChangeCustomQuestionText,
  choices,
  onChangeChoices,
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
  const [newChoiceInput, setNewChoiceInput] = useState('');

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
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleAddChoice = () => {
    const trimmed = newChoiceInput.trim();
    if (trimmed && !choices.includes(trimmed)) {
      onChangeChoices([...choices, trimmed]);
      setNewChoiceInput('');
    }
  };

  const handleRemoveChoice = (choiceToRemove: string) => {
    if (choices.length > 1) {
      onChangeChoices(choices.filter((c) => c !== choiceToRemove));
    }
  };

  // Questions matching active primitive
  const primitiveQuestions = useMemo(() => {
    return questions.filter((q) => q.type === activePrimitive);
  }, [questions, activePrimitive]);

  const currentPresets = activeQuestion?.presets || [];

  return (
    <div className="bg-[#0f172a]/90 border border-gray-800 rounded-xl p-5 flex flex-col space-y-5 shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">2. Question & State Workspace</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              activePrimitive === 'noul'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : activePrimitive === 'score'
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
            }`}
          >
            Primitive: {activePrimitive}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
            Returns: {activePrimitive === 'noul' ? 'boolean' : activePrimitive === 'score' ? 'number [0, 1]' : 'choice string'}
          </span>
        </div>
      </div>

      {/* 1. JEV Primitives Selector (All Three: Noul, Score, Choice) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Select JEV Primitive</span>
          </span>
          <span className="text-[10px] text-gray-500 font-mono">System One Decision Model</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* Noul */}
          <button
            type="button"
            onClick={() => onSelectPrimitive('noul')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activePrimitive === 'noul'
                ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Noul</span>
              <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">Binary</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 leading-snug">
              Truth judgment (true/false) with confidence
            </p>
          </button>

          {/* Score */}
          <button
            type="button"
            onClick={() => onSelectPrimitive('score')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activePrimitive === 'score'
                ? 'bg-blue-500/15 border-blue-500/60 ring-1 ring-blue-500/30'
                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300">Score</span>
              <span className="text-[9px] font-mono px-1 rounded bg-blue-500/20 text-blue-300">[0.0, 1.0]</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 leading-snug">
              Continuous ordered metric with rationale
            </p>
          </button>

          {/* Choice */}
          <button
            type="button"
            onClick={() => onSelectPrimitive('choice')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activePrimitive === 'choice'
                ? 'bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/30'
                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300">Choice</span>
              <span className="text-[9px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">Multi</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 leading-snug">
              Selection across alternatives with probabilities
            </p>
          </button>
        </div>
      </div>

      {/* 2. Question Mode (Registered Catalog vs Custom Question) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Question Definition</span>
          </label>
          <div className="flex items-center space-x-1 bg-gray-950 p-0.5 rounded-md border border-gray-800 text-[10px]">
            <button
              type="button"
              onClick={() => onToggleCustomQuestion(false)}
              className={`px-2 py-0.5 rounded transition-colors ${
                !isCustomQuestion ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Registered Catalog
            </button>
            <button
              type="button"
              onClick={() => onToggleCustomQuestion(true)}
              className={`px-2 py-0.5 rounded transition-colors ${
                isCustomQuestion ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Custom Question
            </button>
          </div>
        </div>

        {!isCustomQuestion ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {primitiveQuestions.map((q) => {
              const isSelected = activeQuestion?.id === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelectQuestion(q)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/60 ring-1 ring-blue-500/30'
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
        ) : (
          <div className="space-y-1.5">
            <input
              type="text"
              value={customQuestionText}
              onChange={(e) => onChangeCustomQuestionText(e.target.value)}
              placeholder="e.g. Is this food item safe for gluten-sensitive diets? Evaluate based on ingredients."
              className="w-full bg-[#090d16] border border-gray-800 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-gray-400">
              Provide an atomic question or prompt instruction for the {activePrimitive.toUpperCase()} evaluation.
            </p>
          </div>
        )}
      </div>

      {/* 3. If Choice Primitive: Candidate Choices Tag Editor */}
      {activePrimitive === 'choice' && (
        <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Candidate Choices (Alternatives)</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">{choices.length} options defined</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {choices.map((choice) => (
              <span
                key={choice}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono"
              >
                <span>{choice}</span>
                {choices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(choice)}
                    className="text-purple-400 hover:text-purple-200 transition-colors"
                    title={`Remove ${choice}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              value={newChoiceInput}
              onChange={(e) => setNewChoiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChoice();
                }
              }}
              placeholder="Add another alternative option..."
              className="flex-1 bg-[#090d16] border border-gray-800 rounded px-2.5 py-1 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleAddChoice}
              disabled={!newChoiceInput.trim()}
              className="px-2.5 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center space-x-1 disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Question Details Accordion */}
      {activeQuestion && !isCustomQuestion && (
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

      {/* 4. Interactive JSON State Editor */}
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
            {currentPresets.length > 0 && !isCustomQuestion && (
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
        <div className="relative flex-1 min-h-[200px]">
          <textarea
            value={stateJson}
            onChange={(e) => onChangeStateJson(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className={`w-full h-full min-h-[200px] bg-[#090d16] border rounded-lg p-3 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-y ${
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

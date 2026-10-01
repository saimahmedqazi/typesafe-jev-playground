import React, { useState } from 'react';
import { 
  Code, 
  Table, 
  Copy, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ErrorDetails, JevAnswer, QuestionsMap } from '../../core';

export interface ResultInspectorProps {
  isEvaluating: boolean;
  response: any;
  error: ErrorDetails | null;
  questionsMap: QuestionsMap;
  modelName: string;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function ResultInspector({
  isEvaluating,
  response,
  error,
  questionsMap,
  modelName,
  hasApiKey,
  onOpenSettings,
}: ResultInspectorProps) {
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = () => {
    if (!response && !error) return;
    const textToCopy = JSON.stringify(response || { success: false, error }, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const questionKeys = Object.keys(questionsMap);
  const answers: Record<string, JevAnswer> = response?.answers || (response?.result ? {
    [response.result.id || questionKeys[0] || 'question']: {
      type: response.result.type,
      noul: response.result.value ? 0.98 : 0.02,
      verdict: Boolean(response.result.value),
      score: typeof response.result.value === 'number' ? response.result.value : 0.5,
      choice: String(response.result.value ?? ''),
      probabilities: response.result.probabilities,
      confidence: response.result.confidence,
      rationale: response.result.explanation,
    }
  } : {});

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-md">
      {/* Header matching official TypeSafe AI Response pane */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-gray-800 text-xs">
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="font-semibold text-gray-200">Response</span>
          {response && (
            <span className="text-[11px] text-gray-500 font-mono">
              &bull; Ran {response.metadata?.durationMs || response.durationMs || 400}ms ago
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'table' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Table View"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'raw' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Raw JSON View"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Warning / Out of funds / No API Key Banner (Matches official screenshot banner) */}
        {!hasApiKey && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>No API key configured. Provide an API key to run evaluations.</span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Add API key in Settings &rarr;
            </button>
          </div>
        )}

        {/* Evaluation Loading State */}
        {isEvaluating && (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[250px]">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
            <p className="text-xs text-gray-400 font-medium">Evaluating state across JEV primitives...</p>
          </div>
        )}

        {/* Error State */}
        {!isEvaluating && error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-300">{error.code}</span>
                <p className="text-rose-200 text-[11px] mt-0.5">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {!isEvaluating && !error && response && viewMode === 'table' && (
          <div className="border border-gray-800 rounded-lg overflow-hidden text-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-[#161b22] px-3 py-2 text-[11px] text-gray-400 font-semibold border-b border-gray-800">
              <div className="col-span-6">Key & instructions</div>
              <div className="col-span-4">{modelName}</div>
              <div className="col-span-2 text-right">Primitive type</div>
            </div>

            {/* Question Rows */}
            <div className="divide-y divide-gray-800/80">
              {questionKeys.map((key) => {
                const qDef = questionsMap[key];
                const ans = answers[key];
                const qType = qDef?.type || ans?.type || 'noul';

                return (
                  <div key={key} className="grid grid-cols-12 px-3 py-3 gap-2 hover:bg-gray-900/30 transition-colors">
                    {/* Column 1: Key & instructions & criteria */}
                    <div className="col-span-6 space-y-1">
                      <div className="font-mono font-bold text-gray-200 text-xs">{key}</div>
                      <div className="text-[11px] text-gray-400 leading-snug">
                        {qDef?.instructions || key}
                      </div>

                      {/* Criteria breakdown */}
                      {qDef?.criteria && (
                        <div className="pt-1.5 space-y-0.5 text-[10px] text-gray-500 font-mono">
                          {Array.isArray(qDef.criteria) ? (
                            <div className="flex flex-wrap gap-1">
                              {qDef.criteria.map((c, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800">
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            Object.entries(qDef.criteria).map(([cKey, cVal]) => (
                              <div key={cKey} className="truncate">
                                <span className="text-gray-400 capitalize">{cKey}:</span> {String(cVal)}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Model Decision Output */}
                    <div className="col-span-4 space-y-1.5">
                      {ans ? (
                        <>
                          {ans.type === 'noul' && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                    ans.verdict || ans.noul >= 0.5
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {ans.verdict || ans.noul >= 0.5 ? 'True' : 'False'}
                                </span>
                                <span className="font-mono text-[11px] text-gray-300">
                                  {(ans.noul * 100).toFixed(1)}% prob
                                </span>
                              </div>
                              {ans.rationale && (
                                <p className="text-[10px] text-gray-400 line-clamp-2">{ans.rationale}</p>
                              )}
                            </div>
                          )}

                          {ans.type === 'score' && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-sm text-white">
                                  {ans.score.toFixed(3)}
                                </span>
                                {ans.legend && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                    {ans.legend}
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${Math.min(100, Math.max(0, ans.score * 100))}%` }}
                                />
                              </div>
                              {ans.rationale && (
                                <p className="text-[10px] text-gray-400 line-clamp-2">{ans.rationale}</p>
                              )}
                            </div>
                          )}

                          {ans.type === 'choice' && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  {ans.choice}
                                </span>
                                {ans.confidence !== undefined && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {(ans.confidence * 100).toFixed(0)}% conf
                                  </span>
                                )}
                              </div>

                              {ans.probabilities && (
                                <div className="space-y-1 pt-0.5">
                                  {Object.entries(ans.probabilities).slice(0, 3).map(([opt, prob]) => {
                                    const p = typeof prob === 'number' ? prob : 0;
                                    return (
                                      <div key={opt} className="flex items-center justify-between text-[9px] font-mono text-gray-400">
                                        <span className={opt.toLowerCase() === ans.choice.toLowerCase() ? 'text-purple-300 font-semibold' : ''}>
                                          {opt}
                                        </span>
                                        <span>{(p * 100).toFixed(0)}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {ans.rationale && (
                                <p className="text-[10px] text-gray-400 line-clamp-2">{ans.rationale}</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 text-[11px] italic">Not evaluated</span>
                      )}
                    </div>

                    {/* Column 3: Primitive type badge */}
                    <div className="col-span-2 text-right">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {qType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Raw JSON View */}
        {!isEvaluating && !error && response && viewMode === 'raw' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono text-[11px]">JSON Response Payload</span>
              <button
                type="button"
                onClick={handleCopyRaw}
                className="px-2 py-1 rounded bg-[#21262d] hover:bg-gray-800 border border-gray-700 text-gray-300 text-[11px] flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[#090d16] border border-gray-800 overflow-auto max-h-[380px]">
              <pre className="font-mono text-[11px] text-gray-300 whitespace-pre">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Empty state before running */}
        {!isEvaluating && !error && !response && hasApiKey && (
          <div className="flex flex-col items-center justify-center p-12 space-y-2 text-center text-gray-500 min-h-[250px]">
            <Sparkles className="w-6 h-6 text-gray-600 mb-1" />
            <p className="text-xs font-medium text-gray-400">Ready to evaluate</p>
            <p className="text-[11px] max-w-xs">
              Configure your state and questions in the editor, then click Run request (or press Ctrl + Enter).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

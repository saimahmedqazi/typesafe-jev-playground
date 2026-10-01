import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Hash, 
  Cpu, 
  Layers, 
  Code, 
  Copy, 
  Check, 
  Sparkles, 
  Server,
  Activity,
  MessageSquare
} from 'lucide-react';
import { EvaluationResponse, NoulResult, ScoreResult, ErrorDetails } from '../../core';

export interface ResultInspectorProps {
  isEvaluating: boolean;
  response: EvaluationResponse | null;
  error: ErrorDetails | null;
}

export function ResultInspector({ isEvaluating, response, error }: ResultInspectorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = () => {
    if (!response && !error) return;
    const textToCopy = JSON.stringify(response || { success: false, error }, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreTier = (score: number) => {
    if (score >= 0.9) return { label: 'Pristine Excellence', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 0.7) return { label: 'High Quality', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (score >= 0.4) return { label: 'Moderate Quality', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Degraded / Deficient', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const getErrorGuidance = (code: string) => {
    switch (code) {
      case 'MISSING_CREDENTIAL':
        return 'Please provide your API key in Column 1 (Configuration). For LLM Practice Mode, enter your OpenAI, Anthropic, or Gemini key. For Native Jev Mode, provide your native Jev API key.';
      case 'INVALID_CREDENTIAL':
        return 'The provider rejected your API key. Check that your API key is active, properly formatted, and that your account balance or quota is sufficient.';
      case 'RATE_LIMITED':
        return 'Rate limit exceeded. Please wait a few moments before running another evaluation.';
      case 'INVALID_STATE':
        return 'The target JSON state does not meet the requirements for this atomic question. Review the question guidelines in Column 2.';
      case 'PAYLOAD_TOO_LARGE':
        return 'The state payload exceeds the 100KB limit. Trim unnecessary attributes before evaluating.';
      default:
        return 'Review your configuration and state, then try again.';
    }
  };

  return (
    <div className="bg-[#0f172a]/90 border border-gray-800 rounded-xl p-5 flex flex-col space-y-5 shadow-sm">
      {/* Header & Tab Switcher */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">3. Result Inspector</h2>
        </div>

        {(response || error) && (
          <div className="flex items-center space-x-1 p-0.5 bg-gray-950 border border-gray-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'visual' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'raw' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Raw JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* State 1: Evaluating Loader */}
      {isEvaluating && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
            <Sparkles className="w-5 h-5 text-blue-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-white">Running Evaluation Pipeline...</p>
            <p className="text-[11px] text-gray-400">
              Validating state against question schema & executing adapter
            </p>
          </div>
        </div>
      )}

      {/* State 2: Empty Initial State */}
      {!isEvaluating && !response && !error && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px] text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500">
            <Layers className="w-6 h-6" />
          </div>
          <div className="max-w-xs space-y-1.5">
            <p className="text-xs font-semibold text-gray-300">No Evaluation Performed Yet</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Configure your credentials on the left, author or load a state in the workspace, and click <strong className="text-gray-300">Run Evaluation</strong>.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400 pt-2">
            <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800">State</span>
            <span>+</span>
            <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800">Question</span>
            <span>+</span>
            <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800">Mode</span>
            <span>&rarr;</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Result</span>
          </div>
        </div>
      )}

      {/* State 3: Error State */}
      {!isEvaluating && (error || (response && !response.success)) && (
        <div className="flex-1 flex flex-col space-y-4">
          {(() => {
            const err = error || (!response?.success ? response?.error : null);
            if (!err) return null;
            return (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col space-y-3">
                <div className="flex items-start space-x-2.5">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-rose-300">Evaluation Failed</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200">
                        {err.code}
                      </span>
                      {err.statusCode && (
                        <span className="text-[10px] font-mono text-gray-400">
                          HTTP {err.statusCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-200">{err.message}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-950/70 border border-gray-800/80 text-[11px] text-gray-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-gray-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>How to Resolve</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">{getErrorGuidance(err.code)}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* State 4: Success Result */}
      {!isEvaluating && response && response.success && (
        <div className="flex-1 flex flex-col space-y-5">
          {activeTab === 'visual' ? (
            <>
              {/* Primary Result Card */}
              {response.result.type === 'noul' && (
                <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Noul Truth Judgment</span>
                    {response.result.confidence !== undefined && (
                      <span className="text-[11px] font-mono text-gray-300">
                        Confidence: {(response.result.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`px-4 py-2 rounded-lg font-mono font-bold text-base tracking-wider flex items-center space-x-2 ${
                        response.result.value
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {response.result.value ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>TRUE</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span>FALSE</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 font-medium">
                      {response.result.value
                        ? 'State satisfies the atomic criteria'
                        : 'State does not satisfy the atomic criteria'}
                    </p>
                  </div>

                  {response.result.confidence !== undefined && (
                    <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          response.result.value ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, response.result.confidence * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {response.result.type === 'score' && (
                <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Continuous Score Metric</span>
                    {(() => {
                      const tier = getScoreTier(response.result.value);
                      return (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${tier.color}`}>
                          {tier.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="font-mono text-3xl font-bold text-white tracking-tight">
                      {response.result.value.toFixed(3)}
                    </span>
                    <span className="text-xs font-mono text-gray-400">/ 1.000</span>
                  </div>

                  <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, response.result.value * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {response.result.type === 'choice' && (
                <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Choice Classification</span>
                    {response.result.confidence !== undefined && (
                      <span className="text-[11px] font-mono text-gray-300">
                        Confidence: {(response.result.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 rounded-lg font-mono font-bold text-base tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      <span>{response.result.value}</span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium">
                      Categorized as {response.result.value}
                    </p>
                  </div>

                  {/* Probability Distribution Breakdown */}
                  {response.result.probabilities && Object.keys(response.result.probabilities).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-800/80">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Probability Distribution</span>
                        <span>Estimated Likelihood</span>
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(response.result.probabilities)
                          .sort(([, a], [, b]) => b - a)
                          .map(([choice, prob]) => {
                            const isSelected = choice.toLowerCase() === String(response.result.value).toLowerCase();
                            const pct = Math.round(prob * 100);
                            return (
                              <div key={choice} className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className={isSelected ? 'text-purple-300 font-bold' : 'text-gray-400'}>
                                    {choice}
                                  </span>
                                  <span className={isSelected ? 'text-purple-300 font-bold' : 'text-gray-500'}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      isSelected ? 'bg-purple-500' : 'bg-gray-700'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rationale / Explanation Box */}
              {response.result.explanation && (
                <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 font-semibold text-gray-300">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Evaluation Rationale</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {response.result.explanation}
                  </p>
                </div>
              )}

              {/* Performance Metrics Bar */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800/80 space-y-1">
                  <div className="flex items-center space-x-1 text-gray-400 text-[10px] uppercase font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Duration</span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-white">
                    {response.metadata.durationMs}ms
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800/80 space-y-1">
                  <div className="flex items-center space-x-1 text-gray-400 text-[10px] uppercase font-mono">
                    <Hash className="w-3 h-3 text-emerald-400" />
                    <span>Tokens</span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-white">
                    {response.metadata.tokenUsage?.totalTokens !== undefined
                      ? `${response.metadata.tokenUsage.totalTokens} total`
                      : 'N/A (Native)'}
                  </div>
                </div>
              </div>

              {/* Execution Metadata Pill */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 border-t border-gray-800 pt-3">
                <div className="flex items-center space-x-1.5">
                  {response.metadata.mode === 'native-jev' ? (
                    <Server className="w-3 h-3 text-purple-400" />
                  ) : (
                    <Cpu className="w-3 h-3 text-blue-400" />
                  )}
                  <span>
                    {response.metadata.provider || 'native-jev'}{' '}
                    {response.metadata.model ? `(${response.metadata.model})` : ''}
                  </span>
                </div>
                <span>{response.metadata.requestId}</span>
              </div>
            </>
          ) : (
            /* Raw JSON Output Inspector */
            <div className="relative flex-1 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px] font-mono">Verbatim API Payload</span>
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="px-2 py-1 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex-1 bg-[#090d16] border border-gray-800 rounded-lg p-3 overflow-auto max-h-[360px]">
                <pre className="font-mono text-[11px] text-gray-300 whitespace-pre">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

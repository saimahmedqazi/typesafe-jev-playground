import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { ResultInspector } from './components/ResultInspector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ClientQuestion, ClientPreset, WorkbenchConfig, WorkbenchHealth } from './types';
import { EvaluationResponse, ErrorDetails, EvaluationErrorCode } from '../core';
import { PROVIDER_DEFAULT_MODELS } from '../adapters/types';
import {
  ExperimentRecord,
  loadExperimentHistory,
  saveExperimentRecord,
  deleteExperimentRecord,
  clearExperimentHistory,
} from './history';

export default function App() {
  // 1. Health & API status
  const [health, setHealth] = useState<WorkbenchHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // 2. Questions & Presets catalog
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ClientQuestion | null>(null);

  // 3. Configuration State (held in memory only)
  const [config, setConfig] = useState<WorkbenchConfig>({
    mode: 'llm-practice',
    provider: 'openai',
    model: PROVIDER_DEFAULT_MODELS.openai,
    temperature: 0,
    llmApiKey: '',
    nativeJevKey: '',
    nativeOrgId: '',
  });

  // 4. State Editor
  const [stateJson, setStateJson] = useState<string>('{\n  "object": "sandwich",\n  "bread": true,\n  "filling": "chicken",\n  "sauce": true,\n  "sliced_bread": true\n}');

  // 5. Evaluation execution state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResponse, setEvaluationResponse] = useState<EvaluationResponse | null>(null);
  const [evaluationError, setEvaluationError] = useState<ErrorDetails | null>(null);

  // 6. Local Experiment History state
  const [historyRecords, setHistoryRecords] = useState<ExperimentRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Poll health status on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: WorkbenchHealth) => {
        setHealth(data);
        setLoadingHealth(false);
      })
      .catch((err) => {
        setHealthError(err.message);
        setLoadingHealth(false);
      });
  }, []);

  // Fetch questions on mount
  useEffect(() => {
    fetch('/api/questions')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.questions)) {
          setQuestions(data.questions);
          if (data.questions.length > 0) {
            const first = data.questions[0];
            setActiveQuestion(first);
            if (first.defaultState) {
              setStateJson(JSON.stringify(first.defaultState, null, 2));
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load questions:', err);
      });
  }, []);

  // Load experiment history on mount
  useEffect(() => {
    setHistoryRecords(loadExperimentHistory());
  }, []);

  // Update question selection
  const handleSelectQuestion = (q: ClientQuestion) => {
    setActiveQuestion(q);
    if (q.defaultState) {
      setStateJson(JSON.stringify(q.defaultState, null, 2));
    }
  };

  // Format JSON action
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(stateJson);
      setStateJson(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  };

  // Reset state action
  const handleResetState = () => {
    if (activeQuestion?.defaultState) {
      setStateJson(JSON.stringify(activeQuestion.defaultState, null, 2));
    }
  };

  // Load preset action
  const handleLoadPreset = (preset: ClientPreset) => {
    setStateJson(JSON.stringify(preset.state, null, 2));
  };

  // Partial config updater
  const handleConfigChange = (updated: Partial<WorkbenchConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  // Execute Evaluation Pipeline
  const handleRunEvaluation = useCallback(async () => {
    if (!activeQuestion || isEvaluating) return;

    let parsedState: Record<string, unknown>;
    try {
      parsedState = JSON.parse(stateJson);
      if (typeof parsedState !== 'object' || parsedState === null || Array.isArray(parsedState)) {
        return;
      }
    } catch {
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    setEvaluationResponse(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.mode === 'llm-practice') {
      if (config.llmApiKey) {
        headers['x-user-llm-key'] = config.llmApiKey;
        headers['x-user-llm-provider'] = config.provider;
      }
    } else if (config.mode === 'native-jev') {
      if (config.nativeJevKey) {
        headers['x-user-jev-key'] = config.nativeJevKey;
      }
      if (config.nativeOrgId) {
        headers['x-user-jev-org'] = config.nativeOrgId;
      }
    }

    const payload = {
      mode: config.mode,
      questionId: activeQuestion.id,
      questionType: activeQuestion.type,
      state: parsedState,
      modelConfig:
        config.mode === 'llm-practice'
          ? {
              provider: config.provider,
              model: config.model,
              temperature: config.temperature,
            }
          : undefined,
    };

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEvaluationResponse(data);

        // Record experiment in local history (without credentials)
        saveExperimentRecord({
          mode: config.mode,
          questionId: activeQuestion.id,
          questionName: activeQuestion.name,
          questionType: activeQuestion.type,
          state: parsedState,
          modelConfig:
            config.mode === 'llm-practice'
              ? {
                  provider: config.provider,
                  model: config.model,
                  temperature: config.temperature,
                }
              : undefined,
          result: data.result,
          metadata: data.metadata,
        });

        setHistoryRecords(loadExperimentHistory());
      } else {
        setEvaluationError(
          data.error || {
            code: EvaluationErrorCode.INTERNAL_ERROR,
            message: data.message || `Evaluation returned HTTP ${res.status}`,
            statusCode: res.status,
          }
        );
      }
    } catch (err) {
      setEvaluationError({
        code: EvaluationErrorCode.PROVIDER_ERROR,
        message: err instanceof Error ? err.message : 'Failed to reach evaluation API',
        statusCode: 500,
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [activeQuestion, isEvaluating, stateJson, config]);

  // Load a historical experiment back into the workbench
  const handleLoadExperiment = (record: ExperimentRecord) => {
    setConfig((prev) => ({
      ...prev,
      mode: record.mode,
      ...(record.modelConfig
        ? {
            provider: record.modelConfig.provider as any,
            model: record.modelConfig.model,
            temperature: record.modelConfig.temperature ?? prev.temperature,
          }
        : {}),
    }));

    const matchingQ = questions.find((q) => q.id === record.questionId);
    if (matchingQ) {
      setActiveQuestion(matchingQ);
    }

    setStateJson(JSON.stringify(record.state, null, 2));

    // Show previous result immediately
    setEvaluationResponse({
      success: true,
      result: record.result,
      metadata: {
        ...record.metadata,
        mode: record.mode,
        timestamp: record.timestamp,
      },
    });

    setIsHistoryOpen(false);
  };

  // Delete an individual record
  const handleDeleteRecord = (id: string) => {
    deleteExperimentRecord(id);
    setHistoryRecords(loadExperimentHistory());
  };

  // Clear all history
  const handleClearHistory = () => {
    clearExperimentHistory();
    setHistoryRecords([]);
  };

  // Keyboard shortcut listener (Ctrl+Enter or Cmd+Enter)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunEvaluation();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleRunEvaluation]);

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-200 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        health={health}
        loadingHealth={loadingHealth}
        healthError={healthError}
        historyCount={historyRecords.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 flex flex-col space-y-5">
        {/* Semantic Boundary Banner */}
        <section className="bg-[#0f172a]/70 border border-blue-500/30 rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-xs font-semibold text-white tracking-wide uppercase">
                Architecture &amp; Semantic Boundary
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong>LLM Practice Mode</strong> allows you to experiment with JEV concepts (State, Atomic Questions, Noul, Score) using your personal LLM API key. It is an educational practice environment and does not claim equivalence to native Jev execution. Users with official access can switch to <strong>Native Jev Mode</strong> to run evaluations directly on official Jev infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* 3-Column Developer Workbench Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
          {/* Column 1: Configuration (3.5 cols) */}
          <div className="lg:col-span-3">
            <ConfigPanel config={config} onChange={handleConfigChange} />
          </div>

          {/* Column 2: Question & State Workspace (5 cols) */}
          <div className="lg:col-span-5">
            <WorkspacePanel
              questions={questions}
              activeQuestion={activeQuestion}
              onSelectQuestion={handleSelectQuestion}
              stateJson={stateJson}
              onChangeStateJson={setStateJson}
              onFormatJson={handleFormatJson}
              onResetState={handleResetState}
              onLoadPreset={handleLoadPreset}
              onRunEvaluation={handleRunEvaluation}
              isEvaluating={isEvaluating}
              canRun={Boolean(
                activeQuestion &&
                  (config.mode === 'llm-practice' ? config.llmApiKey : config.nativeJevKey)
              )}
            />
          </div>

          {/* Column 3: Result Inspector (3.5 cols) */}
          <div className="lg:col-span-4">
            <ResultInspector
              isEvaluating={isEvaluating}
              response={evaluationResponse}
              error={evaluationError}
            />
          </div>
        </section>
      </main>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={historyRecords}
        onLoadRecord={handleLoadExperiment}
        onDeleteRecord={handleDeleteRecord}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0d121f] px-6 py-3 text-center text-xs text-gray-500 flex items-center justify-between">
        <span>TypeSafe Jev Playground &bull; MIT License</span>
        <span className="font-mono text-[11px]">Strict BYOK &bull; Zero Server Persistence</span>
      </footer>
    </div>
  );
}

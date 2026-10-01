import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Terminal, 
  BookOpen, 
  Sliders, 
  History, 
  Key, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { WorkspacePanel } from './components/WorkspacePanel';
import { ResultInspector } from './components/ResultInspector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { WalkthroughModal, WALKTHROUGH_STORAGE_KEY } from './components/WalkthroughModal';
import { WorkbenchConfig, WorkbenchHealth } from './types';
import { EvaluationResponse, ErrorDetails, EvaluationErrorCode, QuestionsMap } from '../core';
import { PROVIDER_DEFAULT_MODELS } from '../adapters/types';
import { StatePreset } from '../registry/presets';
import {
  ExperimentRecord,
  loadExperimentHistory,
  saveExperimentRecord,
  deleteExperimentRecord,
  clearExperimentHistory,
} from './history';

const DEFAULT_OFFICIAL_STATE = `{
  "food": "Burger",
  "definition": "A sandwich is defined as a dish consisting of fillings placed between two or more slices of bread, or a split roll or bun. The key components are a bread-like carrier and a distinct filling."
}`;

const DEFAULT_OFFICIAL_QUESTIONS = `{
  "is_sandwich": {
    "type": "noul",
    "instructions": "Is \`food\` a sandwich?",
    "criteria": {
      "true": "A sandwich is a kebab closed in bun",
      "false": "The food has no bread enclosing a filling or uses only a single slice of bread, or uses a non-bread wrapper such as a tortilla, wafer, or cookie."
    }
  }
}`;

export default function App() {
  // 1. Health & API status
  const [health, setHealth] = useState<WorkbenchHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // 2. Navigation tab state
  const [currentTab, setCurrentTab] = useState<'playground' | 'usage'>('playground');

  // 3. Configuration State (held in memory only)
  const [config, setConfig] = useState<WorkbenchConfig>({
    mode: 'llm-practice',
    provider: 'groq',
    model: PROVIDER_DEFAULT_MODELS.groq,
    temperature: 0,
    llmApiKey: '',
    nativeJevKey: '',
    nativeOrgId: '',
    customEndpoint: '',
  });

  // 4. Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);

  // 5. Official Workspace state: State JSON + Questions JSON
  const [stateJson, setStateJson] = useState<string>(DEFAULT_OFFICIAL_STATE);
  const [questionsJson, setQuestionsJson] = useState<string>(DEFAULT_OFFICIAL_QUESTIONS);

  // 6. Evaluation execution state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResponse, setEvaluationResponse] = useState<EvaluationResponse | null>(null);
  const [evaluationError, setEvaluationError] = useState<ErrorDetails | null>(null);

  // 7. Local Experiment History state
  const [historyRecords, setHistoryRecords] = useState<ExperimentRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // First-time walkthrough check
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const seen = window.localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
        if (!seen) {
          setIsWalkthroughOpen(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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

  // Load experiment history on mount
  useEffect(() => {
    setHistoryRecords(loadExperimentHistory());
  }, []);

  // Parse questions JSON for UI table rendering
  const parsedQuestionsMap: QuestionsMap = useMemo(() => {
    try {
      const parsed = JSON.parse(questionsJson);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch {
      return {};
    }
  }, [questionsJson]);

  // Model display name
  const activeModelName = config.mode === 'native-jev'
    ? 'native-jev-systemone'
    : `${config.provider}/${config.model}`;

  // Update workbench configuration
  const handleConfigChange = (updated: Partial<WorkbenchConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  // Format JSON action for both State and Questions
  const handleFormatAll = () => {
    try {
      const parsedState = JSON.parse(stateJson);
      setStateJson(JSON.stringify(parsedState, null, 2));
    } catch {
      // ignore syntax error
    }
    try {
      const parsedQuestions = JSON.parse(questionsJson);
      setQuestionsJson(JSON.stringify(parsedQuestions, null, 2));
    } catch {
      // ignore syntax error
    }
  };

  // Clear workspace
  const handleClear = () => {
    setStateJson('{}');
    setQuestionsJson('{}');
    setEvaluationResponse(null);
    setEvaluationError(null);
  };

  // Load Preset
  const handleLoadPreset = (preset: StatePreset) => {
    setStateJson(JSON.stringify(preset.state, null, 2));
    if (preset.questions) {
      setQuestionsJson(JSON.stringify(preset.questions, null, 2));
    } else {
      setQuestionsJson(
        JSON.stringify(
          {
            [preset.questionId]: {
              type: 'noul',
              instructions: `Evaluate ${preset.name}`,
            },
          },
          null,
          2
        )
      );
    }
    setEvaluationResponse(null);
    setEvaluationError(null);
  };

  // Add Question Template (Noul, Score, Choice)
  const handleAddQuestionTemplate = (type: 'noul' | 'score' | 'choice') => {
    try {
      const current = JSON.parse(questionsJson);
      const count = Object.keys(current).length + 1;
      const key = `${type}_question_${count}`;

      if (type === 'noul') {
        current[key] = {
          type: 'noul',
          instructions: `Does the state satisfy criteria for ${key}?`,
          criteria: {
            true: 'Conditions are met completely.',
            false: 'Conditions are not met.',
          },
        };
      } else if (type === 'score') {
        current[key] = {
          type: 'score',
          instructions: `Rate the intensity or quality for ${key}.`,
          criteria: ['Low / None', 'Moderate', 'Substantial', 'Maximum'],
        };
      } else if (type === 'choice') {
        current[key] = {
          type: 'choice',
          instructions: `Select the most applicable category for ${key}.`,
          criteria: {
            primary: 'Primary option category',
            secondary: 'Secondary option category',
            other: 'Other / alternative category',
          },
        };
      }
      setQuestionsJson(JSON.stringify(current, null, 2));
    } catch (err) {
      console.error('Cannot add question template to invalid JSON:', err);
    }
  };

  // Run Evaluation
  const handleRunEvaluation = useCallback(async () => {
    let parsedState: Record<string, unknown>;
    try {
      parsedState = JSON.parse(stateJson);
      if (typeof parsedState !== 'object' || parsedState === null) {
        return;
      }
    } catch {
      return;
    }

    let parsedQuestions: QuestionsMap;
    try {
      parsedQuestions = JSON.parse(questionsJson);
      if (typeof parsedQuestions !== 'object' || parsedQuestions === null || Array.isArray(parsedQuestions)) {
        return;
      }
    } catch {
      return;
    }

    if (Object.keys(parsedQuestions).length === 0) {
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
        if (config.customEndpoint) {
          headers['x-user-llm-endpoint'] = config.customEndpoint;
        }
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
      state: parsedState,
      questions: parsedQuestions,
      modelConfig:
        config.mode === 'llm-practice'
          ? {
              provider: config.provider,
              model: config.model,
              temperature: config.temperature,
              ...(config.customEndpoint ? { customEndpoint: config.customEndpoint } : {}),
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
          questions: parsedQuestions,
          state: parsedState,
          modelConfig:
            config.mode === 'llm-practice'
              ? {
                  provider: config.provider,
                  model: config.model,
                  temperature: config.temperature,
                }
              : undefined,
          answers: data.answers,
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
        message: err instanceof Error ? err.message : 'Network request failed',
        statusCode: 500,
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [stateJson, questionsJson, config]);

  // Load a historical experiment record back into workbench
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

    if (record.state) {
      setStateJson(JSON.stringify(record.state, null, 2));
    }

    if (record.questions) {
      setQuestionsJson(JSON.stringify(record.questions, null, 2));
    }

    // Show previous result immediately
    if (record.answers || record.result) {
      setEvaluationResponse({
        success: true,
        answers: record.answers,
        result: record.result,
        metadata: {
          ...record.metadata,
          mode: record.mode,
          timestamp: record.timestamp,
        },
      });
    }

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

  const hasConfiguredKey = Boolean(
    config.mode === 'llm-practice'
      ? config.llmApiKey && config.llmApiKey.trim().length > 0
      : config.nativeJevKey && config.nativeJevKey.trim().length > 0
  );

  return (
    <div className="flex h-screen bg-[#070a12] text-gray-200 overflow-hidden font-sans">
      {/* Official Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        hasKey={hasConfiguredKey}
        historyCount={historyRecords.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-13 border-b border-gray-800/80 bg-[#090d16]/95 backdrop-blur px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
              TypeSafe AI Playground
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {config.mode === 'native-jev' ? 'Native Jev Mode' : 'LLM Practice Mode (BYOK)'}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Guide link */}
            <button
              type="button"
              onClick={() => setIsWalkthroughOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 transition-colors flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Guide</span>
            </button>

            {/* History link */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 transition-colors flex items-center space-x-1.5"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>History</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300">
                {historyRecords.length}
              </span>
            </button>

            {/* Settings link */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs text-gray-200 transition-colors flex items-center space-x-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Settings</span>
              {hasConfiguredKey ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* 2-Column Playground Grid (50% State & Questions | 50% Response Table) */}
        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
          {/* Column 1: State & Questions Editor */}
          <div className="h-full min-h-0 flex flex-col">
            <WorkspacePanel
              stateJson={stateJson}
              onChangeStateJson={setStateJson}
              questionsJson={questionsJson}
              onChangeQuestionsJson={setQuestionsJson}
              onFormatAll={handleFormatAll}
              onClear={handleClear}
              onLoadPreset={handleLoadPreset}
              onAddQuestionTemplate={handleAddQuestionTemplate}
              activeModelName={activeModelName}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onRunEvaluation={handleRunEvaluation}
              isEvaluating={isEvaluating}
              canRun={Boolean(
                hasConfiguredKey && Object.keys(parsedQuestionsMap).length > 0
              )}
            />
          </div>

          {/* Column 2: Response Table Inspector */}
          <div className="h-full min-h-0 flex flex-col">
            <ResultInspector
              isEvaluating={isEvaluating}
              response={evaluationResponse}
              error={evaluationError}
              questionsMap={parsedQuestionsMap}
              modelName={activeModelName}
              hasApiKey={hasConfiguredKey}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChange={handleConfigChange}
      />

      {/* Walkthrough / Guide Modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={historyRecords}
        onLoadRecord={handleLoadExperiment}
        onDeleteRecord={handleDeleteRecord}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

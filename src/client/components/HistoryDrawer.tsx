import React from 'react';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Sparkles, 
  Server, 
  History,
  Hash
} from 'lucide-react';
import { ExperimentRecord } from '../history';

export interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExperimentRecord[];
  onLoadRecord: (record: ExperimentRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  records,
  onLoadRecord,
  onDeleteRecord,
  onClearHistory,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0d121f] border-l border-gray-800 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Experiment History</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {records.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {records.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors flex items-center space-x-1"
                  title="Clear all experiment records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 text-gray-400">
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-300">No History Records Yet</p>
                  <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                    Evaluations run from the workbench will automatically be saved locally without credentials.
                  </p>
                </div>
              </div>
            ) : (
              records.map((record) => (
                <div
                  key={record.id}
                  className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 hover:border-gray-700 transition-all flex flex-col space-y-2.5 shadow-sm"
                >
                  {/* Top Bar: Mode & Timestamp */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-mono px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        record.mode === 'native-jev'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      {record.mode}
                    </span>

                    <span className="text-gray-500 font-mono text-[10px]">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {/* Question Info */}
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">{record.questionName}</div>
                    <div className="text-[10px] font-mono text-gray-400">
                      ID: {record.questionId} &bull; Type: {record.questionType}
                    </div>
                  </div>

                  {/* Result Summary */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#090d16] border border-gray-850">
                    {record.result.type === 'noul' ? (
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-mono font-bold flex items-center space-x-1 ${
                            record.result.value ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {record.result.value ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{record.result.value ? 'TRUE' : 'FALSE'}</span>
                        </span>
                        {record.result.confidence !== undefined && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({(record.result.confidence * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-baseline space-x-1.5 font-mono">
                        <span className="text-sm font-bold text-white">
                          {record.result.value.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-gray-400">/ 1.000</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        <span>{record.metadata.durationMs}ms</span>
                      </span>
                      {record.metadata.tokenUsage?.totalTokens !== undefined && (
                        <span className="flex items-center space-x-1">
                          <Hash className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{record.metadata.tokenUsage.totalTokens}t</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-1 flex items-center justify-between border-t border-gray-850">
                    <button
                      type="button"
                      onClick={() => onLoadRecord(record)}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Load into Workbench</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

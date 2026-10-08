import React from 'react';
import { History, Play, Trash2, Clock, User } from 'lucide-react';
import { TransmissionLog } from '../types/radio';

interface AudioHistoryDrawerProps {
  logs: TransmissionLog[];
  onPlayLog: (log: TransmissionLog) => void;
  onClearLogs: () => void;
}

export const AudioHistoryDrawer: React.FC<AudioHistoryDrawerProps> = ({
  logs,
  onPlayLog,
  onClearLogs,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
            Histórico de Transmissões (Slide2Talk)
          </h3>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
            title="Limpar histórico de áudio"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-6 text-center text-zinc-400 text-xs">
          Nenhuma transmissão gravada ainda. Pressione o PTT para falar e salvar áudio.
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {logs.map((log) => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const seconds = (log.durationMs / 1000).toFixed(1);

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onPlayLog(log)}
                    className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center transition-colors min-w-[32px]"
                    title="Ouvir novamente"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                      <User className="w-3 h-3 text-zinc-400" />
                      <span>{log.senderName}</span>
                      <span className="text-zinc-400 text-[10px]">· CH-{String(log.channelId).padStart(2, '0')}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeStr}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums font-mono">{seconds}s</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPlayLog(log)}
                  className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                >
                  Repetir
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

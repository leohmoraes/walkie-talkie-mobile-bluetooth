import React from 'react';
import { RadioChannel, RadioState, PeerDevice } from '../types/radio';

interface LcdScreenProps {
  channel: RadioChannel;
  radioState: RadioState;
  activePeers: PeerDevice[];
  audioLevel: number; // 0 - 1
  volume: number;
  squelch: number;
  batteryLevel?: number; // 0 - 100
  filterMode: string;
  voxEnabled: boolean;
  isLocked: boolean;
}

export const LcdScreen: React.FC<LcdScreenProps> = ({
  channel,
  radioState,
  activePeers,
  audioLevel,
  batteryLevel = 92,
  filterMode,
  voxEnabled,
  isLocked,
}) => {
  const transmittingPeer = activePeers.find((p) => p.isTransmitting);
  const activePeerCount = activePeers.length;

  return (
    <div className="relative rounded-xl p-3.5 bg-[#15231c] border-2 border-[#2d4236] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] font-mono text-[#4ade80] select-none overflow-hidden">
      {/* Subtle CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Screen Header: Status Flags & Battery */}
      <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider border-b border-[#2d4236]/70 pb-1 mb-2">
        <div className="flex items-center gap-2">
          {/* Radio State Indicator */}
          {radioState === 'transmitting' ? (
            <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              TX TRANSMIT
            </span>
          ) : radioState === 'receiving' ? (
            <span className="flex items-center gap-1 text-emerald-300 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              RX RECEIVING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 inline-block" />
              STANDBY
            </span>
          )}

          {voxEnabled && (
            <span className="text-[#38bdf8] text-[10px]">VOX</span>
          )}
          {isLocked && (
            <span className="text-amber-400 text-[10px]">LOCK</span>
          )}
        </div>

        {/* Signal & Battery Indicator */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-end gap-0.5" title="Sinal RSSI">
            <span className="w-1 h-1.5 bg-[#4ade80] rounded-[1px]" />
            <span className="w-1 h-2 bg-[#4ade80] rounded-[1px]" />
            <span className="w-1 h-2.5 bg-[#4ade80] rounded-[1px]" />
            <span className={`w-1 h-3 rounded-[1px] ${activePeerCount > 0 ? 'bg-[#4ade80]' : 'bg-[#2d4236]'}`} />
            <span className={`w-1 h-3.5 rounded-[1px] ${activePeerCount > 0 ? 'bg-[#4ade80]' : 'bg-[#2d4236]'}`} />
          </span>

          <span className="text-emerald-400/90 tabular-nums">
            {batteryLevel}%
          </span>
        </div>
      </div>

      {/* Main Display: Channel Number & Large Frequency */}
      <div className="flex items-baseline justify-between my-1">
        <div>
          <span className="text-[12px] text-emerald-500/70 block uppercase tracking-wider">
            {channel.name}
          </span>
          <div className="text-2xl font-bold tracking-tight text-[#86efac] tabular-nums drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">
            {channel.frequency}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-emerald-500/70 block uppercase">Subtom</span>
          <span className="text-xs text-emerald-400/90 font-medium">{channel.code.split(' ')[0]}</span>
        </div>
      </div>

      {/* Audio Visualizer / VU Meter Bars */}
      <div className="my-2 bg-[#0d1611] rounded p-1.5 border border-[#23352b]">
        <div className="flex items-center justify-between text-[9px] text-emerald-500/60 mb-1">
          <span>VU METER</span>
          <span>
            {radioState === 'transmitting'
              ? 'MICROFONE ATIVO'
              : radioState === 'receiving'
              ? `RECEBENDO DE: ${transmittingPeer?.name || 'PAR REMOTO'}`
              : 'CANAL LIVRE'}
          </span>
        </div>

        {/* 18-segment LED-like VU Bar */}
        <div className="flex items-center gap-1 h-3">
          {Array.from({ length: 18 }).map((_, idx) => {
            const threshold = (idx + 1) / 18;
            const isLit = audioLevel >= threshold || (radioState !== 'standby' && idx < 2);
            let color = 'bg-[#1e3226]';
            if (isLit) {
              if (idx < 12) color = 'bg-[#4ade80] shadow-[0_0_4px_#4ade80]';
              else if (idx < 15) color = 'bg-amber-400 shadow-[0_0_4px_#fbbf24]';
              else color = 'bg-red-500 shadow-[0_0_4px_#ef4444]';
            }
            return (
              <div
                key={idx}
                className={`flex-1 h-full rounded-[1px] transition-all duration-75 ${color}`}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Line: Peer Connectivity & Mode */}
      <div className="flex items-center justify-between text-[10px] text-emerald-400/80 pt-1 border-t border-[#2d4236]/60">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">
            {activePeerCount === 0
              ? 'Aguardando 2º aparelho...'
              : `${activePeerCount} ${activePeerCount === 1 ? 'aparelho pareado' : 'aparelhos no canal'}`}
          </span>
        </div>
        <div className="text-right shrink-0 uppercase text-[9px] text-emerald-500/80">
          DSP: {filterMode === 'radio' ? 'FILTRO RF' : filterMode === 'vintage' ? 'VINTAGE' : 'HD AUDIO'}
        </div>
      </div>
    </div>
  );
};

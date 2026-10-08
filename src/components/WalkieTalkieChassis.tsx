import React from 'react';
import { Volume2, Radio as RadioIcon, Wifi } from 'lucide-react';
import { RadioChannel, RadioState, PeerDevice, AudioSettings } from '../types/radio';
import { LcdScreen } from './LcdScreen';
import { PttButton } from './PttButton';

interface WalkieTalkieChassisProps {
  unitLabel: string;
  deviceName: string;
  channel: RadioChannel;
  channels: RadioChannel[];
  radioState: RadioState;
  activePeers: PeerDevice[];
  audioLevel: number;
  settings: AudioSettings;
  onPttStart: () => void;
  onPttEnd: () => void;
  onToggleLock: () => void;
  onCallAlert: () => void;
  onChannelNext: () => void;
  onChannelPrev: () => void;
  onOpenConnectModal?: () => void;
  disabled?: boolean;
}

export const WalkieTalkieChassis: React.FC<WalkieTalkieChassisProps> = ({
  unitLabel,
  deviceName,
  channel,
  radioState,
  activePeers,
  audioLevel,
  settings,
  onPttStart,
  onPttEnd,
  onToggleLock,
  onCallAlert,
  onChannelNext,
  onChannelPrev,
  onOpenConnectModal,
  disabled = false,
}) => {
  return (
    <div className="relative flex flex-col items-center max-w-sm w-full mx-auto select-none">
      {/* Top Antenna & Knobs Assembly */}
      <div className="w-full flex items-end justify-between px-8 -mb-2 z-0">
        {/* Realistic Rubberized Helical Antenna */}
        <div className="flex flex-col items-center">
          <div className="w-3.5 h-16 sm:h-20 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-t-full shadow-lg border-t border-zinc-600 relative">
            <div className="absolute top-2 inset-x-0 h-1 bg-zinc-900/60" />
            <div className="absolute top-5 inset-x-0 h-1 bg-zinc-900/60" />
            <div className="absolute top-8 inset-x-0 h-1 bg-zinc-900/60" />
          </div>
          <div className="w-6 h-3 bg-zinc-900 rounded-t border-x border-t border-zinc-700" />
        </div>

        {/* Rotary Knobs on Top */}
        <div className="flex items-end gap-3 pb-1">
          {/* Channel Selector Rotary Knob */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-zinc-500 mb-0.5 tracking-wider">
              CANAL
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onChannelPrev}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-600 text-zinc-300 text-xs font-bold flex items-center justify-center shadow-md min-h-[36px] min-w-[36px]"
                title="Canal Anterior"
              >
                -
              </button>
              <div
                onClick={onChannelNext}
                className="w-10 h-8 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-t-md border-t border-x border-zinc-600 shadow-md flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95"
                title="Girar Seletor de Canais"
              >
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              </div>
              <button
                type="button"
                onClick={onChannelNext}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-600 text-zinc-300 text-xs font-bold flex items-center justify-center shadow-md min-h-[36px] min-w-[36px]"
                title="Próximo Canal"
              >
                +
              </button>
            </div>
          </div>

          {/* Volume Rotary Knob */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-zinc-500 mb-0.5 tracking-wider">
              VOL/LIG
            </span>
            <div className="w-9 h-7 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-t-md border-t border-x border-zinc-600 shadow-md flex items-center justify-center">
              <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Rugged Polymer Chassis Body */}
      <div className="relative w-full rounded-[2rem] bg-gradient-to-b from-zinc-900 via-[#18181b] to-zinc-950 border-2 border-zinc-700 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.15)] p-4 sm:p-5 z-10 flex flex-col items-center">
        {/* Rubber Side Grip Textures */}
        <div className="absolute -left-1.5 top-1/4 bottom-1/4 w-2 flex flex-col justify-around py-3">
          <div className="w-2 h-4 bg-zinc-800 rounded-r border border-zinc-700" />
          <div className="w-2 h-4 bg-zinc-800 rounded-r border border-zinc-700" />
          <div className="w-2 h-4 bg-zinc-800 rounded-r border border-zinc-700" />
          <div className="w-2 h-4 bg-zinc-800 rounded-r border border-zinc-700" />
        </div>

        <div className="absolute -right-1.5 top-1/4 bottom-1/4 w-2 flex flex-col justify-around py-3">
          <div className="w-2 h-4 bg-zinc-800 rounded-l border border-zinc-700" />
          <div className="w-2 h-4 bg-zinc-800 rounded-l border border-zinc-700" />
          <div className="w-2 h-4 bg-zinc-800 rounded-l border border-zinc-700" />
          <div className="w-2 h-4 bg-zinc-800 rounded-l border border-zinc-700" />
        </div>

        {/* Brand / Unit Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-1 px-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <RadioIcon className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black tracking-widest text-zinc-200 uppercase font-mono">
              {unitLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[120px]">
              {deviceName}
            </span>

            {onOpenConnectModal && (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-amber-400 font-semibold border border-zinc-700 transition-colors flex items-center gap-1 min-h-[32px]"
                title="Configurações de Conexão e Bluetooth"
              >
                <Wifi className="w-3 h-3 text-sky-400" />
                <span>PAREAR</span>
              </button>
            )}
          </div>
        </div>

        {/* Tactical Backlit LCD Display */}
        <div className="w-full my-1">
          <LcdScreen
            channel={channel}
            radioState={radioState}
            activePeers={activePeers}
            audioLevel={audioLevel}
            volume={settings.volume}
            squelch={settings.squelch}
            filterMode={settings.filterMode}
            voxEnabled={settings.voxEnabled}
            isLocked={settings.lockPtt}
          />
        </div>

        {/* Micro-Speaker Acoustic Grille Simulation */}
        <div className="w-full my-2.5 py-1 px-4 flex flex-col items-center justify-center opacity-70">
          <div className="grid grid-cols-12 gap-1.5 w-3/4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-950 shadow-inner" />
            ))}
          </div>
          <span className="text-[8px] font-mono text-zinc-400 mt-1 tracking-widest uppercase">
            SPEAKER / MIC
          </span>
        </div>

        {/* Massive Push-To-Talk (PTT) Button */}
        <div className="w-full">
          <PttButton
            radioState={radioState}
            isLocked={settings.lockPtt}
            onPttStart={onPttStart}
            onPttEnd={onPttEnd}
            onToggleLock={onToggleLock}
            onCallAlert={onCallAlert}
            disabled={disabled}
          />
        </div>

        {/* Bottom Chassis Bevel */}
        <div className="w-full flex items-center justify-between pt-2 px-1 text-[10px] text-zinc-400 font-mono">
          <span>UHF/VHF P2P</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-zinc-400" />
            {settings.volume}%
          </span>
          <span>ROGER: {settings.rogerBeep.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

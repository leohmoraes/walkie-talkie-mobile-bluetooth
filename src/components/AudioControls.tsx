import React from 'react';
import { Volume2, Radio, Sliders, Waves, Activity } from 'lucide-react';
import { AudioSettings, RogerBeepType, VoiceFilterMode } from '../types/radio';

interface AudioControlsProps {
  settings: AudioSettings;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  onTestRogerBeep: (type: RogerBeepType) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  settings,
  onUpdateSettings,
  onTestRogerBeep,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          Ajustes de Áudio & Rádio RF
        </h3>
        <span className="text-[11px] text-zinc-400 font-mono">DSP Walkie-Talkie</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Volume Control */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
              Volume do Alto-falante
            </label>
            <span className="font-mono text-zinc-400 tabular-nums">{settings.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume}
            onChange={(e) => onUpdateSettings({ volume: Number(e.target.value) })}
            className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Squelch Control */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-zinc-400" />
              Squelch (Filtro de Ruído)
            </label>
            <span className="font-mono text-zinc-400 tabular-nums">SQL {Math.round(settings.squelch / 10)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.squelch}
            onChange={(e) => onUpdateSettings({ squelch: Number(e.target.value) })}
            className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Roger Beep Selector */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Roger Beep (Tom Final)
            </label>
            <button
              type="button"
              onClick={() => onTestRogerBeep(settings.rogerBeep)}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline"
            >
              Testar Som
            </button>
          </div>
          <select
            value={settings.rogerBeep}
            onChange={(e) => onUpdateSettings({ rogerBeep: e.target.value as RogerBeepType })}
            aria-label="Selecionar Tom do Roger Beep"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="motorola">Motorola Chirp (2 Tons Tático)</option>
            <option value="classic">K-Tone Clássico (1000 Hz)</option>
            <option value="nasa">NASA Quindar (Apollo 2525 Hz)</option>
            <option value="none">Silencioso (Sem Roger Beep)</option>
          </select>
        </div>

        {/* Audio DSP Filter */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              Equalização da Voz
            </label>
            <span className="text-[11px] text-zinc-400">Passa-banda</span>
          </div>
          <select
            value={settings.filterMode}
            onChange={(e) => onUpdateSettings({ filterMode: e.target.value as VoiceFilterMode })}
            aria-label="Selecionar Equalização da Voz"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="radio">Rádio RF Tático (Filtro 300Hz-3.2kHz)</option>
            <option value="vintage">Walkie-Talkie Vintage (Saturação Analógica)</option>
            <option value="hd">Intercomunicador HD (Som Limpo Cristalino)</option>
          </select>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-zinc-800 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.voxEnabled}
            onChange={(e) => onUpdateSettings({ voxEnabled: e.target.checked })}
            className="rounded border-zinc-700 text-amber-500 focus:ring-0 bg-zinc-800 w-4 h-4 cursor-pointer"
          />
          <span className="text-zinc-300">VOX (Ativação automática por voz)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.hapticFeedback}
            onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
            className="rounded border-zinc-700 text-amber-500 focus:ring-0 bg-zinc-800 w-4 h-4 cursor-pointer"
          />
          <span className="text-zinc-300">Vibração háptica no PTT</span>
        </label>
      </div>
    </div>
  );
};

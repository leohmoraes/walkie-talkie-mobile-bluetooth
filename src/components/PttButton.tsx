import React, { useEffect, useCallback } from 'react';
import { Mic, Lock, Unlock, Bell } from 'lucide-react';
import { RadioState } from '../types/radio';

interface PttButtonProps {
  radioState: RadioState;
  isLocked: boolean;
  onPttStart: () => void;
  onPttEnd: () => void;
  onToggleLock: () => void;
  onCallAlert: () => void;
  disabled?: boolean;
}

export const PttButton: React.FC<PttButtonProps> = ({
  radioState,
  isLocked,
  onPttStart,
  onPttEnd,
  onToggleLock,
  onCallAlert,
  disabled = false,
}) => {
  const isTransmitting = radioState === 'transmitting';
  const isReceiving = radioState === 'receiving';

  // Haptic feedback trigger
  const triggerHaptic = (duration: number) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Safe fallback
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isReceiving) return;
    e.preventDefault();
    triggerHaptic(40);
    onPttStart();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (disabled || isReceiving || isLocked) return;
    e.preventDefault();
    triggerHaptic(20);
    onPttEnd();
  };

  // Keyboard Spacebar listener for PTT
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' && !e.repeat && !isTransmitting && !isReceiving && !disabled) {
        e.preventDefault();
        triggerHaptic(40);
        onPttStart();
      }
    },
    [isTransmitting, isReceiving, disabled, onPttStart]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' && !isLocked && isTransmitting) {
        e.preventDefault();
        triggerHaptic(20);
        onPttEnd();
      }
    },
    [isLocked, isTransmitting, onPttEnd]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="flex flex-col items-center select-none w-full my-4">
      {/* Top action helper tags */}
      <div className="flex items-center justify-between w-full max-w-[320px] px-2 mb-3">
        {/* Call Alert Button */}
        <button
          type="button"
          onClick={onCallAlert}
          disabled={disabled || isTransmitting || isReceiving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 text-amber-400 text-xs font-semibold tracking-wider transition-colors disabled:opacity-50 min-h-[44px]"
          title="Emitir sinal sonoro de chamada (Call Alert) para os outros aparelhos"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>CHAMADA</span>
        </button>

        {/* Spacebar helper indicator */}
        <span className="hidden sm:inline-block text-[11px] text-zinc-400 font-mono">
          Espaço = Falar
        </span>

        {/* Lock PTT Toggle (Hands-Free Intercom) */}
        <button
          type="button"
          onClick={onToggleLock}
          disabled={disabled || isReceiving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wider transition-colors min-h-[44px] ${
            isLocked
              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
          }`}
          title="Trava de PTT contínuo (modo viva-voz)"
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{isLocked ? 'TRAVADO' : 'TRAVA PTT'}</span>
        </button>
      </div>

      {/* Main Massive PTT Button */}
      <div className="relative flex items-center justify-center p-3">
        {/* Outer glowing halo ring when transmitting or receiving */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
            isTransmitting
              ? 'bg-red-500/20 scale-110 blur-md animate-pulse'
              : isReceiving
              ? 'bg-emerald-500/20 scale-110 blur-md animate-pulse'
              : 'bg-transparent'
          }`}
        />

        {/* Beveled Outer Collar Rim */}
        <div className="relative rounded-full p-2 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] border-2 border-zinc-700">
          {/* Inner PTT Push Button Surface */}
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            disabled={disabled || isReceiving}
            className={`relative flex flex-col items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-full transition-transform duration-75 select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/50 ${
              isTransmitting
                ? 'bg-gradient-to-b from-red-600 to-red-700 scale-95 shadow-[inset_0_4px_12px_rgba(0,0,0,0.7)] text-white'
                : isReceiving
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 cursor-not-allowed text-white shadow-inner'
                : 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-black hover:brightness-110 active:scale-95 text-zinc-100 shadow-[0_6px_14px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.15)] border border-zinc-700'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Textured tactile grip rings on button face */}
            <div className="absolute inset-3 rounded-full border border-dashed border-white/10 pointer-events-none" />

            <Mic
              className={`w-9 h-9 sm:w-11 sm:h-11 mb-1 transition-transform ${
                isTransmitting ? 'scale-110 text-white animate-bounce' : 'text-zinc-200'
              }`}
            />

            <span className="font-bold text-sm sm:text-base tracking-widest uppercase">
              {isTransmitting
                ? 'TRANSMITINDO'
                : isReceiving
                ? 'OUVINDO'
                : 'PUSH TO TALK'}
            </span>

            <span className="text-[10px] tracking-wider text-zinc-400 font-mono mt-0.5">
              {isTransmitting
                ? 'SOLTE P/ OUVIR'
                : isReceiving
                ? 'CANAL OCUPADO'
                : 'SEGURE P/ FALAR'}
            </span>
          </button>
        </div>
      </div>

      {/* Instructional helper text */}
      <p className="text-xs text-zinc-400 mt-2 text-center max-w-xs">
        {isReceiving
          ? 'Recebendo transmissão de voz em tempo real do outro aparelho.'
          : isTransmitting
          ? 'Sua voz está sendo transmitida. Solte para emitir o Roger Beep.'
          : 'Mantenha o botão pressionado para falar. Solte quando terminar.'}
      </p>
    </div>
  );
};

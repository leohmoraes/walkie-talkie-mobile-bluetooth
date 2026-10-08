import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadioChannel, RadioState, AudioSettings } from '../types/radio';
import { WalkieTalkieChassis } from './WalkieTalkieChassis';
import { audioEngine } from '../utils/audioEngine';

interface DualDeviceSimulatorProps {
  currentChannel: RadioChannel;
  channels: RadioChannel[];
  onSelectChannel: (channel: RadioChannel) => void;
  baseSettings: AudioSettings;
  onUpdateBaseSettings: (newSettings: Partial<AudioSettings>) => void;
}

export const DualDeviceSimulator: React.FC<DualDeviceSimulatorProps> = ({
  currentChannel,
  channels,
  onSelectChannel,
  baseSettings,
}) => {
  // Radio 1 (Alpha) states
  const [radio1State, setRadio1State] = useState<RadioState>('standby');
  const [radio1Level, setRadio1Level] = useState<number>(0);
  const [radio1Locked, setRadio1Locked] = useState(false);

  // Radio 2 (Bravo) states
  const [radio2State, setRadio2State] = useState<RadioState>('standby');
  const [radio2Level, setRadio2Level] = useState<number>(0);
  const [radio2Locked, setRadio2Locked] = useState(false);

  // Audio animation ref
  const animFrameRef = useRef<number | null>(null);

  const radio1Settings: AudioSettings = {
    ...baseSettings,
    lockPtt: radio1Locked,
  };

  const radio2Settings: AudioSettings = {
    ...baseSettings,
    lockPtt: radio2Locked,
  };

  // Channel Next / Prev handlers
  const handleChannelNext = () => {
    const idx = channels.findIndex((c) => c.id === currentChannel.id);
    const nextIdx = (idx + 1) % channels.length;
    audioEngine.playKnobClick();
    onSelectChannel(channels[nextIdx]);
  };

  const handleChannelPrev = () => {
    const idx = channels.findIndex((c) => c.id === currentChannel.id);
    const prevIdx = (idx - 1 + channels.length) % channels.length;
    audioEngine.playKnobClick();
    onSelectChannel(channels[prevIdx]);
  };

  // Radio 1 PTT actions
  const handleRadio1PttStart = async () => {
    await audioEngine.initMicrophone(radio1Settings.filterMode);
    audioEngine.startTransmitting();
    setRadio1State('transmitting');
    setRadio2State('receiving');
  };

  const handleRadio1PttEnd = () => {
    audioEngine.stopTransmitting(radio1Settings.rogerBeep);
    setRadio1State('standby');
    setRadio2State('standby');
  };

  // Radio 2 PTT actions
  const handleRadio2PttStart = async () => {
    await audioEngine.initMicrophone(radio2Settings.filterMode);
    audioEngine.startTransmitting();
    setRadio2State('transmitting');
    setRadio1State('receiving');
  };

  const handleRadio2PttEnd = () => {
    audioEngine.stopTransmitting(radio2Settings.rogerBeep);
    setRadio2State('standby');
    setRadio1State('standby');
  };

  // Call alert actions
  const handleCallAlert1 = () => {
    audioEngine.playCallAlertSound();
  };

  const handleCallAlert2 = () => {
    audioEngine.playCallAlertSound();
  };

  // Dynamic Audio Level Loop
  const updateAudioLevels = useCallback(() => {
    if (radio1State === 'transmitting') {
      const realLevel = audioEngine.getAudioLevel();
      const level = Math.max(realLevel, 0.2 + Math.random() * 0.4);
      setRadio1Level(level);
      setRadio2Level(level * 0.9);
    } else if (radio2State === 'transmitting') {
      const realLevel = audioEngine.getAudioLevel();
      const level = Math.max(realLevel, 0.2 + Math.random() * 0.4);
      setRadio2Level(level);
      setRadio1Level(level * 0.9);
    } else {
      setRadio1Level(0);
      setRadio2Level(0);
    }
    animFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [radio1State, radio2State]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateAudioLevels);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateAudioLevels]);

  return (
    <div className="w-full">
      {/* Informative Banner */}
      <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
        <h3 className="text-sm font-bold text-zinc-100 mb-1">
          Simulador Interativo de 2 Celulares / Rádios PTT
        </h3>
        <p className="text-xs text-zinc-400 max-w-xl mx-auto">
          Teste a comunicação direta em tempo real: aperte o PTT no{' '}
          <strong className="text-zinc-200">Rádio 1 (Alpha)</strong> e veja o{' '}
          <strong className="text-zinc-200">Rádio 2 (Bravo)</strong> receber a transmissão (RX) com Roger Beep automático ao soltar!
        </p>
      </div>

      {/* Side-by-Side Dual Radios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
        {/* Radio Alpha */}
        <div className="flex flex-col items-center">
          <div className="text-center mb-2">
            <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
              APARELHO 1 (BASE ALPHA)
            </span>
            <p className="text-[11px] text-zinc-400">Ex: Celular do Líder / Sala</p>
          </div>

          <WalkieTalkieChassis
            unitLabel="TALKIE-ALPHA"
            deviceName="Celular_Alpha"
            channel={currentChannel}
            channels={channels}
            radioState={radio1State}
            activePeers={[
              {
                id: 'bravo',
                name: 'Celular_Bravo',
                connectedAt: Date.now(),
                signalRssi: -48,
                isTransmitting: radio2State === 'transmitting',
                deviceType: 'simulated',
              },
            ]}
            audioLevel={radio1Level}
            settings={radio1Settings}
            onPttStart={handleRadio1PttStart}
            onPttEnd={handleRadio1PttEnd}
            onToggleLock={() => setRadio1Locked(!radio1Locked)}
            onCallAlert={handleCallAlert1}
            onChannelNext={handleChannelNext}
            onChannelPrev={handleChannelPrev}
          />
        </div>

        {/* Radio Bravo */}
        <div className="flex flex-col items-center">
          <div className="text-center mb-2">
            <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">
              APARELHO 2 (MÓVEL BRAVO)
            </span>
            <p className="text-[11px] text-zinc-400">Ex: Celular de Campo / Carro</p>
          </div>

          <WalkieTalkieChassis
            unitLabel="TALKIE-BRAVO"
            deviceName="Celular_Bravo"
            channel={currentChannel}
            channels={channels}
            radioState={radio2State}
            activePeers={[
              {
                id: 'alpha',
                name: 'Celular_Alpha',
                connectedAt: Date.now(),
                signalRssi: -48,
                isTransmitting: radio1State === 'transmitting',
                deviceType: 'simulated',
              },
            ]}
            audioLevel={radio2Level}
            settings={radio2Settings}
            onPttStart={handleRadio2PttStart}
            onPttEnd={handleRadio2PttEnd}
            onToggleLock={() => setRadio2Locked(!radio2Locked)}
            onCallAlert={handleCallAlert2}
            onChannelNext={handleChannelNext}
            onChannelPrev={handleChannelPrev}
          />
        </div>
      </div>
    </div>
  );
};

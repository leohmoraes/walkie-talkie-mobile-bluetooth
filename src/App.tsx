/**
 * WalkieTalkie PTT - Intercomunicador Offline
 * Real-time Voice Push-to-Talk (PTT) with Bluetooth & Local P2P capabilities
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio as RadioIcon,
  Bluetooth,
  Wifi,
  Sliders,
  History,
  Smartphone,
  HelpCircle,
  Layers,
  Volume2,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import {
  RadioChannel,
  RadioState,
  AudioSettings,
  TransmissionLog,
  PeerDevice,
  RogerBeepType,
} from './types/radio';
import { DEFAULT_CHANNELS } from './utils/channels';
import { audioEngine } from './utils/audioEngine';
import { commManager, RadioMessageEvent } from './utils/communicationManager';
import { WalkieTalkieChassis } from './components/WalkieTalkieChassis';
import { AudioControls } from './components/AudioControls';
import { AudioHistoryDrawer } from './components/AudioHistoryDrawer';
import { ConnectionModal } from './components/ConnectionModal';
import { DualDeviceSimulator } from './components/DualDeviceSimulator';

export default function App() {
  // Navigation tabs
  const [currentView, setCurrentView] = useState<'radio' | 'simulator' | 'guide'>('radio');

  // Channels state
  const [channels] = useState<RadioChannel[]>(DEFAULT_CHANNELS);
  const [currentChannel, setCurrentChannel] = useState<RadioChannel>(DEFAULT_CHANNELS[0]);

  // Radio operational states
  const [radioState, setRadioState] = useState<RadioState>('standby');
  const [activePeers, setActivePeers] = useState<PeerDevice[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [peerName, setPeerName] = useState<string>(commManager.getPeerName());
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AudioSettings>({
    volume: 85,
    squelch: 40,
    rogerBeep: 'motorola',
    filterMode: 'radio',
    voxEnabled: false,
    voxSensitivity: 50,
    hapticFeedback: true,
    lockPtt: false,
  });

  // Audio history logs (Slide2Talk style)
  const [logs, setLogs] = useState<TransmissionLog[]>([]);

  // Transmission timing
  const transmitStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Parse URL channel on mount (e.g., ?ch=3)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const chParam = params.get('ch');
      if (chParam) {
        const found = DEFAULT_CHANNELS.find((c) => c.id === Number(chParam));
        if (found) {
          setCurrentChannel(found);
          commManager.setChannel(found.id);
        }
      }
    }
  }, []);

  // Sync channel with communication manager
  useEffect(() => {
    commManager.setChannel(currentChannel.id);
  }, [currentChannel]);

  // Subscribe to real-time communication events
  useEffect(() => {
    const unsubPeers = commManager.onPeersChange((peers) => {
      setActivePeers(peers);
    });

    const unsubMsg = commManager.onMessage(async (msg: RadioMessageEvent) => {
      if (msg.channelId !== currentChannel.id) return;

      if (msg.type === 'PTT_DOWN') {
        audioEngine.playPttStartFx();
        setRadioState('receiving');
      } else if (msg.type === 'PTT_UP') {
        audioEngine.stopTransmitting(settings.rogerBeep);
        setRadioState('standby');
      } else if (msg.type === 'CALL_ALERT') {
        audioEngine.playCallAlertSound();
      } else if (msg.type === 'VOICE_PACKET' && msg.audioBase64) {
        // Convert base64 to blob
        try {
          const res = await fetch(msg.audioBase64);
          const blob = await res.blob();
          const duration = msg.durationMs || 2500;

          // Add to Slide2Talk history log
          const newLog: TransmissionLog = {
            id: `log_${Date.now()}_${Math.random()}`,
            timestamp: msg.timestamp,
            senderName: msg.senderName,
            senderId: msg.senderId,
            channelId: msg.channelId,
            durationMs: duration,
            audioBlob: blob,
          };
          setLogs((prev) => [newLog, ...prev.slice(0, 19)]);

          // Play incoming audio through radio filter
          await audioEngine.playIncomingAudio(blob, settings.rogerBeep, settings.filterMode);
          setRadioState('standby');
        } catch (e) {
          console.warn('Voice packet audio error:', e);
        }
      }
    });

    return () => {
      unsubPeers();
      unsubMsg();
    };
  }, [currentChannel, settings.rogerBeep, settings.filterMode]);

  // Real-time Audio Level meter loop
  const updateAudioMeter = useCallback(() => {
    if (radioState === 'transmitting') {
      const level = audioEngine.getAudioLevel();
      setAudioLevel(Math.max(level, 0.15 + Math.random() * 0.25));
    } else if (radioState === 'receiving') {
      // Receiving active audio
      setAudioLevel(0.4 + Math.random() * 0.35);
    } else {
      setAudioLevel(0);
    }
    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
  }, [radioState]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateAudioMeter]);

  // Channel switching
  const handleSelectChannel = (channel: RadioChannel) => {
    audioEngine.playKnobClick();
    setCurrentChannel(channel);
  };

  const handleChannelNext = () => {
    const idx = channels.findIndex((c) => c.id === currentChannel.id);
    const nextIdx = (idx + 1) % channels.length;
    handleSelectChannel(channels[nextIdx]);
  };

  const handleChannelPrev = () => {
    const idx = channels.findIndex((c) => c.id === currentChannel.id);
    const prevIdx = (idx - 1 + channels.length) % channels.length;
    handleSelectChannel(channels[prevIdx]);
  };

  // PTT Actions
  const handlePttStart = async () => {
    if (radioState === 'receiving') return;

    // Initialize mic if needed
    await audioEngine.initMicrophone(settings.filterMode);

    transmitStartTimeRef.current = Date.now();
    setRadioState('transmitting');
    commManager.sendPttDown();

    // Start recording audio for network transmission and history log
    audioEngine.startTransmitting((audioBlob) => {
      const durationMs = Math.max(800, Date.now() - transmitStartTimeRef.current);
      // Send over local network
      commManager.transmitVoiceBlob(audioBlob, durationMs);

      // Add to local history log
      const logEntry: TransmissionLog = {
        id: `local_${Date.now()}`,
        timestamp: Date.now(),
        senderName: `${peerName} (Você)`,
        senderId: commManager.getPeerId(),
        channelId: currentChannel.id,
        durationMs,
        audioBlob,
      };
      setLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
    });
  };

  const handlePttEnd = () => {
    if (radioState !== 'transmitting') return;

    audioEngine.stopTransmitting(settings.rogerBeep);
    setRadioState('standby');
    commManager.sendPttUp();
  };

  const handleToggleLock = () => {
    if (settings.lockPtt) {
      setSettings((s) => ({ ...s, lockPtt: false }));
      if (radioState === 'transmitting') {
        handlePttEnd();
      }
    } else {
      setSettings((s) => ({ ...s, lockPtt: true }));
      if (radioState === 'standby') {
        handlePttStart();
      }
    }
  };

  const handleCallAlert = () => {
    audioEngine.playCallAlertSound();
    commManager.sendCallAlert();
  };

  const handlePlayLog = async (log: TransmissionLog) => {
    if (log.audioBlob) {
      await audioEngine.playIncomingAudio(log.audioBlob, settings.rogerBeep, settings.filterMode);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleTestRogerBeep = (type: RogerBeepType) => {
    audioEngine.playRogerBeep(type);
  };

  const handleUpdateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.filterMode) {
        audioEngine.applyFilterGraph(newSettings.filterMode);
      }
      return updated;
    });
  };

  const handleUpdatePeerName = (name: string) => {
    setPeerName(name);
    commManager.setPeerName(name);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Contract (Zone 1: Brand, Zone 2: Navigation Links, Zone 3: Primary Action) */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Zone 1: Brand single text element */}
          <div className="flex items-center gap-2">
            <RadioIcon className="w-5 h-5 text-amber-500" />
            <span className="text-base font-bold tracking-tight text-zinc-100 font-mono">
              WalkieTalkie PTT
            </span>
          </div>

          {/* Zone 2: Clean text navigation links / view tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentView('radio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'radio'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rádio Principal
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'simulator'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Simulador 2 Rádios</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('guide')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'guide'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Guia Offline</span>
            </button>
          </nav>

          {/* Zone 3: Primary action button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 text-xs font-bold transition-colors shadow-sm"
              title="Parear celulares via Bluetooth ou Hotspot Local"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Parear 2 Celulares</span>
              <span className="sm:hidden">Parear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {currentView === 'radio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Authentic Handheld Walkie Talkie Unit */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <WalkieTalkieChassis
                unitLabel="PTT-INTERCOM"
                deviceName={peerName}
                channel={currentChannel}
                channels={channels}
                radioState={radioState}
                activePeers={activePeers}
                audioLevel={audioLevel}
                settings={settings}
                onPttStart={handlePttStart}
                onPttEnd={handlePttEnd}
                onToggleLock={handleToggleLock}
                onCallAlert={handleCallAlert}
                onChannelNext={handleChannelNext}
                onChannelPrev={handleChannelPrev}
                onOpenConnectModal={() => setIsConnectModalOpen(true)}
              />

              {/* Offline pairing reminder badge */}
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-2 rounded-xl">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Funciona sem internet móvel via Bluetooth ou Hotspot Wi-Fi direto.
                </span>
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="text-amber-400 hover:underline font-semibold ml-1"
                >
                  Ver como
                </button>
              </div>
            </div>

            {/* Right Column: Radio Controls, DSP EQ & Slide2Talk Audio History */}
            <div className="lg:col-span-6 space-y-5">
              <AudioControls
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onTestRogerBeep={handleTestRogerBeep}
              />

              <AudioHistoryDrawer
                logs={logs}
                onPlayLog={handlePlayLog}
                onClearLogs={handleClearLogs}
              />

              {/* Status info box */}
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-400">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Transmissão Segura de Baixa Latência
                  </span>
                  <span className="font-mono text-emerald-400">0 MB Dados</span>
                </div>
                <p className="leading-relaxed">
                  Compatível com botões de chamada de fone de ouvido Bluetooth (teclas de controle de mídia) e tecla Espaço no computador.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'simulator' && (
          <DualDeviceSimulator
            currentChannel={currentChannel}
            channels={channels}
            onSelectChannel={handleSelectChannel}
            baseSettings={settings}
            onUpdateBaseSettings={handleUpdateSettings}
          />
        )}

        {currentView === 'guide' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <RadioIcon className="w-5 h-5 text-amber-500" />
                Como Conversar à Distância Curta Sem Usar Internet Móvel
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Instruções passo a passo para conectar dois celulares nos modos Talkie, Slide2Talk e Walkie Tooth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Method 1: Bluetooth Walkie Tooth */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Bluetooth className="w-5 h-5" />
                  <span>Método 1: Emparelhamento Bluetooth</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ideal para curtas distâncias (10 a 20 metros), caminhadas ou dentro do mesmo veículo:
                </p>
                <ol className="list-decimal list-inside text-xs text-zinc-300 space-y-2">
                  <li>
                    <strong>Configurações do Sistema:</strong> No Celular 1 e Celular 2, abra as <em>Configurações &gt; Bluetooth</em> e emparelhe ambos.
                  </li>
                  <li>
                    <strong>Abra o App:</strong> Inicie o aplicativo em ambos os celulares no mesmo canal de rádio (ex: CH-01).
                  </li>
                  <li>
                    <strong>PTT Direto:</strong> Pressione o botão PTT para transmitir a voz em tempo real. O áudio é reproduzido pelo alto-falante ou fone Bluetooth.
                  </li>
                </ol>
              </div>

              {/* Method 2: Wi-Fi Hotspot / Roteador Local */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Wifi className="w-5 h-5" />
                  <span>Método 2: Hotspot Portátil (50-100m)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Alcance estendido sem precisar de internet ou chip com créditos:
                </p>
                <ol className="list-decimal list-inside text-xs text-zinc-300 space-y-2">
                  <li>
                    <strong>Ligue o Ponto de Acesso:</strong> No Celular 1, ative a opção <em>Roteador Wi-Fi / Ponto de Acesso Pessoal</em> (dados móveis desligados).
                  </li>
                  <li>
                    <strong>Conecte o Celular 2:</strong> Conecte o segundo celular nessa rede Wi-Fi local.
                  </li>
                  <li>
                    <strong>Sincronização QR Code:</strong> Abra o app e escaneie o QR Code de pareamento para entrar na mesma frequência e conversar com latência zero.
                  </li>
                </ol>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
              <h3 className="font-semibold text-zinc-200 mb-1">
                Recursos Técnicos do Walkie-Talkie:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li><strong>Filtro Passa-Banda DSP:</strong> Equalização autêntica de rádio UHF/VHF cortando ruídos abaixo de 300Hz e acima de 3.2kHz.</li>
                <li><strong>Roger Beep Automático:</strong> Tons de confirmação Motorola Chirp, K-Tone ou Quindar da NASA ao soltar o microfone.</li>
                <li><strong>Slide2Talk Replay:</strong> Gravação e reprodução rápida das últimas mensagens recebidas para nunca perder um chamado.</li>
                <li><strong>VOX e Trava de PTT:</strong> Modos viva-voz para comunicação mãos livres.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Pairing & Connection Modal */}
      <ConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        currentChannel={currentChannel}
        channels={channels}
        onSelectChannel={handleSelectChannel}
        peerName={peerName}
        onUpdatePeerName={handleUpdatePeerName}
        activePeerCount={activePeers.length}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Bluetooth, Wifi, Radio, Smartphone, QrCode, Copy, Check, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { RadioChannel } from '../types/radio';
import { bluetoothManager } from '../utils/bluetoothManager';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChannel: RadioChannel;
  channels: RadioChannel[];
  onSelectChannel: (channel: RadioChannel) => void;
  peerName: string;
  onUpdatePeerName: (name: string) => void;
  activePeerCount: number;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  currentChannel,
  channels,
  onSelectChannel,
  peerName,
  onUpdatePeerName,
  activePeerCount,
}) => {
  const [activeTab, setActiveTab] = useState<'bluetooth' | 'offline_hotspot' | 'channels'>('bluetooth');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);
  const [btStatusMessage, setBtStatusMessage] = useState<string | null>(null);

  // Generate pairing QR code for the second phone
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?ch=${currentChannel.id}`;
      QRCode.toDataURL(shareUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch(() => {});
    }
  }, [isOpen, currentChannel]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?ch=${currentChannel.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleScanBluetooth = async () => {
    setIsScanningBluetooth(true);
    setBtStatusMessage(null);
    try {
      const device = await bluetoothManager.scanForDevices();
      if (device) {
        setBtStatusMessage(`Dispositivo Bluetooth "${device.name}" selecionado com sucesso!`);
      } else {
        setBtStatusMessage('Varredura cancelada.');
      }
    } catch (err) {
      setBtStatusMessage(
        (err as Error).message ||
          'Para parear dois celulares, use as Configurações do Android/iOS > Bluetooth e conecte ambos.'
      );
    } finally {
      setIsScanningBluetooth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-500" />
              Conectar 2 Celulares (Sem Internet Móvel)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instruções completas estilo Walkie Tooth, Slide2Talk e Talkie
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 p-1.5 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('bluetooth')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'bluetooth'
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-sky-400" />
            <span>1. Modo Bluetooth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline_hotspot')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'offline_hotspot'
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>2. Hotspot / Wi-Fi Direto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'channels'
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>3. Canais & Nome</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-zinc-300 text-sm">
          {activeTab === 'bluetooth' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-sky-200 text-xs">
                <p className="font-semibold text-sky-300 mb-1 flex items-center gap-1.5">
                  <Bluetooth className="w-4 h-4" />
                  Como conectar via Bluetooth (Walkie Tooth):
                </p>
                O Bluetooth permite conversar a distâncias curtas (10 a 20 metros) em ambientes fechados ou ar livre sem consumir pacote de dados móveis ou precisar de antena celular.
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">
                      Emparelhe no Sistema Operacional
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      No <strong>Celular A</strong> e <strong>Celular B</strong>, abra as <em>Configurações do Android/iOS &gt; Bluetooth</em>. Deixe ambos visíveis, localize o outro celular e confirme o código de pareamento.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">
                      Abra o Walkie-Talkie em ambos
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Mantenha ambos os aparelhos no mesmo Canal (ex: <strong>{currentChannel.name}</strong>). O áudio do PTT será reproduzido no alto-falante ou no fone Bluetooth conectado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">
                      Transmita com o Botão PTT
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Pressione e segure o grande botão <strong>PUSH TO TALK</strong> ou use o botão de chamada de um fone de ouvido Bluetooth conectado. O outro celular receberá o áudio em tempo real com o efeito clássico de rádio e roger beep.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scan Web Bluetooth Action */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleScanBluetooth}
                  disabled={isScanningBluetooth}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {isScanningBluetooth ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bluetooth className="w-4 h-4" />
                  )}
                  <span>Detectar Dispositivo Bluetooth Próximo</span>
                </button>

                {btStatusMessage && (
                  <p className="text-xs text-amber-300 mt-2 text-center bg-zinc-800/80 p-2 rounded-lg border border-zinc-700">
                    {btStatusMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'offline_hotspot' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs">
                <p className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" />
                  Modo Alcance Máximo (50 a 100 Metros - 0MB de Internet):
                </p>
                Igual aos apps <em>Talkie</em> e <em>Slide2Talk</em>: você pode criar uma rede local direta sem gastar créditos de celular ou dados móveis!
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="bg-zinc-800/70 p-3 rounded-lg border border-zinc-700/60">
                  <h4 className="font-semibold text-zinc-100 mb-1">
                    Como usar sem internet nem chip:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                    <li>No <strong>Celular 1</strong>: Ative o <em>Roteador Wi-Fi / Ponto de Acesso</em> (dados móveis podem ficar desligados).</li>
                    <li>No <strong>Celular 2</strong>: Conecte na rede Wi-Fi criada pelo Celular 1.</li>
                    <li>Aponte a câmera do Celular 2 para o QR Code abaixo para abrir o canal instantaneamente!</li>
                  </ol>
                </div>
              </div>

              {/* QR Code and Quick Share */}
              {qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="p-2 bg-white rounded-lg shadow-md mb-2">
                    <img src={qrCodeUrl} alt="QR Code de Pareamento" className="w-40 h-40" />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono text-center">
                    Escaneie no 2º celular para conectar no canal <strong>{currentChannel.name}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs font-medium text-zinc-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copiado!' : 'Copiar Link de Pareamento'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              {/* Change radio nickname */}
              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1">
                  Nome deste Aparelho / Indicativo:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={peerName}
                    onChange={(e) => onUpdatePeerName(e.target.value)}
                    maxLength={20}
                    placeholder="Ex: Celular_Base"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Channel list */}
              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-2">
                  Selecione a Frequência / Canal:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {channels.map((ch) => {
                    const isSelected = ch.id === currentChannel.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => onSelectChannel(ch)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{ch.name}</span>
                          {isSelected && <span className="text-[10px] text-amber-400">ATIVO</span>}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{ch.frequency}</div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">{ch.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                activePeerCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>
              {activePeerCount > 0
                ? `${activePeerCount} rádio(s) conectado(s)`
                : 'Nenhum rádio no canal ainda'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-xs tracking-wide transition-colors"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
};

export interface RadioChannel {
  id: number;
  name: string;
  frequency: string; // e.g., "462.5625 MHz"
  description: string;
  code: string; // CTCSS / Privacy code
}

export type RogerBeepType = 'motorola' | 'classic' | 'nasa' | 'none';

export type VoiceFilterMode = 'radio' | 'hd' | 'vintage';

export interface AudioSettings {
  volume: number; // 0 - 100
  squelch: number; // 0 - 100
  rogerBeep: RogerBeepType;
  filterMode: VoiceFilterMode;
  voxEnabled: boolean;
  voxSensitivity: number; // 0 - 100
  hapticFeedback: boolean;
  lockPtt: boolean;
}

export interface TransmissionLog {
  id: string;
  timestamp: number;
  senderName: string;
  senderId: string;
  channelId: number;
  durationMs: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type RadioState = 'standby' | 'transmitting' | 'receiving';

export interface PeerDevice {
  id: string;
  name: string;
  connectedAt: number;
  signalRssi: number; // -100 to -30 dBm
  isTransmitting: boolean;
  deviceType: 'bluetooth' | 'webrtc' | 'broadcast' | 'simulated';
}

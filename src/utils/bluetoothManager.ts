/**
 * Bluetooth Discovery & System Pairing Manager
 * Handles:
 * 1. Web Bluetooth scanning (if available in browser/Android Chrome)
 * 2. Media Session action handlers (for Bluetooth headset PTT button integration)
 * 3. Bluetooth state diagnostic & pairing assistant
 */

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  type?: string;
}

class BluetoothManager {
  private connectedDevice: BluetoothDeviceInfo | null = null;
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
    this.setupMediaSession();
  }

  private checkAvailability() {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      this.isAvailable = 'bluetooth' in navigator;
    }
  }

  public isBluetoothSupported(): boolean {
    return this.isAvailable;
  }

  /**
   * Request Bluetooth device scan via Web Bluetooth API (Android Chrome & supported browsers)
   */
  public async scanForDevices(): Promise<BluetoothDeviceInfo | null> {
    if (!this.isAvailable) {
      throw new Error('Web Bluetooth não é suportado neste navegador. Use o emparelhamento padrão do sistema.');
    }

    try {
      // Prompt user to select nearby Bluetooth device
      const nav = navigator as unknown as {
        bluetooth: {
          requestDevice: (options: unknown) => Promise<{
            id: string;
            name?: string;
            gatt?: { connected: boolean };
          }>;
        };
      };

      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      });

      this.connectedDevice = {
        id: device.id,
        name: device.name || 'Dispositivo Bluetooth',
        connected: true,
        type: 'Bluetooth RF',
      };

      return this.connectedDevice;
    } catch (err) {
      if ((err as Error).name === 'NotFoundError') {
        return null; // User cancelled
      }
      throw err;
    }
  }

  public getConnectedDevice(): BluetoothDeviceInfo | null {
    return this.connectedDevice;
  }

  public disconnect() {
    this.connectedDevice = null;
  }

  /**
   * Configure MediaSession API to allow Bluetooth headset action buttons
   * (Play/Pause/Next track) to trigger or toggle PTT
   */
  public setupMediaSession(onPttToggle?: () => void) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Walkie-Talkie PTT',
        artist: 'Intercomunicador Direto',
        album: 'Canal de Rádio Local',
      });

      if (onPttToggle) {
        navigator.mediaSession.setActionHandler('play', () => {
          onPttToggle();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          onPttToggle();
        });
      }
    } catch {
      // Ignore
    }
  }
}

export const bluetoothManager = new BluetoothManager();

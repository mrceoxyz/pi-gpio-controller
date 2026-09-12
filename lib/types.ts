export type PinMode = "OUT" | "IN";
export type PinState = 0 | 1;

export interface GpioPin {
  id: number;          // Physical BOARD pin (1-40)
  bcm: number;         // BCM GPIO number (-1 if power/ground)
  name: string;        // User-friendly label (e.g., "Status LED", "Relay 1")
  defaultName: string; // Default RPi name (e.g., "GPIO 17")
  type: "gpio" | "power3v3" | "power5v" | "ground" | "id_eeprom";
  mode: PinMode;
  state: PinState;
  isControllable: boolean;
  color?: string;
  description?: string;
}

export interface SystemStats {
  isPi: boolean;
  platform: string;
  model: string;
  cpuTempC: number | null;
  uptimeSeconds: number;
  memoryUsagePercent: number;
  activeOutputsCount: number;
  driverMode: "rpi-hardware" | "simulation";
}

export interface GpioApiResponse {
  success: boolean;
  message?: string;
  pins: GpioPin[];
  stats: SystemStats;
}

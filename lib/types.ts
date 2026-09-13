export type PinMode = "OUT" | "IN";
export type PinState = 0 | 1;

export interface GpioPin {
  id: number;          // Physical BOARD pin (1-40)
  bcm: number;         // BCM GPIO number (-1 if power/ground)
  name: string;        // User-friendly label (e.g., "Relay (Lamp)", "PIR Sensor")
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

export interface SensorState {
  pirMotion: boolean;      // Pin 18 (BCM 24)
  isDark: boolean;         // Pin 15 (BCM 22) - True if dark
  buttonPressed: boolean;  // Pin 16 (BCM 23) - True if pressed
  lastMotionTimestamp: number | null;
  lastButtonTimestamp: number | null;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
  triggerCount: number;
  lastTriggered: string | null;
}

export interface ActivityLogEvent {
  id: string;
  timestamp: string;
  type: "motion" | "automation" | "security" | "manual";
  title: string;
  message: string;
}

export type SecurityMode = "disarmed" | "armed";

export interface AutomationStatusResponse {
  success: boolean;
  rules: AutomationRule[];
  securityMode: SecurityMode;
  securityAlarmTriggered: boolean;
  sensors: SensorState;
  logs: ActivityLogEvent[];
  stats: SystemStats;
}

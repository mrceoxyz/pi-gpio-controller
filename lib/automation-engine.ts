import { gpio } from "./gpio-driver";
import { ActivityLogEvent, AutomationRule, SecurityMode, SensorState } from "./types";

class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private logs: ActivityLogEvent[] = [];
  private securityMode: SecurityMode = "disarmed";
  private securityAlarmTriggered: boolean = false;

  private sensorState: SensorState = {
    pirMotion: false,
    isDark: true, // Default to night/dim
    buttonPressed: false,
    lastMotionTimestamp: null,
    lastButtonTimestamp: null,
  };

  private relayOffTimeout: NodeJS.Timeout | null = null;
  private motorOffTimeout: NodeJS.Timeout | null = null;
  private prevButtonState: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initRules();
    this.addLog("automation", "System Boot", "Automation Hub Engine initialized");
    this.startHardwarePolling();
  }

  private initRules() {
    this.rules.set("night-light", {
      id: "night-light",
      name: "Smart Night-Light",
      description: "Turns on Relay (Lamp) for 30s when motion is detected in the dark",
      enabled: true,
      icon: "moon",
      triggerCount: 0,
      lastTriggered: null,
    });

    this.rules.set("dusk-dawn", {
      id: "dusk-dawn",
      name: "Dusk-to-Dawn Auto Switch",
      description: "Turns Relay (Lamp) ON whenever Dark, and turns it OFF when Bright (Streetlight mode)",
      enabled: false,
      icon: "sun-dim",
      triggerCount: 0,
      lastTriggered: null,
    });

    this.rules.set("presence-fan", {
      id: "presence-fan",
      name: "Presence Cooling Fan",
      description: "Turns on DC Motor (Fan) when motion is detected; auto-stops after 45s idle",
      enabled: true,
      icon: "fan",
      triggerCount: 0,
      lastTriggered: null,
    });

    this.rules.set("wall-button", {
      id: "wall-button",
      name: "Physical Wall Switch",
      description: "Toggles the Relay (Lamp) immediately when the push button is pressed",
      enabled: true,
      icon: "toggle-left",
      triggerCount: 0,
      lastTriggered: null,
    });

    this.rules.set("security-alarm", {
      id: "security-alarm",
      name: "Intruder Alert",
      description: "Sounds security alert and logs intrusion when motion occurs while Armed",
      enabled: true,
      icon: "shield-alert",
      triggerCount: 0,
      lastTriggered: null,
    });
  }

  // Active hardware reading loop on real Raspberry Pi
  private startHardwareHardwareTicker() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      try {
        const stats = gpio.getSystemStats();
        if (!stats.isPi) return;

        // 1. Light Sensor (Pin 15 / BCM 22)
        // Most digital LDR modules output HIGH (1) for dark, or LOW (0) when light reaches threshold
        const rawLight = await gpio.readPinState(15);
        const isDark = rawLight === 1;
        if (isDark !== this.sensorState.isDark) {
          await this.updateSensor("light", isDark);
        }

        // 2. PIR Motion Sensor (Pin 18 / BCM 24)
        const rawPir = await gpio.readPinState(18);
        const pirMotion = rawPir === 1;
        if (pirMotion !== this.sensorState.pirMotion) {
          await this.updateSensor("pir", pirMotion);
        }

        // 3. Push Button (Pin 16 / BCM 23 with pull-up: 0 = pressed, 1 = idle)
        const rawBtn = await gpio.readPinState(16);
        const buttonPressed = rawBtn === 0;
        if (buttonPressed !== this.sensorState.buttonPressed) {
          await this.updateSensor("button", buttonPressed);
        }
      } catch {
        // Continue loop
      }
    }, 250);
  }

  private startHardwarePolling() {
    this.startHardwareHardwareTicker();
  }

  public getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  public toggleRule(id: string, enabled?: boolean): AutomationRule {
    const rule = this.rules.get(id);
    if (!rule) throw new Error(`Rule ${id} not found`);
    rule.enabled = enabled !== undefined ? enabled : !rule.enabled;
    this.rules.set(id, rule);
    this.addLog(
      "automation",
      "Rule Updated",
      `Rule "${rule.name}" was ${rule.enabled ? "ENABLED" : "DISABLED"}`
    );
    return rule;
  }

  public setSecurityMode(mode: SecurityMode): SecurityMode {
    this.securityMode = mode;
    if (mode === "disarmed") {
      this.securityAlarmTriggered = false;
    }
    this.addLog(
      "security",
      `Security ${mode.toUpperCase()}`,
      `Home security system has been ${mode === "armed" ? "ARMED" : "DISARMED"}`
    );
    return this.securityMode;
  }

  public clearAlarm(): void {
    this.securityAlarmTriggered = false;
    this.addLog("security", "Alarm Cleared", "Intruder alarm silenced and reset");
  }

  public getLogs(): ActivityLogEvent[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getSensors(): SensorState {
    return { ...this.sensorState };
  }

  public getSecurityStatus(): { mode: SecurityMode; alarm: boolean } {
    return {
      mode: this.securityMode,
      alarm: this.securityAlarmTriggered,
    };
  }

  private addLog(
    type: "motion" | "automation" | "security" | "manual",
    title: string,
    message: string
  ) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const event: ActivityLogEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      type,
      title,
      message,
    };

    this.logs.unshift(event);
    if (this.logs.length > 60) {
      this.logs.pop();
    }
  }

  public async updateSensor(
    sensor: "pir" | "light" | "button",
    value: boolean
  ): Promise<void> {
    const now = Date.now();

    if (sensor === "pir") {
      const changed = this.sensorState.pirMotion !== value;
      this.sensorState.pirMotion = value;
      if (value) {
        this.sensorState.lastMotionTimestamp = now;
        gpio.setSimulationInputState(18, 1);
        if (changed) {
          this.addLog("motion", "Motion Detected", "PIR sensor detected movement in room");
          await this.evaluateMotionRules();
        }
      } else {
        gpio.setSimulationInputState(18, 0);
      }
    } else if (sensor === "light") {
      const changed = this.sensorState.isDark !== value;
      this.sensorState.isDark = value;
      gpio.setSimulationInputState(15, value ? 1 : 0);

      if (changed) {
        this.addLog(
          "automation",
          "Light Level Changed",
          `Ambient sensor detected ${value ? "DARKNESS / NIGHT" : "BRIGHT LIGHT / DAY"}`
        );
        await this.evaluateLightRules(value);
      }
    } else if (sensor === "button") {
      const isPressEvent = !this.prevButtonState && value;
      this.sensorState.buttonPressed = value;
      this.prevButtonState = value;
      gpio.setSimulationInputState(16, value ? 1 : 0);

      if (isPressEvent) {
        this.sensorState.lastButtonTimestamp = now;
        this.addLog("manual", "Button Pressed", "Physical wall switch button tapped");
        await this.evaluateButtonRules();
      }
    }
  }

  private async evaluateLightRules(isDark: boolean): Promise<void> {
    const duskDawnRule = this.rules.get("dusk-dawn");
    if (duskDawnRule && duskDawnRule.enabled) {
      duskDawnRule.triggerCount++;
      duskDawnRule.lastTriggered = new Date().toLocaleTimeString();

      if (isDark) {
        await gpio.setPinState(11, 1);
        this.addLog(
          "automation",
          "Dusk Auto-Light ON",
          "Relay (Lamp) turned ON automatically (Darkness detected)"
        );
      } else {
        await gpio.setPinState(11, 0);
        this.addLog(
          "automation",
          "Dawn Auto-Light OFF",
          "Relay (Lamp) turned OFF automatically (Daylight restored)"
        );
      }
    }
  }

  private async evaluateMotionRules(): Promise<void> {
    // 1. Security Armed Mode
    if (this.securityMode === "armed") {
      const rule = this.rules.get("security-alarm");
      if (rule && rule.enabled) {
        this.securityAlarmTriggered = true;
        rule.triggerCount++;
        rule.lastTriggered = new Date().toLocaleTimeString();
        this.addLog(
          "security",
          "⚠️ INTRUSION ALARM!",
          "Motion detected while system was in ARMED mode!"
        );
      }
    }

    // 2. Night-Light Auto Trigger
    const nightLightRule = this.rules.get("night-light");
    if (nightLightRule && nightLightRule.enabled && this.sensorState.isDark) {
      nightLightRule.triggerCount++;
      nightLightRule.lastTriggered = new Date().toLocaleTimeString();

      // Pin 11 is Relay (Lamp)
      await gpio.setPinState(11, 1);
      this.addLog(
        "automation",
        "Night-Light Activated",
        "Relay (Lamp) turned ON for 30s (Dark + Motion condition met)"
      );

      // Reset auto-off timer
      if (this.relayOffTimeout) clearTimeout(this.relayOffTimeout);
      this.relayOffTimeout = setTimeout(async () => {
        await gpio.setPinState(11, 0);
        this.addLog("automation", "Night-Light Timer", "Relay (Lamp) automatically turned OFF");
      }, 30000);
    }

    // 3. Presence Cooling Fan Mode
    const fanRule = this.rules.get("presence-fan");
    if (fanRule && fanRule.enabled) {
      fanRule.triggerCount++;
      fanRule.lastTriggered = new Date().toLocaleTimeString();

      // Pin 13 is DC Motor
      await gpio.setPinState(13, 1);
      this.addLog("automation", "Desk Fan Started", "DC Motor activated due to room presence");

      // Reset auto-off timer
      if (this.motorOffTimeout) clearTimeout(this.motorOffTimeout);
      this.motorOffTimeout = setTimeout(async () => {
        await gpio.setPinState(13, 0);
        this.addLog("automation", "Desk Fan Idle Stop", "DC Motor stopped after presence timeout");
      }, 45000);
    }
  }

  private async evaluateButtonRules(): Promise<void> {
    const buttonRule = this.rules.get("wall-button");
    if (buttonRule && buttonRule.enabled) {
      buttonRule.triggerCount++;
      buttonRule.lastTriggered = new Date().toLocaleTimeString();

      if (this.relayOffTimeout) {
        clearTimeout(this.relayOffTimeout);
        this.relayOffTimeout = null;
      }

      const updated = await gpio.togglePin(11);
      this.addLog(
        "manual",
        "Relay Toggled",
        `Physical button switched Relay (Lamp) to ${updated.state === 1 ? "HIGH (ON)" : "LOW (OFF)"}`
      );
    }
  }
}

const globalForAutomation = globalThis as unknown as { automationEngine?: AutomationEngine };
export const automation = globalForAutomation.automationEngine || new AutomationEngine();
if (process.env.NODE_ENV !== "production") globalForAutomation.automationEngine = automation;

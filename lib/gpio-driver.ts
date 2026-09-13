import fs from "fs";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { GpioPin, PinMode, PinState, SystemStats } from "./types";
import { RPI_40_PINS } from "./pin-definitions";

const execAsync = promisify(exec);

class GpioManager {
  private pins: Map<number, GpioPin> = new Map();
  private isRaspberryPi: boolean = false;
  private piModel: string = "Simulation / Non-Pi Platform";
  private driverMode: "rpi-hardware" | "simulation" = "simulation";

  constructor() {
    this.detectPlatform();
    this.initPins();
  }

  private detectPlatform() {
    try {
      if (fs.existsSync("/proc/device-tree/model")) {
        const modelStr = fs.readFileSync("/proc/device-tree/model", "utf8").trim();
        if (modelStr.toLowerCase().includes("raspberry pi")) {
          this.isRaspberryPi = true;
          this.piModel = modelStr.replace(/\0/g, "");
          this.driverMode = "rpi-hardware";
        }
      }
    } catch {
      this.isRaspberryPi = false;
    }

    if (!this.isRaspberryPi) {
      this.piModel = `${os.type()} (${os.arch()}) [Simulation Engine]`;
      this.driverMode = "simulation";
    }
  }

  private initPins() {
    for (const pin of RPI_40_PINS) {
      this.pins.set(pin.id, { ...pin });
    }
    // Initialize hardware input pins if on Pi
    if (this.isRaspberryPi) {
      this.setupHardwarePin(17, "OUT"); // Pin 11: Relay
      this.setupHardwarePin(27, "OUT"); // Pin 13: Motor
      this.setupHardwarePin(22, "IN");  // Pin 15: Light
      this.setupHardwarePin(23, "IN", "pu"); // Pin 16: Button (Pull-up)
      this.setupHardwarePin(24, "IN", "pd"); // Pin 18: PIR (Pull-down)
    }
  }

  private async setupHardwarePin(bcm: number, mode: PinMode, pull?: "pu" | "pd"): Promise<void> {
    try {
      if (mode === "OUT") {
        await execAsync(`pinctrl set ${bcm} op`);
      } else {
        const pullFlag = pull ? ` ${pull}` : "";
        await execAsync(`pinctrl set ${bcm} ip${pullFlag}`);
      }
    } catch {
      // Fallback or ignore if pinctrl is not available yet
    }
  }

  public getPins(): GpioPin[] {
    return Array.from(this.pins.values());
  }

  public getPin(id: number): GpioPin | undefined {
    return this.pins.get(id);
  }

  public getPinByBcm(bcm: number): GpioPin | undefined {
    for (const pin of this.pins.values()) {
      if (pin.bcm === bcm) return pin;
    }
    return undefined;
  }

  public async setPinState(id: number, state: 0 | 1): Promise<GpioPin> {
    const pin = this.pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);
    if (!pin.isControllable) {
      throw new Error(`Pin ${id} (${pin.name}) cannot be written to as an output`);
    }

    pin.state = state;

    if (this.isRaspberryPi && pin.bcm >= 0) {
      await this.writeHardwarePin(pin.bcm, state);
    }

    this.pins.set(id, pin);
    return pin;
  }

  public async togglePin(id: number): Promise<GpioPin> {
    const pin = this.pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);
    const newState: 0 | 1 = pin.state === 1 ? 0 : 1;
    return this.setPinState(id, newState);
  }

  public async readPinState(id: number): Promise<PinState> {
    const pin = this.pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);

    if (this.isRaspberryPi && pin.bcm >= 0) {
      try {
        // Try pinctrl
        const { stdout } = await execAsync(`pinctrl get ${pin.bcm}`);
        // pinctrl output format: 24: ip    pd | hi // or // lo
        const isHigh = stdout.includes("hi") || stdout.includes("level=1") || stdout.includes("=1");
        pin.state = isHigh ? 1 : 0;
        this.pins.set(id, pin);
        return pin.state;
      } catch {
        // Fallback gpioget
        try {
          const chip = fs.existsSync("/dev/gpiochip4") ? "gpiochip4" : "gpiochip0";
          const { stdout } = await execAsync(`gpioget ${chip} ${pin.bcm}`);
          pin.state = stdout.trim() === "1" ? 1 : 0;
          this.pins.set(id, pin);
          return pin.state;
        } catch {
          // Keep current state
        }
      }
    }

    return pin.state;
  }

  public setSimulationInputState(id: number, state: 0 | 1): GpioPin {
    const pin = this.pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);
    pin.state = state;
    this.pins.set(id, pin);
    return pin;
  }

  public async pulsePin(id: number, durationMs: number = 500, times: number = 1): Promise<void> {
    const pin = this.pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);
    if (!pin.isControllable) throw new Error(`Pin ${id} is not controllable`);

    const originalState = pin.state;
    const pulseState: 0 | 1 = originalState === 1 ? 0 : 1;

    for (let i = 0; i < times; i++) {
      await this.setPinState(id, pulseState);
      await new Promise((resolve) => setTimeout(resolve, durationMs));
      await this.setPinState(id, originalState);
      if (i < times - 1) {
        await new Promise((resolve) => setTimeout(resolve, durationMs));
      }
    }
  }

  public async setAllPins(state: 0 | 1): Promise<GpioPin[]> {
    const updated: GpioPin[] = [];
    for (const pin of this.pins.values()) {
      if (pin.isControllable && pin.mode === "OUT") {
        pin.state = state;
        if (this.isRaspberryPi && pin.bcm >= 0) {
          try {
            await this.writeHardwarePin(pin.bcm, state);
          } catch (err) {
            console.error(`Error setting hardware pin ${pin.bcm}:`, err);
          }
        }
        updated.push({ ...pin });
      }
    }
    return updated;
  }

  public renamePin(id: number, newName: string): GpioPin {
    const pin = this.pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);
    pin.name = newName.trim() || pin.defaultName;
    this.pins.set(id, pin);
    return pin;
  }

  private async writeHardwarePin(bcm: number, state: 0 | 1): Promise<void> {
    const levelStr = state === 1 ? "dh" : "dl";
    try {
      await execAsync(`pinctrl set ${bcm} op ${levelStr}`);
      return;
    } catch {
      // pinctrl not available, try gpioset
    }

    try {
      const chip = fs.existsSync("/dev/gpiochip4") ? "gpiochip4" : "gpiochip0";
      await execAsync(`gpioset ${chip} ${bcm}=${state}`);
      return;
    } catch {
      // raspi-gpio legacy
    }

    try {
      await execAsync(`raspi-gpio set ${bcm} op ${levelStr}`);
      return;
    } catch {
      // sysfs
    }

    try {
      const gpioPath = `/sys/class/gpio/gpio${bcm}`;
      if (!fs.existsSync(gpioPath)) {
        fs.writeFileSync("/sys/class/gpio/export", `${bcm}`);
      }
      fs.writeFileSync(`${gpioPath}/direction`, "out");
      fs.writeFileSync(`${gpioPath}/value`, `${state}`);
    } catch (err) {
      console.warn(`[GPIO Hardware] Fallback error setting BCM ${bcm}:`, err);
    }
  }

  public getSystemStats(): SystemStats {
    let cpuTempC: number | null = null;
    try {
      if (fs.existsSync("/sys/class/thermal/thermal_zone0/temp")) {
        const raw = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8").trim();
        cpuTempC = Math.round((parseInt(raw, 10) / 1000) * 10) / 10;
      }
    } catch {
      cpuTempC = null;
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    let activeCount = 0;
    for (const pin of this.pins.values()) {
      if (pin.isControllable && pin.state === 1) activeCount++;
    }

    return {
      isPi: this.isRaspberryPi,
      platform: `${os.type()} ${os.release()}`,
      model: this.piModel,
      cpuTempC,
      uptimeSeconds: Math.floor(os.uptime()),
      memoryUsagePercent: usedPercent,
      activeOutputsCount: activeCount,
      driverMode: this.driverMode,
    };
  }
}

const globalForGpio = globalThis as unknown as { gpioManager?: GpioManager };
export const gpio = globalForGpio.gpioManager || new GpioManager();
if (process.env.NODE_ENV !== "production") globalForGpio.gpioManager = gpio;

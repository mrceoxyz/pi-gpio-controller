"use client";

import React, { useState } from "react";
import { Power, Fan, Sparkles, Zap, Timer, Flame } from "lucide-react";
import { GpioPin } from "@/lib/types";

interface ActuatorsPanelProps {
  relayPin: GpioPin | undefined;
  motorPin: GpioPin | undefined;
  onTogglePin: (id: number) => Promise<void>;
  onTriggerMotorAction: (action: "feed-pulse" | "cool-run") => Promise<void>;
  disabled?: boolean;
}

export const ActuatorsPanel: React.FC<ActuatorsPanelProps> = ({
  relayPin,
  motorPin,
  onTogglePin,
  onTriggerMotorAction,
  disabled = false,
}) => {
  const [motorActionRunning, setMotorActionRunning] = useState<string | null>(null);

  const isRelayOn = relayPin?.state === 1;
  const isMotorOn = motorPin?.state === 1;

  const handleMotorPreset = async (action: "feed-pulse" | "cool-run") => {
    setMotorActionRunning(action);
    try {
      await onTriggerMotorAction(action);
    } finally {
      setTimeout(() => setMotorActionRunning(null), action === "feed-pulse" ? 2600 : 15100);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Smart Actuators & Devices
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Relay Switch (Pin 11) • DC Motor / Fan Controller (Pin 13)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Relay Controller Card */}
        <div
          className={`p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            isRelayOn
              ? "bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/15"
              : "bg-slate-900/70 border-slate-800"
          }`}
        >
          {isRelayOn && (
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Pin 11
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                  BCM 17
                </span>
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isRelayOn
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 glow-green"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isRelayOn ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span>{isRelayOn ? "CLOSED (LAMP ON)" : "OPEN (OFF)"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  isRelayOn
                    ? "bg-emerald-600/30 border-emerald-400 text-emerald-300 glow-green"
                    : "bg-slate-800/80 border-slate-700 text-slate-400"
                }`}
              >
                <Power className={`w-6 h-6 ${isRelayOn ? "text-emerald-400" : ""}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">Relay Switch (Main Lamp)</h3>
                <p className="text-xs text-slate-400">
                  High-power load control for lamps, appliances, or 12V LED strips
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              State: <span className="font-mono text-slate-200">{isRelayOn ? "ACTIVE (3.3V)" : "STANDBY (0V)"}</span>
            </span>

            {/* Big Tactile Switch */}
            <button
              onClick={() => onTogglePin(11)}
              disabled={disabled}
              className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                isRelayOn
                  ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/30"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  isRelayOn ? "translate-x-7 text-emerald-600" : "translate-x-0.5 text-slate-400"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        {/* 2. DC Motor & Fan Card */}
        <div
          className={`p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            isMotorOn
              ? "bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/15"
              : "bg-slate-900/70 border-slate-800"
          }`}
        >
          {isMotorOn && (
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Pin 13
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                  BCM 27
                </span>
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isMotorOn
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isMotorOn ? "bg-cyan-400 animate-spin" : "bg-slate-500"}`} />
                <span>{isMotorOn ? "SPINNING" : "STOPPED"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  isMotorOn
                    ? "bg-cyan-600/30 border-cyan-400 text-cyan-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-400"
                }`}
              >
                <Fan className={`w-6 h-6 ${isMotorOn ? "animate-spin text-cyan-400" : ""}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">DC Motor (Fan / Dispenser)</h3>
                <p className="text-xs text-slate-400">
                  Automated cooling fan, curtain drive, or pet treat dispenser
                </p>
              </div>
            </div>
          </div>

          {/* Action presets row */}
          <div className="pt-4 border-t border-slate-800/80 mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMotorPreset("feed-pulse")}
                disabled={disabled || motorActionRunning !== null}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-cyan-300 font-medium border border-cyan-500/30 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{motorActionRunning === "feed-pulse" ? "Dispensing..." : "Dispense (2.5s)"}</span>
              </button>

              <button
                onClick={() => handleMotorPreset("cool-run")}
                disabled={disabled || motorActionRunning !== null}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-cyan-300 font-medium border border-cyan-500/30 transition-all disabled:opacity-50"
              >
                <Timer className="w-3 h-3 text-cyan-400" />
                <span>{motorActionRunning === "cool-run" ? "Cooling..." : "Fan (15s)"}</span>
              </button>
            </div>

            {/* Continuous Toggle */}
            <button
              onClick={() => onTogglePin(13)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isMotorOn
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {isMotorOn ? "Stop Motor" : "Run Motor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

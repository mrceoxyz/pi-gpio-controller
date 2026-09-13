"use client";

import React, { useState } from "react";
import { Eye, Sun, Moon, Radio, Hand, Sparkles } from "lucide-react";
import { SensorState } from "@/lib/types";

interface SensorsPanelProps {
  sensors: SensorState;
  onSimulateSensor: (sensor: "pir" | "light" | "button", value: boolean) => Promise<void>;
  driverMode: string;
}

export const SensorsPanel: React.FC<SensorsPanelProps> = ({
  sensors,
  onSimulateSensor,
  driverMode,
}) => {
  const [isSimulatingMotion, setIsSimulatingMotion] = useState(false);
  const [isSimulatingButton, setIsSimulatingButton] = useState(false);

  const handleTriggerMotion = async () => {
    setIsSimulatingMotion(true);
    await onSimulateSensor("pir", true);
    setTimeout(async () => {
      await onSimulateSensor("pir", false);
      setIsSimulatingMotion(false);
    }, 3500);
  };

  const handleTriggerButton = async () => {
    setIsSimulatingButton(true);
    await onSimulateSensor("button", true);
    setTimeout(async () => {
      await onSimulateSensor("button", false);
      setIsSimulatingButton(false);
    }, 400);
  };

  const handleToggleLight = async () => {
    await onSimulateSensor("light", !sensors.isDark);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Live Sensor Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical Inputs • PIR Motion (Pin 18), Light (Pin 15), Push Button (Pin 16)
          </p>
        </div>

        {/* Simulator controls helper */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Testing Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. PIR Motion Radar Sensor */}
        <div
          className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            sensors.pirMotion
              ? "bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-500/20"
              : "bg-slate-900/70 border-slate-800"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Pin 18 (BCM 24)
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  sensors.pirMotion
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    sensors.pirMotion ? "bg-rose-400 animate-ping" : "bg-emerald-400"
                  }`}
                />
                <span>{sensors.pirMotion ? "MOTION DETECTED" : "CLEAR / QUIET"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  sensors.pirMotion
                    ? "bg-rose-600/30 border-rose-400 text-rose-300 glow-red"
                    : "bg-slate-800/80 border-slate-700 text-slate-400"
                }`}
              >
                <Eye className={`w-6 h-6 ${sensors.pirMotion ? "animate-bounce text-rose-400" : ""}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">PIR Motion Sensor</h3>
                <p className="text-xs text-slate-400">
                  {sensors.pirMotion
                    ? "Movement detected in room"
                    : "No movement currently detected"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              {sensors.lastMotionTimestamp
                ? `Last: ${new Date(sensors.lastMotionTimestamp).toLocaleTimeString()}`
                : "Awaiting trigger"}
            </span>
            <button
              onClick={handleTriggerMotion}
              disabled={isSimulatingMotion}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-rose-300 font-medium border border-rose-500/30 transition-all disabled:opacity-50"
            >
              {isSimulatingMotion ? "Motion Active..." : "Simulate Motion"}
            </button>
          </div>
        </div>

        {/* 2. Light / Darkness Sensor */}
        <div
          className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            sensors.isDark
              ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/15"
              : "bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/15"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Pin 15 (BCM 22)
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  sensors.isDark
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {sensors.isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                <span>{sensors.isDark ? "DARK (NIGHT)" : "BRIGHT (DAY)"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  sensors.isDark
                    ? "bg-indigo-900/40 border-indigo-400 text-indigo-300"
                    : "bg-amber-500/20 border-amber-400 text-amber-300 glow-amber"
                }`}
              >
                {sensors.isDark ? (
                  <Moon className="w-6 h-6 text-indigo-300" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-400 animate-spin" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">Light Sensor (LDR)</h3>
                <p className="text-xs text-slate-400">
                  {sensors.isDark ? "Threshold: Below ambient trigger" : "Threshold: Daylight detected"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              Mode: {sensors.isDark ? "Night-Ready" : "Day-Standby"}
            </span>
            <button
              onClick={handleToggleLight}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-amber-300 font-medium border border-amber-500/30 transition-all"
            >
              Toggle {sensors.isDark ? "to Daylight" : "to Dark"}
            </button>
          </div>
        </div>

        {/* 3. Tactile Push Button */}
        <div
          className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            sensors.buttonPressed
              ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
              : "bg-slate-900/70 border-slate-800"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Pin 16 (BCM 23)
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  sensors.buttonPressed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                <span>{sensors.buttonPressed ? "PRESSED" : "RELEASED (IDLE)"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  sensors.buttonPressed
                    ? "bg-emerald-600/30 border-emerald-400 text-emerald-300 scale-95 glow-green"
                    : "bg-slate-800/80 border-slate-700 text-slate-400"
                }`}
              >
                <Hand className={`w-6 h-6 ${sensors.buttonPressed ? "text-emerald-400" : ""}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">Tactile Wall Button</h3>
                <p className="text-xs text-slate-400">
                  {sensors.buttonPressed ? "Button contact closed" : "Ready for manual tap"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              {sensors.lastButtonTimestamp
                ? `Last: ${new Date(sensors.lastButtonTimestamp).toLocaleTimeString()}`
                : "Pull-up active"}
            </span>
            <button
              onClick={handleTriggerButton}
              disabled={isSimulatingButton}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-emerald-300 font-medium border border-emerald-500/30 transition-all disabled:opacity-50"
            >
              {isSimulatingButton ? "Pressed..." : "Tap Button"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

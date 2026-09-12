"use client";

import React, { useState } from "react";
import { Zap, Timer, Edit2, Check, X, ShieldAlert } from "lucide-react";
import { GpioPin } from "@/lib/types";

interface PinCardProps {
  pin: GpioPin;
  onToggle: (id: number) => Promise<void>;
  onPulse: (id: number, durationMs?: number, times?: number) => Promise<void>;
  onRename: (id: number, newName: string) => Promise<void>;
  disabled?: boolean;
}

export const PinCard: React.FC<PinCardProps> = ({
  pin,
  onToggle,
  onPulse,
  onRename,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(pin.name);
  const [isPulsing, setIsPulsing] = useState(false);

  const isHigh = pin.state === 1;

  const handleSaveRename = async () => {
    if (nameInput.trim() && nameInput !== pin.name) {
      await onRename(pin.id, nameInput.trim());
    }
    setIsEditing(false);
  };

  const handlePulse = async () => {
    setIsPulsing(true);
    try {
      await onPulse(pin.id, 400, 2);
    } finally {
      setIsPulsing(false);
    }
  };

  return (
    <div
      className={`glass-panel-interactive rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
        isHigh
          ? "border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-500/10"
          : "border-slate-800/80 bg-slate-950/60"
      }`}
    >
      {/* Active High subtle background glow */}
      {isHigh && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Top row: Badges & Edit */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Physical Board Pin Badge */}
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700">
              Pin {pin.id}
            </span>
            {/* BCM GPIO Badge */}
            {pin.bcm >= 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30">
                GPIO {pin.bcm}
              </span>
            )}
          </div>

          {/* State Indicator Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
              isHigh
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 glow-green"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isHigh ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span>{isHigh ? "HIGH (3.3V)" : "LOW (0V)"}</span>
          </div>
        </div>

        {/* Pin Name with inline editing */}
        <div className="flex items-center justify-between gap-2 mb-1">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full mt-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <button
                onClick={handleSaveRename}
                className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full group">
              <h3 className="font-semibold text-sm text-slate-100 truncate" title={pin.name}>
                {pin.name}
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 transition-opacity"
                title="Rename pin"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 truncate mb-4">{pin.description || "General Purpose Output"}</p>
      </div>

      {/* Bottom row: Control Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        {/* Pulse / Blink Button */}
        <button
          onClick={handlePulse}
          disabled={disabled || isPulsing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-indigo-300 hover:border-indigo-500/40 active:scale-95 transition-all text-xs font-medium disabled:opacity-50"
          title="Pulse pin (blink 2 times)"
        >
          <Timer className={`w-3.5 h-3.5 ${isPulsing ? "animate-spin text-indigo-400" : ""}`} />
          <span>{isPulsing ? "Pulsing..." : "Blink"}</span>
        </button>

        {/* Master Toggle Switch */}
        <button
          onClick={() => onToggle(pin.id)}
          disabled={disabled}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            isHigh
              ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/30"
              : "bg-slate-800 border-slate-700"
          }`}
          aria-label={`Toggle Pin ${pin.id}`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isHigh ? "translate-x-6 text-emerald-600" : "translate-x-0.5 text-slate-400"
            }`}
          >
            <Zap className="w-3 h-3" />
          </span>
        </button>
      </div>
    </div>
  );
};

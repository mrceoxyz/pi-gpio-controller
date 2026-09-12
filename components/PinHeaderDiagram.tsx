"use client";

import React from "react";
import { GpioPin } from "@/lib/types";

interface PinHeaderDiagramProps {
  pins: GpioPin[];
  onToggle: (id: number) => Promise<void>;
  disabled?: boolean;
}

export const PinHeaderDiagram: React.FC<PinHeaderDiagramProps> = ({
  pins,
  onToggle,
  disabled = false,
}) => {
  // Map pins by ID for fast lookup
  const pinMap = new Map<number, GpioPin>();
  pins.forEach((p) => pinMap.set(p.id, p));

  // 20 rows of dual pins (odd: 1, 3, 5... even: 2, 4, 6...)
  const rows: Array<{ leftId: number; rightId: number }> = [];
  for (let i = 1; i <= 39; i += 2) {
    rows.push({ leftId: i, rightId: i + 1 });
  }

  const renderPinDot = (pin: GpioPin | undefined, isLeft: boolean) => {
    if (!pin) return null;

    let dotColor = "bg-slate-700";
    let textColor = "text-slate-400";
    let glowClass = "";

    if (pin.type === "power5v") {
      dotColor = "bg-rose-600 border-rose-400";
      textColor = "text-rose-400";
    } else if (pin.type === "power3v3") {
      dotColor = "bg-amber-500 border-amber-300";
      textColor = "text-amber-400";
    } else if (pin.type === "ground") {
      dotColor = "bg-slate-900 border-slate-700";
      textColor = "text-slate-500";
    } else if (pin.type === "id_eeprom") {
      dotColor = "bg-purple-600 border-purple-400";
      textColor = "text-purple-400";
    } else if (pin.state === 1) {
      dotColor = "bg-emerald-400 border-emerald-300 animate-pulse";
      textColor = "text-emerald-300 font-bold";
      glowClass = "glow-green ring-2 ring-emerald-400/50";
    } else {
      dotColor = "bg-cyan-900/60 border-cyan-700";
      textColor = "text-cyan-300";
    }

    const handleClick = () => {
      if (pin.isControllable && !disabled) {
        onToggle(pin.id);
      }
    };

    return (
      <div
        className={`flex items-center gap-2 group ${
          isLeft ? "justify-end text-right" : "justify-start text-left"
        }`}
      >
        {/* Left-side labels */}
        {isLeft && (
          <div className="flex flex-col items-end leading-none">
            <span className={`text-[10px] font-mono ${textColor} truncate max-w-[110px] sm:max-w-[140px]`}>
              {pin.name}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              {pin.bcm >= 0 ? `BCM ${pin.bcm}` : pin.defaultName}
            </span>
          </div>
        )}

        {/* The Pin Dot itself */}
        <button
          type="button"
          onClick={handleClick}
          disabled={!pin.isControllable || disabled}
          title={`${pin.name} (Pin ${pin.id} / ${pin.bcm >= 0 ? `BCM ${pin.bcm}` : "Power/GND"})\nClick to Toggle`}
          className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-all duration-200 ${dotColor} ${glowClass} ${
            pin.isControllable
              ? "cursor-pointer hover:scale-125 hover:brightness-125 active:scale-95"
              : "cursor-default opacity-80"
          }`}
        >
          <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{pin.id}</span>
        </button>

        {/* Right-side labels */}
        {!isLeft && (
          <div className="flex flex-col items-start leading-none">
            <span className={`text-[10px] font-mono ${textColor} truncate max-w-[110px] sm:max-w-[140px]`}>
              {pin.name}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              {pin.bcm >= 0 ? `BCM ${pin.bcm}` : pin.defaultName}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Raspberry Pi 40-Pin Header
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical layout: Click any controllable pin to toggle
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> 5V
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 3.3V
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 inline-block" /> GND
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> ON (HIGH)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-800 inline-block" /> OFF (LOW)
          </span>
        </div>
      </div>

      {/* Header Container */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 max-w-xl mx-auto overflow-x-auto shadow-inner">
        <div className="space-y-1.5 min-w-[320px]">
          {rows.map(({ leftId, rightId }) => (
            <div key={leftId} className="grid grid-cols-2 gap-4 items-center">
              {renderPinDot(pinMap.get(leftId), true)}
              {renderPinDot(pinMap.get(rightId), false)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

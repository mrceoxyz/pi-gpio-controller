"use client";

import React, { useState, useEffect } from "react";
import { Cpu, RefreshCw, Wifi, Clock, ShieldCheck, Activity } from "lucide-react";
import { SystemStats } from "@/lib/types";

interface NavbarProps {
  stats: SystemStats | null;
  onRefresh: () => void;
  isLoading: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onRefresh,
  isLoading,
  autoRefresh,
  setAutoRefresh,
}) => {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25">
            <Cpu className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">PiGPIO Hub</h1>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  stats?.driverMode === "rpi-hardware"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                }`}
              >
                {stats?.driverMode === "rpi-hardware" ? "RPi Hardware" : "Simulation Mode"}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Raspberry Pi Web Controller • Local Network
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-slate-300">{time || "--:--:--"}</span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              autoRefresh
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Auto-refresh pin state every 2 seconds"
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">Auto-Sync</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rose-400" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

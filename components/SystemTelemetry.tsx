"use client";

import React from "react";
import { Thermometer, HardDrive, Clock, Zap, Layers } from "lucide-react";
import { SystemStats } from "@/lib/types";

interface SystemTelemetryProps {
  stats: SystemStats | null;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export const SystemTelemetry: React.FC<SystemTelemetryProps> = ({ stats }) => {
  if (!stats) return null;

  const temp = stats.cpuTempC;
  const isHot = temp !== null && temp >= 70;
  const isWarm = temp !== null && temp >= 55 && temp < 70;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Device Model */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Board / Platform</span>
          <Layers className="w-4 h-4 text-rose-400/80 group-hover:text-rose-400 transition-colors" />
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-100 truncate" title={stats.model}>
          {stats.model}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{stats.platform}</p>
        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* CPU Temperature */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">CPU Temperature</span>
          <Thermometer
            className={`w-4 h-4 transition-colors ${
              isHot ? "text-rose-400 animate-bounce" : isWarm ? "text-amber-400" : "text-emerald-400"
            }`}
          />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-xl font-bold font-mono text-slate-100">
            {temp !== null ? `${temp}°C` : "N/A (Sim)"}
          </p>
          {temp !== null && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                isHot
                  ? "bg-rose-500/20 text-rose-300"
                  : isWarm
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isHot ? "Hot" : isWarm ? "Warm" : "Normal"}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {temp !== null ? `${Math.round((temp * 9) / 5 + 32)}°F` : "Hardware sensor inactive"}
        </p>
        <div
          className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full blur-xl pointer-events-none ${
            isHot ? "bg-rose-500/15" : "bg-emerald-500/10"
          }`}
        />
      </div>

      {/* Memory Usage */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">RAM Usage</span>
          <HardDrive className="w-4 h-4 text-cyan-400/80 group-hover:text-cyan-400 transition-colors" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-xl font-bold font-mono text-slate-100">{stats.memoryUsagePercent}%</p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.memoryUsagePercent > 85
                ? "bg-rose-500"
                : stats.memoryUsagePercent > 65
                ? "bg-amber-500"
                : "bg-cyan-500"
            }`}
            style={{ width: `${stats.memoryUsagePercent}%` }}
          />
        </div>
      </div>

      {/* Active Pins & Uptime */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Active High Pins</span>
          <Zap className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-xl font-bold font-mono text-emerald-400">{stats.activeOutputsCount}</p>
          <span className="text-xs text-slate-400">outputs active</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Up: {formatUptime(stats.uptimeSeconds)}</span>
        </div>
      </div>
    </div>
  );
};

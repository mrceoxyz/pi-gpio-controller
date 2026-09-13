"use client";

import React from "react";
import { Activity, Trash2, ShieldAlert, Cpu, Eye, Hand } from "lucide-react";
import { ActivityLogEvent } from "@/lib/types";

interface ActivityLogProps {
  logs: ActivityLogEvent[];
  onClearLogs: () => Promise<void>;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClearLogs }) => {
  const getLogIcon = (type: ActivityLogEvent["type"]) => {
    switch (type) {
      case "security":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case "motion":
        return <Eye className="w-3.5 h-3.5 text-amber-400" />;
      case "manual":
        return <Hand className="w-3.5 h-3.5 text-emerald-400" />;
      case "automation":
      default:
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getLogBadge = (type: ActivityLogEvent["type"]) => {
    switch (type) {
      case "security":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "motion":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "manual":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "automation":
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Live Activity & Security Log
          </h2>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear all logs"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No events recorded yet. Trigger a sensor or rule to see live entries!
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5 text-xs transition-all hover:bg-slate-900"
            >
              <div className="mt-0.5">{getLogIcon(log.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200 truncate">{log.title}</span>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{log.message}</p>
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${getLogBadge(
                  log.type
                )}`}
              >
                {log.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

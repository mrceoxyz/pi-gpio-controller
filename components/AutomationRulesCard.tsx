"use client";

import React from "react";
import { Moon, Fan, ToggleLeft, ShieldAlert, ShieldCheck, Sliders, BellRing, AlertTriangle } from "lucide-react";
import { AutomationRule, SecurityMode } from "@/lib/types";

interface AutomationRulesCardProps {
  rules: AutomationRule[];
  securityMode: SecurityMode;
  alarmTriggered: boolean;
  onToggleRule: (ruleId: string, enabled?: boolean) => Promise<void>;
  onSetSecurityMode: (mode: SecurityMode) => Promise<void>;
  onClearAlarm: () => Promise<void>;
  disabled?: boolean;
}

export const AutomationRulesCard: React.FC<AutomationRulesCardProps> = ({
  rules,
  securityMode,
  alarmTriggered,
  onToggleRule,
  onSetSecurityMode,
  onClearAlarm,
  disabled = false,
}) => {
  const getRuleIcon = (id: string) => {
    switch (id) {
      case "night-light":
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case "presence-fan":
        return <Fan className="w-4 h-4 text-cyan-400" />;
      case "wall-button":
        return <ToggleLeft className="w-4 h-4 text-emerald-400" />;
      case "security-alarm":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return <Sliders className="w-4 h-4 text-slate-400" />;
    }
  };

  const isArmed = securityMode === "armed";

  return (
    <div className="glass-panel p-5 rounded-2xl mb-6">
      {/* Alarm Banner if triggered */}
      {alarmTriggered && (
        <div className="mb-5 p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl glow-red animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">⚠️ INTRUDER ALARM TRIGGERED</h3>
              <p className="text-xs text-rose-300">
                PIR motion sensor detected activity while system was ARMED!
              </p>
            </div>
          </div>
          <button
            onClick={onClearAlarm}
            className="px-4 py-2 rounded-lg bg-white text-rose-700 hover:bg-rose-100 active:scale-95 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            Acknowledge & Silence Alarm
          </button>
        </div>
      )}

      {/* Header and Security Arm Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Smart Automation Rules Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous background intelligence linking sensors to actuators
          </p>
        </div>

        {/* Master Security Mode Pill */}
        <div className="flex items-center gap-3 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 px-2">
            {isArmed ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-semibold text-slate-200">
              Security: <span className={isArmed ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{isArmed ? "ARMED" : "STANDBY"}</span>
            </span>
          </div>

          <button
            onClick={() => onSetSecurityMode(isArmed ? "disarmed" : "armed")}
            disabled={disabled}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              isArmed
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            {isArmed ? "Disarm Hub" : "Arm Security"}
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
              rule.enabled
                ? "bg-slate-900/90 border-violet-500/30 shadow-sm"
                : "bg-slate-950/50 border-slate-800/80 opacity-70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border mt-0.5 transition-colors ${
                  rule.enabled
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-500"
                }`}
              >
                {getRuleIcon(rule.id)}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <span>{rule.name}</span>
                  {rule.triggerCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {rule.triggerCount}x
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rule.description}</p>
                {rule.lastTriggered && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Last triggered: {rule.lastTriggered}
                  </p>
                )}
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => onToggleRule(rule.id)}
              disabled={disabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                rule.enabled
                  ? "bg-violet-600 border-violet-500 shadow-sm"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  rule.enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

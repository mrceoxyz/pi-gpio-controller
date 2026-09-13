"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { SystemTelemetry } from "@/components/SystemTelemetry";
import { SensorsPanel } from "@/components/SensorsPanel";
import { ActuatorsPanel } from "@/components/ActuatorsPanel";
import { AutomationRulesCard } from "@/components/AutomationRulesCard";
import { ActivityLog } from "@/components/ActivityLog";
import { WiringGuideModal } from "@/components/WiringGuideModal";
import { QuickActions } from "@/components/QuickActions";
import { PinCard } from "@/components/PinCard";
import { PinHeaderDiagram } from "@/components/PinHeaderDiagram";
import {
  GpioPin,
  SystemStats,
  AutomationRule,
  SecurityMode,
  SensorState,
  ActivityLogEvent,
} from "@/lib/types";
import { Home, Binary, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function Dashboard() {
  const [pins, setPins] = useState<GpioPin[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [securityMode, setSecurityMode] = useState<SecurityMode>("disarmed");
  const [securityAlarm, setSecurityAlarm] = useState(false);
  const [sensors, setSensors] = useState<SensorState>({
    pirMotion: false,
    isDark: true,
    buttonPressed: false,
    lastMotionTimestamp: null,
    lastButtonTimestamp: null,
  });
  const [logs, setLogs] = useState<ActivityLogEvent[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<"hub" | "pins">("hub");
  const [isWiringModalOpen, setIsWiringModalOpen] = useState(false);

  // Pin view filtering
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch GPIO & Automation data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [gpioRes, autoRes] = await Promise.all([
        fetch("/api/gpio", { cache: "no-store" }),
        fetch("/api/automation", { cache: "no-store" }),
      ]);

      const gpioData = await gpioRes.json();
      const autoData = await autoRes.json();

      if (gpioData.success) {
        setPins(gpioData.pins);
        setStats(gpioData.stats);
      }

      if (autoData.success) {
        setRules(autoData.rules);
        setSecurityMode(autoData.securityMode);
        setSecurityAlarm(autoData.securityAlarmTriggered);
        setSensors(autoData.sensors);
        setLogs(autoData.logs);
      }
    } catch (err) {
      console.error("Error fetching state:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchData(true);
    }, 2000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  // Toggle single pin
  const handleToggle = async (id: number) => {
    setPins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, state: p.state === 1 ? 0 : 1 } : p))
    );

    try {
      const res = await fetch("/api/gpio/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setPins((prev) => prev.map((p) => (p.id === id ? data.pin : p)));
        setStats(data.stats);
        fetchData(true);
      } else {
        fetchData(true);
        showToast(data.error || "Failed to toggle pin", "error");
      }
    } catch {
      fetchData(true);
      showToast("Network error while toggling pin", "error");
    }
  };

  // Motor Action Presets
  const handleTriggerMotorAction = async (action: "feed-pulse" | "cool-run") => {
    try {
      const res = await fetch("/api/motor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(true);
        showToast(data.message || "Motor action started!");
      }
    } catch {
      showToast("Failed to run motor preset", "error");
    }
  };

  // Simulate Sensor Input (from UI)
  const handleSimulateSensor = async (
    sensor: "pir" | "light" | "button",
    value: boolean
  ) => {
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate-sensor", sensor, value }),
      });
      const data = await res.json();
      if (data.success) {
        setSensors(data.sensors);
        if (data.pins) setPins(data.pins);
        fetchData(true);
      }
    } catch {
      showToast("Failed to simulate sensor", "error");
    }
  };

  // Toggle Rule
  const handleToggleRule = async (ruleId: string, enabled?: boolean) => {
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-rule", ruleId, enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setRules((prev) => prev.map((r) => (r.id === ruleId ? data.rule : r)));
        showToast(`Rule updated`);
        fetchData(true);
      }
    } catch {
      showToast("Failed to update rule", "error");
    }
  };

  // Set Security Mode
  const handleSetSecurityMode = async (mode: SecurityMode) => {
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-security", mode }),
      });
      const data = await res.json();
      if (data.success) {
        setSecurityMode(data.securityMode);
        showToast(`Security mode set to ${mode.toUpperCase()}`);
        fetchData(true);
      }
    } catch {
      showToast("Failed to change security mode", "error");
    }
  };

  // Clear Alarm
  const handleClearAlarm = async () => {
    try {
      await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-alarm" }),
      });
      setSecurityAlarm(false);
      showToast("Intruder alarm acknowledged and cleared");
      fetchData(true);
    } catch {
      showToast("Failed to clear alarm", "error");
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-logs" }),
      });
      setLogs([]);
      showToast("Activity log cleared");
    } catch {
      showToast("Failed to clear logs", "error");
    }
  };

  // Pulse Pin
  const handlePulse = async (id: number, durationMs = 400, times = 2) => {
    try {
      const res = await fetch("/api/gpio/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, durationMs, times }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(true);
        showToast(`Pulsed Pin ${id}`);
      }
    } catch {
      showToast("Failed to pulse pin", "error");
    }
  };

  // Rename Pin
  const handleRename = async (id: number, newName: string) => {
    try {
      const res = await fetch("/api/gpio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", id, name: newName }),
      });
      const data = await res.json();
      if (data.success) {
        setPins((prev) => prev.map((p) => (p.id === id ? data.pin : p)));
        showToast(`Renamed Pin ${id} to "${newName}"`);
      }
    } catch {
      showToast("Failed to rename pin", "error");
    }
  };

  // Master Bulk
  const handleSetAll = async (state: 0 | 1) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/gpio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-all", state }),
      });
      const data = await res.json();
      if (data.success) {
        setPins(data.pins);
        setStats(data.stats);
        showToast(`All output pins turned ${state === 1 ? "ON" : "OFF"}`);
      }
    } catch {
      showToast("Failed to set all pins", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Chaser sequence
  const handleChaserSequence = async () => {
    const controllablePins = pins.filter((p) => p.isControllable);
    showToast("Starting chaser animation...");
    for (const pin of controllablePins) {
      await handleToggle(pin.id);
      await new Promise((r) => setTimeout(r, 120));
      await handleToggle(pin.id);
    }
    showToast("Sequence completed!");
  };

  // Target pins for Hub
  const relayPin = pins.find((p) => p.id === 11);
  const motorPin = pins.find((p) => p.id === 13);

  // Filtered pins for Header/Cards view
  const filteredPins = pins.filter((p) => {
    if (!p.isControllable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPin = p.id.toString().includes(q);
      const matchBcm = p.bcm.toString().includes(q);
      if (!matchName && !matchPin && !matchBcm) return false;
    }
    if (filter === "active") return p.state === 1;
    if (filter === "presets") return [11, 13, 15, 16, 18].includes(p.id);
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        stats={stats}
        onRefresh={() => fetchData(false)}
        isLoading={isLoading}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onOpenWiringGuide={() => setIsWiringModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Telemetry Bar */}
        <SystemTelemetry stats={stats} />

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("hub")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "hub"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Smart Home Automation Hub</span>
            </button>

            <button
              onClick={() => setActiveTab("pins")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "pins"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Binary className="w-4 h-4" />
              <span>40-Pin Header & Raw GPIOs</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ALL-IN-ONE SMART AUTOMATION HUB */}
        {activeTab === "hub" && (
          <div className="space-y-6">
            {/* Actuators: Relay & DC Motor */}
            <ActuatorsPanel
              relayPin={relayPin}
              motorPin={motorPin}
              onTogglePin={handleToggle}
              onTriggerMotorAction={handleTriggerMotorAction}
              disabled={isProcessing}
            />

            {/* Sensors: PIR Radar, Light Meter, Push Button */}
            <SensorsPanel
              sensors={sensors}
              onSimulateSensor={handleSimulateSensor}
              driverMode={stats?.driverMode || "simulation"}
            />

            {/* Automation Rules Engine & Security Mode */}
            <AutomationRulesCard
              rules={rules}
              securityMode={securityMode}
              alarmTriggered={securityAlarm}
              onToggleRule={handleToggleRule}
              onSetSecurityMode={handleSetSecurityMode}
              onClearAlarm={handleClearAlarm}
              disabled={isProcessing}
            />

            {/* Real-time Activity Log */}
            <ActivityLog logs={logs} onClearLogs={handleClearLogs} />
          </div>
        )}

        {/* TAB 2: RAW 40-PIN HEADER & CARDS */}
        {activeTab === "pins" && (
          <div className="space-y-6">
            <QuickActions
              onSetAll={handleSetAll}
              onRunSequence={handleChaserSequence}
              isProcessing={isProcessing}
              filter={filter}
              setFilter={setFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controllable Cards */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {filteredPins.map((pin) => (
                    <PinCard
                      key={pin.id}
                      pin={pin}
                      onToggle={handleToggle}
                      onPulse={handlePulse}
                      onRename={handleRename}
                      disabled={isProcessing}
                    />
                  ))}
                </div>
              </div>

              {/* 40-Pin Diagram */}
              <div className="lg:col-span-5 lg:sticky lg:top-20">
                <PinHeaderDiagram pins={pins} onToggle={handleToggle} disabled={isProcessing} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hardware Wiring Modal */}
      <WiringGuideModal
        isOpen={isWiringModalOpen}
        onClose={() => setIsWiringModalOpen(false)}
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md text-xs font-semibold ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/40 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

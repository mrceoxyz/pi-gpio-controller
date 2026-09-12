"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { SystemTelemetry } from "@/components/SystemTelemetry";
import { QuickActions } from "@/components/QuickActions";
import { PinCard } from "@/components/PinCard";
import { PinHeaderDiagram } from "@/components/PinHeaderDiagram";
import { GpioPin, SystemStats } from "@/lib/types";
import { LayoutGrid, Binary, HelpCircle, CheckCircle, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [pins, setPins] = useState<GpioPin[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<"cards" | "header" | "split">("split");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch pin states & system stats
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/gpio", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setPins(data.pins);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching GPIO state:", err);
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
    }, 2500);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  // Toggle single pin
  const handleToggle = async (id: number) => {
    // Optimistic UI update
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
      } else {
        fetchData(true);
        showToast(data.error || "Failed to toggle pin", "error");
      }
    } catch {
      fetchData(true);
      showToast("Network error while toggling pin", "error");
    }
  };

  // Pulse / blink pin
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
        showToast(`Pulsed Pin ${id} successfully!`);
      } else {
        showToast(data.error || "Pulse failed", "error");
      }
    } catch {
      showToast("Network error during pulse", "error");
    }
  };

  // Rename pin
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

  // Set All pins state (Bulk)
  const handleSetAll = async (state: 0 | 1) => {
    setIsProcessing(true);
    // Optimistic
    setPins((prev) =>
      prev.map((p) => (p.isControllable && p.mode === "OUT" ? { ...p, state } : p))
    );

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
        showToast(`All pins turned ${state === 1 ? "ON" : "OFF"}`);
      }
    } catch {
      fetchData(true);
      showToast("Failed to update all pins", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fun sequence chaser
  const handleChaserSequence = async () => {
    const controllablePins = pins.filter((p) => p.isControllable);
    showToast("Starting chaser animation sequence...");

    for (const pin of controllablePins) {
      await handleToggle(pin.id);
      await new Promise((r) => setTimeout(r, 120));
      await handleToggle(pin.id);
    }
    showToast("Sequence completed!");
  };

  // Filtered controllable pins for card view
  const filteredPins = pins.filter((p) => {
    if (!p.isControllable) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPin = p.id.toString().includes(q);
      const matchBcm = p.bcm.toString().includes(q);
      if (!matchName && !matchPin && !matchBcm) return false;
    }

    // Category filter
    if (filter === "active") return p.state === 1;
    if (filter === "presets") {
      // Show highlighted pins (e.g. 11, 13, 15, 18, 12)
      return [11, 13, 15, 18, 12, 16, 22].includes(p.id);
    }
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
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Telemetry Row */}
        <SystemTelemetry stats={stats} />

        {/* Action Bar & Filtering */}
        <QuickActions
          onSetAll={handleSetAll}
          onRunSequence={handleChaserSequence}
          isProcessing={isProcessing}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* View Mode Tabs (Cards / Header / Split) */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200">
            {activeTab === "header"
              ? "Pin Header Visualizer"
              : activeTab === "cards"
              ? "Controllable Outputs"
              : "Dashboard Overview"}
          </h2>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "split" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "cards" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Cards Only</span>
            </button>
            <button
              onClick={() => setActiveTab("header")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "header" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>40-Pin Header</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        {activeTab === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Controllable Cards Grid */}
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
              {filteredPins.length === 0 && (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
                  No pins match your current filter or search criteria.
                </div>
              )}
            </div>

            {/* 40-Pin Header Diagram Sticky */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <PinHeaderDiagram pins={pins} onToggle={handleToggle} disabled={isProcessing} />
            </div>
          </div>
        )}

        {activeTab === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        )}

        {activeTab === "header" && (
          <div className="max-w-2xl mx-auto">
            <PinHeaderDiagram pins={pins} onToggle={handleToggle} disabled={isProcessing} />
          </div>
        )}
      </main>

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

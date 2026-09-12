"use client";

import React, { useState } from "react";
import { Power, ZapOff, Sparkles, Filter, Search } from "lucide-react";

interface QuickActionsProps {
  onSetAll: (state: 0 | 1) => Promise<void>;
  onRunSequence: () => Promise<void>;
  isProcessing: boolean;
  filter: string;
  setFilter: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSetAll,
  onRunSequence,
  isProcessing,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
}) => {
  const [isRunningSeq, setIsRunningSeq] = useState(false);

  const handleSequence = async () => {
    setIsRunningSeq(true);
    try {
      await onRunSequence();
    } finally {
      setIsRunningSeq(false);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Master Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSetAll(0)}
          disabled={isProcessing}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/60 active:scale-95 transition-all text-xs font-semibold shadow-sm disabled:opacity-50"
        >
          <ZapOff className="w-4 h-4 text-rose-400" />
          <span>All Off</span>
        </button>

        <button
          onClick={() => onSetAll(1)}
          disabled={isProcessing}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 active:scale-95 transition-all text-xs font-semibold shadow-sm disabled:opacity-50"
        >
          <Power className="w-4 h-4 text-emerald-400" />
          <span>All On</span>
        </button>

        <button
          onClick={handleSequence}
          disabled={isProcessing || isRunningSeq}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:border-indigo-500/60 active:scale-95 transition-all text-xs font-semibold shadow-sm disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 text-indigo-400 ${isRunningSeq ? "animate-spin" : ""}`} />
          <span>{isRunningSeq ? "Sequencing..." : "Chaser Blink"}</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 md:w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pin (e.g. 11, LED)..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "presets", label: "Presets" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === item.id
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

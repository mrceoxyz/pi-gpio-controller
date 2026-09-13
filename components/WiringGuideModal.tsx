"use client";

import React from "react";
import { X, Cpu, Zap, ShieldAlert, CheckCircle2 } from "lucide-react";

interface WiringGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WiringGuideModal: React.FC<WiringGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Hardware Wiring & Pinout Guide</h2>
              <p className="text-xs text-slate-400">
                Exact connection guide for Relay, DC Motor, PIR, Light Sensor, and Push Button
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Hardware Pin Mapping Table */}
          <div>
            <h3 className="font-semibold text-slate-100 text-sm mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Pi GPIO Pin Connections</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <th className="p-2.5">Device</th>
                    <th className="p-2.5">Signal Pin</th>
                    <th className="p-2.5">BCM GPIO</th>
                    <th className="p-2.5">Power (VCC)</th>
                    <th className="p-2.5">Ground (GND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 text-emerald-400 font-bold">Relay (Lamp)</td>
                    <td className="p-2.5 font-bold text-white">Pin 11</td>
                    <td className="p-2.5 text-slate-400">GPIO 17</td>
                    <td className="p-2.5 text-rose-400">Pin 2 (5V)</td>
                    <td className="p-2.5 text-slate-500">Pin 6 (GND)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 text-cyan-400 font-bold">DC Motor / Fan</td>
                    <td className="p-2.5 font-bold text-white">Pin 13</td>
                    <td className="p-2.5 text-slate-400">GPIO 27</td>
                    <td className="p-2.5 text-rose-400">Pin 4 (5V or External)</td>
                    <td className="p-2.5 text-slate-500">Pin 9 (GND)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 text-amber-400 font-bold">Light Sensor (LDR)</td>
                    <td className="p-2.5 font-bold text-white">Pin 15</td>
                    <td className="p-2.5 text-slate-400">GPIO 22</td>
                    <td className="p-2.5 text-amber-300">Pin 1 (3.3V)</td>
                    <td className="p-2.5 text-slate-500">Pin 14 (GND)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 text-indigo-400 font-bold">Push Button</td>
                    <td className="p-2.5 font-bold text-white">Pin 16</td>
                    <td className="p-2.5 text-slate-400">GPIO 23</td>
                    <td className="p-2.5 text-slate-400">Internal Pull-up</td>
                    <td className="p-2.5 text-slate-500">Pin 20 (GND)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 text-rose-400 font-bold">PIR Motion Sensor</td>
                    <td className="p-2.5 font-bold text-white">Pin 18</td>
                    <td className="p-2.5 text-slate-400">GPIO 24</td>
                    <td className="p-2.5 text-rose-400">Pin 2 (5V)</td>
                    <td className="p-2.5 text-slate-500">Pin 25 (GND)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety & Wiring Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Quick Wiring Tips</span>
              </h4>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>
                  <strong className="text-slate-200">Push Button:</strong> Wire one leg to Pin 16 and the other to Ground (Pin 20). No external resistor needed because the software activates the Pi's internal pull-up resistor.
                </li>
                <li>
                  <strong className="text-slate-200">Light Sensor:</strong> Connect DO (Digital Output) to Pin 15. Adjust the blue potentiometer screw on the sensor board until it triggers reliably at your desired light level.
                </li>
                <li>
                  <strong className="text-slate-200">PIR Sensor:</strong> Keep the motion sensor away from direct heat sources. Most modules have two orange dial screws to tune sensitivity and delay.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <h4 className="font-semibold text-rose-200 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>DC Motor Safety Note</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Do <strong className="text-rose-300">not</strong> connect a DC motor directly between the GPIO pin and Ground. DC motors draw high inductive current. Always drive the DC motor using a <strong>transistor (e.g. 2N2222/TIP120)</strong> or a <strong>motor driver / relay channel</strong> with a flyback diode (1N4001) to protect your Pi.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

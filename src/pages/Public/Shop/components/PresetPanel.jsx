// src/components/public/PresetPanel.jsx
import React from "react";

/**
 * PresetPanel
 * Props:
 *  - plan: plan object (with meta.presets)
 *  - selectedKey: currently selected preset key
 *  - onSelectPreset(key, preset)
 *  - onCustomizePreset(key, preset)
 */
export default function PresetPanel({ plan, selectedKey, onSelectPreset, onCustomizePreset }) {
    const presets = (plan && plan.meta && plan.meta.presets) || {};
    const keys = Object.keys(presets || []);

    if (!keys.length) {
        return (
            <div className="p-4 rounded-xl border border-white/10 bg-white/2 text-sm text-slate-400">
                Sem perfis pré-definidos.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">Perfis prontos</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {keys.map((k) => {
                    const p = presets[k] || {};
                    const isSel = String(k) === String(selectedKey);
                    return (
                        <div
                            key={k}
                            className={`p-4 rounded-lg border ${isSel ? "border-sky-500 bg-white/5" : "border-white/5"} flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-slate-100">{p.label || k}</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {p.cores} cores · {p.memory_gb} GB · {p.disk_gb} GB
                                        </div>
                                    </div>

                                    <div className="text-lg font-bold text-slate-100">
                                        {p.price ? `${Number(p.price).toFixed(2)}` : "—"}
                                    </div>
                                </div>

                                {p.description ? (
                                    <div className="text-xs text-slate-300 mt-3">{p.description}</div>
                                ) : null}
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => onSelectPreset?.(k, p)}
                                    className="px-3 py-1 rounded text-sm bg-white/5 border border-white/10"
                                >
                                    Selecionar
                                </button>

                                <button
                                    onClick={() => onCustomizePreset?.(k, p)}
                                    className="px-3 py-1 rounded text-sm border border-white/10"
                                >
                                    Personalizar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

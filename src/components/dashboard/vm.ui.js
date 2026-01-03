// src/components/dashboard/vm.ui.js
import { Server, Power, PauseCircle, HelpCircle } from "lucide-react";

/**
 * Contrato de UI para VMs
 * - STATUS_META: label + tone + icon
 * - badgeTone / glowTone: tons e efeitos
 * - VM_UI: tokens visuais (gradientes, panels, inner boxes)
 * - helpers: formatadores e safeText
 */

export const STATUS_META = {
    POWERED_ON: { label: "Online", tone: "emerald", icon: Server },
    POWERED_OFF: { label: "Offline", tone: "slate", icon: Power },
    SUSPENDED: { label: "Suspended", tone: "orange", icon: PauseCircle },
    UNKNOWN: { label: "Unknown", tone: "zinc", icon: HelpCircle },
};

export function getStatusMeta(status) {
    return STATUS_META[status] || STATUS_META.UNKNOWN;
}

/**
 * Tokens visuais (gradientes = diferencial)
 * - cardBg: base pesada do card
 * - panelBg: base de painel/list container
 * - innerBoxBg: caixas internas (cpu/ram/disk)
 * - headerStripBg: faixa superior (bulk bar / toolbars)
 */
export const VM_UI = {
    cardBg:
        "bg-gradient-to-b from-slate-900/90 via-slate-950/75 to-slate-950/95 backdrop-blur",
    panelBg:
        "bg-gradient-to-b from-slate-900/85 via-slate-950/70 to-slate-950/90 backdrop-blur",
    innerBoxBg:
        "bg-gradient-to-b from-slate-950/70 to-slate-950/25",
    headerStripBg:
        "bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-slate-950/20",
};

export function badgeTone(tone) {
    const map = {
        emerald: "bg-emerald-500/18 text-emerald-200 border-emerald-500/28",
        slate: "bg-slate-500/18 text-slate-200 border-slate-500/28",
        orange: "bg-orange-500/18 text-orange-200 border-orange-500/28",
        zinc: "bg-zinc-500/18 text-zinc-200 border-zinc-500/28",
        blue: "bg-blue-500/18 text-blue-200 border-blue-500/28",
        red: "bg-red-500/18 text-red-200 border-red-500/28",
    };
    return map[tone] || map.zinc;
}

export function glowTone(tone) {
    // glow mais presente (UI pesada), mas ainda controlado
    const map = {
        emerald:
            "shadow-[0_0_0_1px_rgba(16,185,129,0.24),0_0_26px_rgba(16,185,129,0.14)]",
        slate:
            "shadow-[0_0_0_1px_rgba(148,163,184,0.18),0_0_20px_rgba(148,163,184,0.10)]",
        orange:
            "shadow-[0_0_0_1px_rgba(249,115,22,0.24),0_0_26px_rgba(249,115,22,0.14)]",
        zinc:
            "shadow-[0_0_0_1px_rgba(161,161,170,0.16),0_0_18px_rgba(161,161,170,0.10)]",
        blue:
            "shadow-[0_0_0_1px_rgba(96,165,250,0.20),0_0_26px_rgba(96,165,250,0.14)]",
        red:
            "shadow-[0_0_0_1px_rgba(239,68,68,0.20),0_0_26px_rgba(239,68,68,0.14)]",
    };
    return map[tone] || map.zinc;
}

export function formatRam(mb) {
    if (!mb) return "—";
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
}

export function formatDisk(gb) {
    if (!gb) return "—";
    return `${gb} GB`;
}

export function safeText(value, fallback = "—") {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
}

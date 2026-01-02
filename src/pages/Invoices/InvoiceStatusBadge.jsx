import React from "react";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

export default function InvoiceStatusBadge({ status }) {
    const s = String(status || "").toLowerCase();

    const base =
        "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border";

    const map = {
        draft:
            "border-slate-500/20 bg-slate-500/10 text-slate-300",
        issued:
            "border-sky-500/20 bg-sky-500/10 text-sky-300",
        overdue:
            "border-rose-500/20 bg-rose-500/10 text-rose-300",
        paid:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        canceled:
            "border-white/10 bg-white/5 text-slate-400",
    };

    return (
        <span className={cn(base, map[s] || map.draft)}>
      {s || "draft"}
    </span>
    );
}

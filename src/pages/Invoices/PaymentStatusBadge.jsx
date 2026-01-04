function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

/**
 * Status que aparecem em payments:
 * confirmed | pending | failed (e outros futuros)
 */
export default function PaymentStatusBadge({ status }) {
    const s = (status || "").toLowerCase();

    const map = {
        confirmed: { label: "Confirmed", tone: "emerald" },
        pending: { label: "Pending", tone: "amber" },
        failed: { label: "Failed", tone: "red" },
    };

    const cfg = map[s] || { label: status || "—", tone: "slate" };

    return (
        <span
            className={cls(
                "text-[10px] px-2 py-1 rounded-xl border inline-flex items-center gap-2",
                cfg.tone === "emerald" && "border-emerald-700/40 bg-emerald-900/10 text-emerald-200",
                cfg.tone === "amber" && "border-amber-700/40 bg-amber-900/10 text-amber-200",
                cfg.tone === "red" && "border-red-700/40 bg-red-900/10 text-red-200",
                cfg.tone === "slate" && "border-slate-700/40 bg-slate-900/10 text-slate-200"
            )}
            title={cfg.label}
        >
      {cfg.label}
    </span>
    );
}

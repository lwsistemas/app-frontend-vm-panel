export function getRoleFromStorage() {
    // 1) tenta "user" (mais confiável)
    try {
        const me = JSON.parse(localStorage.getItem("user") || "null");
        if (me?.role) return String(me.role).toLowerCase();
    } catch {}

    // 2) fallback: header_summary_cache
    try {
        const summary = JSON.parse(localStorage.getItem("header_summary_cache") || "null");
        if (summary?.scope?.role) return String(summary.scope.role).toLowerCase();
    } catch {}

    return "user";
}

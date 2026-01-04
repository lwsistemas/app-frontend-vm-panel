// src/components/SideBar/getUserFromStorage.js
export function getUserFromStorage() {
    // 1) user (mais confiável)
    try {
        const me = JSON.parse(localStorage.getItem("user") || "null");
        if (me && typeof me === "object") return me;
    } catch {}

    // 2) fallback: header_summary_cache.scope
    try {
        const summary = JSON.parse(localStorage.getItem("header_summary_cache") || "null");
        if (summary?.scope) return summary.scope;
    } catch {}

    return null;
}

export function getRoleFromStorage() {
    const me = getUserFromStorage();
    return String(me?.role || "user").toLowerCase();
}

export function isPrivilegedRole(role) {
    return ["root", "admin", "support"].includes(String(role || "").toLowerCase());
}

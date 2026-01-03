// src/hooks/useLiveDashboardSummary.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDashboardSummary } from "../services/dashboard";

function nowIso() {
    return new Date().toISOString();
}

function calcDiff(prev, next) {
    // diff minimalista e útil pra highlight:
    // - kpis.byStatus.*
    // - alerts.*Count
    // - inventory.kpis.ipsByStatus.*
    // (se o bloco não existir, ignora)
    const changed = new Set();

    if (!prev || !next) return changed;

    const pK = prev?.kpis?.byStatus || {};
    const nK = next?.kpis?.byStatus || {};
    Object.keys(nK).forEach((k) => {
        if (pK[k] !== nK[k]) changed.add(`kpis.byStatus.${k}`);
    });

    const pA = prev?.alerts || {};
    const nA = next?.alerts || {};
    ["staleSyncCount", "offlineOldCount"].forEach((k) => {
        if (pA[k] !== nA[k]) changed.add(`alerts.${k}`);
    });

    const pInv = prev?.inventory?.kpis?.ipsByStatus || null;
    const nInv = next?.inventory?.kpis?.ipsByStatus || null;
    if (pInv && nInv) {
        Object.keys(nInv).forEach((k) => {
            if (pInv[k] !== nInv[k]) changed.add(`inventory.kpis.ipsByStatus.${k}`);
        });
    }

    return changed;
}

export default function useLiveDashboardSummary({ defaultLive = false, defaultIntervalMs = 30000 } = {}) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isLive, setIsLive] = useState(defaultLive);
    const [intervalMs, setIntervalMs] = useState(defaultIntervalMs);

    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [changedKeys, setChangedKeys] = useState(new Set());

    const prevRef = useRef(null);
    const timerRef = useRef(null);
    const clearingRef = useRef(null);

    const isPrivileged = useMemo(() => {
        const role = (summary?.scope?.role || "").toLowerCase();
        return ["root", "admin", "support"].includes(role);
    }, [summary?.scope?.role]);

    const fetchOnce = useCallback(async () => {
        try {
            const next = await getDashboardSummary();

            const prev = prevRef.current;
            const diff = calcDiff(prev, next);

            prevRef.current = next;
            setSummary(next);
            setLastUpdatedAt(nowIso());

            if (diff.size > 0) {
                setChangedKeys(diff);

                // limpa highlight depois de 1200ms
                if (clearingRef.current) clearTimeout(clearingRef.current);
                clearingRef.current = setTimeout(() => setChangedKeys(new Set()), 1200);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // first load
    useEffect(() => {
        fetchOnce();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (clearingRef.current) clearTimeout(clearingRef.current);
        };
    }, [fetchOnce]);

    // live polling
    useEffect(() => {
        if (!isPrivileged) return; // regra: live é coisa de NOC/DC
        if (!isLive) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return;
        }

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(fetchOnce, intervalMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [isLive, intervalMs, fetchOnce, isPrivileged]);

    // se não for privilegiado, força live off
    useEffect(() => {
        if (!isPrivileged && isLive) setIsLive(false);
    }, [isPrivileged, isLive]);

    return {
        summary,
        loading,
        isPrivileged,

        isLive,
        setIsLive,

        intervalMs,
        setIntervalMs,

        lastUpdatedAt,
        changedKeys,

        refresh: fetchOnce,
    };
}

// src/context/VmLiveContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../services";

const VmLiveContext = createContext(null);

function mergeById(prev, next) {
    // ✅ diff leve: preserva referência de itens que não mudaram
    const mapPrev = new Map((prev || []).map(v => [v.id, v]));
    const out = [];

    for (const n of (next || [])) {
        const p = mapPrev.get(n.id);
        if (!p) {
            out.push(n);
            continue;
        }

        // se mudou algum campo, troca; senão reaproveita objeto antigo
        const same =
            p.status === n.status &&
            p.name === n.name &&
            p.hostname === n.hostname &&
            p.ip_address === n.ip_address &&
            p.cpu === n.cpu &&
            p.memory_mb === n.memory_mb &&
            p.owner_id === n.owner_id &&
            p.updated_at === n.updated_at;

        out.push(same ? p : n);
    }

    return out;
}

export function VmLiveProvider({ children }) {
    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(null);

    const timerRef = useRef(null);
    const abortRef = useRef(null);
    const inFlightRef = useRef(false);

    const POLL_MS = 10000; // ✅ 10s (padrão AWS-like)

    async function fetchVms({ silent = false } = {}) {
        if (inFlightRef.current) return;
        inFlightRef.current = true;

        if (!silent) setLoading(true);

        try {
            // abort request anterior se existir
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const { data } = await api.get("/vm", {
                params: { limit: 200 }, // ajuste se precisar
                signal: abortRef.current.signal,
            });

            const list = data?.rows || data || [];
            setVms(prev => mergeById(prev, list));
            setLastSyncAt(new Date());
        } catch (err) {
            if (err?.name === "CanceledError") return;
            if (err?.code === "ERR_CANCELED") return;
            // sem spam
            console.log("[VM-LIVE][FETCH][FAIL]", err?.message || err);
        } finally {
            inFlightRef.current = false;
            if (!silent) setLoading(false);
        }
    }

    function refresh() {
        return fetchVms({ silent: false });
    }

    // ✅ start polling 1 vez
    useEffect(() => {
        fetchVms({ silent: false });

        timerRef.current = setInterval(() => {
            fetchVms({ silent: true });
        }, POLL_MS);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo(() => {
        return {
            vms,
            loading,
            lastSyncAt,
            refresh,
            setVms, // útil para optimistic update nas ações
        };
    }, [vms, loading, lastSyncAt]);

    return (
        <VmLiveContext.Provider value={value}>
            {children}
        </VmLiveContext.Provider>
    );
}

export function useVmLive() {
    const ctx = useContext(VmLiveContext);
    if (!ctx) throw new Error("useVmLive must be used inside VmLiveProvider");
    return ctx;
}

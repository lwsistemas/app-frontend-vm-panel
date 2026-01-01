// src/pages/InventoryDc/InventoryPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import api from "../../services";

import InventoryHeader from "./components/InventoryHeader";
import InventoryFilters from "./components/InventoryFilters";
import InventoryServerList from "./components/InventoryServerList";
import InventoryServerDetails from "./components/InventoryServerDetails";
import InventoryIpsPanel from "./components/InventoryIpsPanel";

import {
    cn,
    formatProvider,
    normalizeStatus,
    getServerKey,
    buildStatsMapFromIps,
    calcTotalPages,
    ipsToCsvRows,
    rowsToCsv,
} from "./utils/inventoryDcHelpers";

export default function InventoryPage() {
    const [loadingServers, setLoadingServers] = useState(false);
    const [loadingIps, setLoadingIps] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState(null);

    const [ips, setIps] = useState([]);

    /**
     * ✅ serverStatsMap[serverId] = { total, free, reserved, assigned }
     * Agora é preenchido prioritariamente via /stats.
     */
    const [serverStatsMap, setServerStatsMap] = useState({});

    // Server filters
    const [search, setSearch] = useState("");
    const [provider, setProvider] = useState("");
    const [dc, setDc] = useState("");
    const [status, setStatus] = useState("");

    // IP toolbar
    const [ipSearch, setIpSearch] = useState("");
    const [ipStatus, setIpStatus] = useState("");

    // IP pagination
    const [ipPage, setIpPage] = useState(1);
    const [ipLimit] = useState(25);
    const [ipTotalPages, setIpTotalPages] = useState(1);

    // =====================================================
    // Options
    // =====================================================
    const providerOptions = useMemo(() => {
        const all = new Set((servers || []).map((s) => formatProvider(s.provider)));
        return Array.from(all)
            .filter(Boolean)
            .sort()
            .map((p) => ({ value: p, label: p }));
    }, [servers]);

    const dcOptions = useMemo(() => {
        const all = new Set((servers || []).map((s) => s.dc));
        return Array.from(all)
            .filter(Boolean)
            .sort()
            .map((d) => ({ value: d, label: d }));
    }, [servers]);

    const statusOptions = useMemo(() => {
        return [
            { value: "active", label: "active" },
            { value: "inactive", label: "inactive" },
        ];
    }, []);

    const ipStatusOptions = useMemo(() => {
        return [
            { value: "free", label: "free" },
            { value: "reserved", label: "reserved" },
            { value: "assigned", label: "assigned" },
        ];
    }, []);

    // =====================================================
    // API Calls
    // =====================================================
    async function loadServers() {
        setLoadingServers(true);
        try {
            const res = await api.get("/inventory/servers", {
                params: {
                    search: search || undefined,
                    provider: provider || undefined,
                    dc: dc || undefined,
                    status: status || undefined,
                    // se quiser paginação no server list futuramente:
                    // page: 1,
                    // limit: 100,
                },
            });

            const payload = res?.data;
            // backend oficial: { ok:true, data:[...], meta:{...} }
            const list = payload?.data || [];

            setServers(Array.isArray(list) ? list : []);

            // mantém seleção ou escolhe primeiro
            if (!selectedServer && Array.isArray(list) && list.length > 0) {
                setSelectedServer(list[0]);
            } else if (selectedServer) {
                const selId = getServerKey(selectedServer);
                const updated = (Array.isArray(list) ? list : []).find(
                    (s) => String(getServerKey(s)) === String(selId)
                );
                if (updated) setSelectedServer(updated);
            }
        } catch (e) {
            console.error("[InventoryPage] loadServers error:", e);
            setServers([]);
        } finally {
            setLoadingServers(false);
        }
    }

    /**
     * ✅ Carrega stats reais do servidor (independente da paginação)
     * GET /inventory/servers/:id/stats
     */
    async function loadServerStats(server) {
        if (!server) return;
        const serverId = getServerKey(server);
        if (!serverId) return;

        setLoadingStats(true);
        try {
            const res = await api.get(`/inventory/servers/${serverId}/stats`);
            const payload = res?.data;
            const stats = payload?.data || null;

            if (stats && typeof stats === "object") {
                setServerStatsMap((prev) => ({
                    ...prev,
                    [serverId]: {
                        total: Number(stats.total || 0),
                        free: Number(stats.free || 0),
                        reserved: Number(stats.reserved || 0),
                        assigned: Number(stats.assigned || 0),
                    },
                }));
            }
        } catch (e) {
            // não quebra a UI, só loga
            console.warn("[InventoryPage] loadServerStats warning:", e?.message || e);
        } finally {
            setLoadingStats(false);
        }
    }

    /**
     * ✅ Lista IPs paginado
     * GET /inventory/servers/:id/ips
     */
    async function loadIpsForServer(server, page = 1) {
        if (!server) return;

        setLoadingIps(true);
        setIps([]);

        try {
            const serverId = getServerKey(server);
            if (!serverId) return;

            const res = await api.get(`/inventory/servers/${serverId}/ips`, {
                params: {
                    search: ipSearch || undefined,
                    status: ipStatus || undefined,
                    page,
                    limit: ipLimit,
                },
            });

            const payload = res?.data;

            // backend oficial: { ok:true, data:[...], meta:{...} }
            const list = payload?.data || [];
            const meta = payload?.meta || null;

            const safeList = Array.isArray(list) ? list : [];
            setIps(safeList);

            // Paginação
            if (meta?.totalPages) {
                setIpTotalPages(Number(meta.totalPages) || 1);
            } else if (meta?.total && meta?.limit) {
                setIpTotalPages(calcTotalPages(meta.total, meta.limit));
            } else {
                setIpTotalPages(1);
            }

            /**
             * ✅ fallback local:
             * Se stats ainda não foi carregado (ou falhou),
             * preenche statsMap baseado na lista atual.
             * (Mas o correto é /stats, isso aqui é só fallback).
             */
            setServerStatsMap((prev) => {
                if (prev?.[serverId]) return prev;

                const free = safeList.filter((i) => normalizeStatus(i.status) === "free").length;
                const reserved = safeList.filter((i) => normalizeStatus(i.status) === "reserved").length;
                const assigned = safeList.filter((i) => normalizeStatus(i.status) === "assigned").length;

                return {
                    ...prev,
                    [serverId]: {
                        total: safeList.length,
                        free,
                        reserved,
                        assigned,
                    },
                };
            });
        } catch (e) {
            console.error("[InventoryPage] loadIpsForServer error:", e);
            setIps([]);
            setIpTotalPages(1);
        } finally {
            setLoadingIps(false);
        }
    }

    // =====================================================
    // Effects
    // =====================================================
    useEffect(() => {
        loadServers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // reload servers on filter change
    useEffect(() => {
        const t = setTimeout(() => loadServers(), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, provider, dc, status]);

    // when selected server changes: reset page, load stats + ips
    useEffect(() => {
        if (!selectedServer) return;

        // sempre puxar stats real
        loadServerStats(selectedServer);

        // reset e carrega IPs do server
        setIpPage(1);
        loadIpsForServer(selectedServer, 1);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServer]);

    // reload ips when ip toolbar changes
    useEffect(() => {
        if (!selectedServer) return;
        const t = setTimeout(() => {
            setIpPage(1);
            loadIpsForServer(selectedServer, 1);
            // stats não precisa recarregar aqui (é independente de filtros)
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ipSearch, ipStatus]);

    // =====================================================
    // Handlers
    // =====================================================
    function clearFilters() {
        setSearch("");
        setProvider("");
        setDc("");
        setStatus("");
    }

    async function handleSync() {
        await loadServers();
        if (selectedServer) {
            await loadServerStats(selectedServer);
            setIpPage(1);
            await loadIpsForServer(selectedServer, 1);
        }
    }

    function exportCsv() {
        const rows = ipsToCsvRows(ips);
        const csv = rowsToCsv(rows);

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory_ips_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleChangeIpPage(p) {
        const next = Math.max(1, Math.min(Number(p || 1), ipTotalPages));
        setIpPage(next);
        loadIpsForServer(selectedServer, next);
    }

    // Stats do servidor selecionado (agora via /stats)
    const selectedStats = useMemo(() => {
        const id = getServerKey(selectedServer);
        if (!id) return { total: 0, free: 0, reserved: 0, assigned: 0 };
        return (
            serverStatsMap?.[id] || { total: 0, free: 0, reserved: 0, assigned: 0 }
        );
    }, [selectedServer, serverStatsMap]);

    const isBusy = loadingServers || loadingIps || loadingStats;

    // =====================================================
    // Layout (VmPages style)
    // =====================================================
    return (
        <div className="relative">
            {/* Background / Gradient (padrão VmPages) */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            <div className="p-6 space-y-5">
                <InventoryHeader
                    loading={loadingServers}
                    loadingIps={loadingIps}
                    onSync={handleSync}
                    onExport={exportCsv}
                    exportDisabled={!ips?.length}
                />

                <InventoryFilters
                    search={search}
                    provider={provider}
                    dc={dc}
                    status={status}
                    providerOptions={providerOptions}
                    dcOptions={dcOptions}
                    statusOptions={statusOptions}
                    onChangeSearch={setSearch}
                    onChangeProvider={setProvider}
                    onChangeDc={setDc}
                    onChangeStatus={setStatus}
                    onClear={clearFilters}
                />

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* Left: Servers */}
                    <div className="xl:col-span-4 space-y-4">
                        <InventoryServerList
                            servers={servers}
                            selectedServer={selectedServer}
                            onSelectServer={setSelectedServer}
                            serverStatsMap={serverStatsMap}
                            loading={loadingServers}
                        />
                    </div>

                    {/* Right: Details + IPs */}
                    <div className="xl:col-span-8 space-y-4">
                        <InventoryServerDetails server={selectedServer} />

                        <InventoryIpsPanel
                            selectedServer={selectedServer}
                            ips={ips}
                            loading={loadingIps}
                            ipSearch={ipSearch}
                            onChangeIpSearch={setIpSearch}
                            ipStatus={ipStatus}
                            onChangeIpStatus={setIpStatus}
                            ipStatusOptions={ipStatusOptions}
                            stats={selectedStats}
                            page={ipPage}
                            totalPages={ipTotalPages}
                            onChangePage={handleChangeIpPage}
                        />
                    </div>
                </div>

                {/* Footer debug minimal (opcional) */}
                <div className="text-[11px] text-slate-600">
          <span className="mr-3">
            busy: {String(isBusy)}
          </span>
                </div>
            </div>
        </div>
    );
}

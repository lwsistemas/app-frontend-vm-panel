// src/pages/inventory/InventoryPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
    Database,
    Server,
    Network,
    CheckCircle,
    Bookmark,
    Link2,
    RefreshCcw,
    Download,
    BookmarkPlus,
    Eye,
    Copy,
    Search,
    Filter,
    MapPin,
    SlidersHorizontal,
    X,
    Info,
    AlertTriangle,
    ShieldCheck,
    Layers,
} from "lucide-react";

// ✅ Ajuste aqui conforme seu projeto:
// Se você já tem um api client central, troque para ele.

import api from "../../services";

// <- ajuste se necessário

// =====================================================
// Helpers UI
// =====================================================
function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function now() {
    return new Date().toISOString();
}

function formatProvider(p) {
    if (!p) return "unknown";
    return String(p).toLowerCase();
}

function getStatusMeta(status) {
    const s = String(status || "").toLowerCase();

    if (s === "free") {
        return { icon: <CheckCircle size={12} />, label: "free", cls: "bg-green-900/30 text-green-300 border-green-800" };
    }
    if (s === "reserved") {
        return { icon: <Bookmark size={12} />, label: "reserved", cls: "bg-yellow-900/30 text-yellow-300 border-yellow-800" };
    }
    if (s === "assigned") {
        return { icon: <Link2 size={12} />, label: "assigned", cls: "bg-blue-900/30 text-blue-300 border-blue-800" };
    }
    if (s === "active") {
        return { icon: <CheckCircle size={12} />, label: "active", cls: "bg-green-900/20 text-green-200 border-green-800" };
    }
    if (s === "disabled" || s === "inactive") {
        return { icon: <AlertTriangle size={12} />, label: "inactive", cls: "bg-red-900/20 text-red-200 border-red-800" };
    }

    return { icon: <Info size={12} />, label: status || "unknown", cls: "bg-slate-900/40 text-slate-300 border-slate-700" };
}

function Badge({ status, className }) {
    const meta = getStatusMeta(status);
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border",
                meta.cls,
                className
            )}
        >
      {meta.icon}
            {meta.label}
    </span>
    );
}

function StatCard({ icon, label, value, sub }) {
    return (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-xl font-semibold text-slate-100">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
                {sub ? <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div> : null}
            </div>
        </div>
    );
}

function IconButton({ title, onClick, children, disabled }) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900/70 transition",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );
}

function PrimaryButton({ children, onClick, disabled, className }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
                className
            )}
        >
            {children}
        </button>
    );
}

function SecondaryButton({ children, onClick, disabled, className }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900/70 text-slate-200 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
                className
            )}
        >
            {children}
        </button>
    );
}

function InputWithIcon({ icon, value, onChange, placeholder }) {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                {icon}
            </div>
            <input
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-9 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-600"
            />
        </div>
    );
}

function SelectWithIcon({ icon, value, onChange, options, placeholder }) {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                {icon}
            </div>
            <select
                value={value}
                onChange={onChange}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// =====================================================
// API Layer (ajuste se seus endpoints diferem)
// =====================================================
async function apiListServers(params = {}) {
    // GET /inventory/servers
    // Esperado: { status:true, data:[...] } OU lista direta
    const res = await api.get("/inventory/servers", { params });
    return res.data?.data || res.data || [];
}

async function apiListServerIps(serverId, params = {}) {
    // GET /inventory/servers/:id/ips
    const res = await api.get(`/inventory/servers/${serverId}/ips`, { params });
    return res.data?.data || res.data || [];
}

// =====================================================
// Main Page
// =====================================================
export default function InventoryPage() {
    const [loading, setLoading] = useState(false);
    const [loadingIps, setLoadingIps] = useState(false);

    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState(null);

    const [ips, setIps] = useState([]);

    // Filters
    const [search, setSearch] = useState("");
    const [provider, setProvider] = useState("");
    const [dc, setDc] = useState("");
    const [status, setStatus] = useState("");

    // Local table search
    const [ipSearch, setIpSearch] = useState("");

    const providersOptions = useMemo(() => {
        const all = new Set((servers || []).map((s) => formatProvider(s.provider)));
        const list = Array.from(all).filter(Boolean).sort();
        return list.map((p) => ({ value: p, label: p }));
    }, [servers]);

    const dcOptions = useMemo(() => {
        const all = new Set((servers || []).map((s) => s.dc || s.location || s.data_center || s.dataCenterLabel));
        const list = Array.from(all).filter(Boolean).sort();
        return list.map((d) => ({ value: d, label: d }));
    }, [servers]);

    const statusOptions = useMemo(() => {
        return [
            { value: "active", label: "active" },
            { value: "inactive", label: "inactive" },
            { value: "free", label: "free" },
            { value: "reserved", label: "reserved" },
            { value: "assigned", label: "assigned" },
        ];
    }, []);

    // =====================================================
    // Derived metrics (KPI)
    // =====================================================
    const kpi = useMemo(() => {
        const totalServers = servers.length;

        // Se backend já mandar counts por server, melhor.
        // Se não mandar, a gente calcula baseado nos IPs carregados (de um server).
        let totalIps = 0;
        let free = 0;
        let reserved = 0;
        let assigned = 0;

        for (const s of servers) {
            totalIps += Number(s.ips_total || s.total_ips || 0);
            free += Number(s.ips_free || s.free_ips || 0);
            reserved += Number(s.ips_reserved || s.reserved_ips || 0);
            assigned += Number(s.ips_assigned || s.assigned_ips || 0);
        }

        // fallback: se não vier totals do backend,
        // usa o ips do server selecionado para mostrar parcial.
        if (totalIps === 0 && ips.length > 0) {
            totalIps = ips.length;
            free = ips.filter((i) => i.status === "free").length;
            reserved = ips.filter((i) => i.status === "reserved").length;
            assigned = ips.filter((i) => i.status === "assigned").length;
        }

        const providersSet = new Set(servers.map((s) => formatProvider(s.provider)));
        const providersCount = Array.from(providersSet).filter(Boolean).length;

        return {
            totalServers,
            totalIps,
            free,
            reserved,
            assigned,
            providersCount,
        };
    }, [servers, ips]);

    const ipsStats = useMemo(() => {
        const total = ips.length;
        const free = ips.filter((i) => i.status === "free").length;
        const reserved = ips.filter((i) => i.status === "reserved").length;
        const assigned = ips.filter((i) => i.status === "assigned").length;
        return { total, free, reserved, assigned };
    }, [ips]);

    // =====================================================
    // Load
    // =====================================================
    async function loadServers() {
        setLoading(true);
        try {
            const data = await apiListServers({
                search: search || undefined,
                provider: provider || undefined,
                dc: dc || undefined,
                status: status || undefined,
            });

            setServers(Array.isArray(data) ? data : []);
            // auto select first server if none selected
            if (!selectedServer && Array.isArray(data) && data.length > 0) {
                setSelectedServer(data[0]);
            }
        } catch (e) {
            console.error("[InventoryPage] loadServers error:", e.message || e);
            setServers([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadIpsForServer(server) {
        if (!server) return;
        setLoadingIps(true);
        setIps([]);

        try {
            const serverId = server.server_id || server.serverId || server.id;
            if (!serverId) return;

            const data = await apiListServerIps(serverId, {
                search: ipSearch || undefined,
            });

            setIps(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("[InventoryPage] loadIpsForServer error:", e.message || e);
            setIps([]);
        } finally {
            setLoadingIps(false);
        }
    }

    // initial load
    useEffect(() => {
        loadServers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // when filters change, reload servers (debounce manual simples)
    useEffect(() => {
        const t = setTimeout(() => loadServers(), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, provider, dc, status]);

    // when selected server changes, load ips
    useEffect(() => {
        if (!selectedServer) return;
        loadIpsForServer(selectedServer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServer]);

    // ip search changes
    useEffect(() => {
        if (!selectedServer) return;
        const t = setTimeout(() => loadIpsForServer(selectedServer), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ipSearch]);

    // =====================================================
    // Actions
    // =====================================================
    function clearFilters() {
        setSearch("");
        setProvider("");
        setDc("");
        setStatus("");
    }

    function copyToClipboard(txt) {
        if (!txt) return;
        navigator.clipboard.writeText(String(txt));
    }

    async function handleSync() {
        // Se você tem endpoint de sync manual:
        // await api.post("/inventory/sync");
        // por enquanto só recarrega
        await loadServers();
        if (selectedServer) await loadIpsForServer(selectedServer);
    }

    function exportCsv() {
        // Export simples do que está carregado (ips da tabela)
        const rows = ips.map((i) => ({
            ip: i.ip_address || i.ip || "",
            gateway: i.gateway || "",
            subnet: i.subnet || "",
            status: i.status || "",
            server_id: i.server_id || i.external_id || "",
        }));

        const header = Object.keys(rows[0] || { ip: "", gateway: "", subnet: "", status: "", server_id: "" });
        const csv = [
            header.join(","),
            ...rows.map((r) => header.map((k) => `"${String(r[k] ?? "").replaceAll('"', '""')}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory_ips_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // =====================================================
    // Render
    // =====================================================
    return (
        <div className="p-6 space-y-5">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
                        <Database size={20} className="text-slate-200" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                            Inventory DC
                            <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                <Layers size={14} />
                Multi-provider
              </span>
                        </h1>
                        <p className="text-sm text-slate-400">
                            Servidores físicos e blocos de IP do Datacenter (independente do vCenter).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <SecondaryButton onClick={exportCsv} disabled={ips.length === 0}>
                        <Download size={16} />
                        Exportar
                    </SecondaryButton>

                    <SecondaryButton onClick={() => {}} disabled={true} title="Em breve: criar reserva e vincular com host vCenter">
                        <BookmarkPlus size={16} />
                        Reservar IP
                    </SecondaryButton>

                    <SecondaryButton onClick={() => {}} disabled={true} title="Em breve: vincular host do vCenter ao servidor físico">
                        <Link2 size={16} />
                        Vincular Host
                    </SecondaryButton>

                    <PrimaryButton onClick={handleSync} disabled={loading || loadingIps}>
                        <RefreshCcw size={16} />
                        Sincronizar
                    </PrimaryButton>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                <StatCard
                    icon={<Server size={18} className="text-slate-200" />}
                    label="Servidores"
                    value={kpi.totalServers}
                    sub="Inventário DC"
                />
                <StatCard
                    icon={<Network size={18} className="text-slate-200" />}
                    label="Total IPs"
                    value={kpi.totalIps}
                    sub="Somatório (quando disponível)"
                />
                <StatCard
                    icon={<CheckCircle size={18} className="text-slate-200" />}
                    label="Livres"
                    value={kpi.free}
                    sub="Disponíveis"
                />
                <StatCard
                    icon={<Bookmark size={18} className="text-slate-200" />}
                    label="Reservados"
                    value={kpi.reserved}
                    sub="Bloqueados"
                />
                <StatCard
                    icon={<Link2 size={18} className="text-slate-200" />}
                    label="Atribuídos"
                    value={kpi.assigned}
                    sub="Em uso"
                />
                <StatCard
                    icon={<ShieldCheck size={18} className="text-slate-200" />}
                    label="Providers"
                    value={kpi.providersCount}
                    sub="ReliableSite / outros"
                />
            </div>

            {/* FILTERS */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-200 font-medium">
                        <SlidersHorizontal size={16} className="text-slate-300" />
                        Filtros
                    </div>

                    <div className="flex items-center gap-2">
                        <SecondaryButton onClick={clearFilters}>
                            <X size={16} />
                            Limpar
                        </SecondaryButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <InputWithIcon
                        icon={<Search size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar servidor / IP / MAC..."
                    />
                    <SelectWithIcon
                        icon={<Filter size={14} />}
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        options={providersOptions}
                        placeholder="Provider"
                    />
                    <SelectWithIcon
                        icon={<MapPin size={14} />}
                        value={dc}
                        onChange={(e) => setDc(e.target.value)}
                        options={dcOptions}
                        placeholder="Data Center"
                    />
                    <SelectWithIcon
                        icon={<SlidersHorizontal size={14} />}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={statusOptions}
                        placeholder="Status"
                    />
                </div>
            </div>

            {/* MAIN */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* LEFT: SERVERS */}
                <div className="xl:col-span-4">
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-200 font-medium">
                                <Server size={16} className="text-slate-300" />
                                Servidores ({servers.length})
                            </div>
                            {loading ? (
                                <span className="text-xs text-slate-500">carregando...</span>
                            ) : (
                                <span className="text-xs text-slate-500">updated: {new Date().toLocaleTimeString()}</span>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                            {loading ? (
                                <div className="text-sm text-slate-400 p-3">Carregando servidores...</div>
                            ) : servers.length === 0 ? (
                                <div className="text-sm text-slate-400 p-3">
                                    Nenhum servidor encontrado com os filtros atuais.
                                </div>
                            ) : (
                                servers.map((s) => {
                                    const id = s.server_id || s.serverId || s.id;
                                    const label = s.server_label || s.serverLabel || s.name || s.hostname || `Server ${id}`;
                                    const providerName = formatProvider(s.provider);
                                    const dcLabel = s.dc || s.location || s.data_center || s.dataCenterLabel || "-";
                                    const st = s.status || "active";

                                    const selected = (selectedServer?.server_id || selectedServer?.serverId || selectedServer?.id) === id;

                                    const totalIps = s.ips_total || s.total_ips || 0;
                                    const freeIps = s.ips_free || s.free_ips || 0;
                                    const assignedIps = s.ips_assigned || s.assigned_ips || 0;

                                    return (
                                        <button
                                            key={String(id)}
                                            type="button"
                                            onClick={() => setSelectedServer(s)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2",
                                                selected
                                                    ? "border-blue-600 bg-blue-900/10"
                                                    : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60"
                                            )}
                                        >
                                            <div className="flex gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center shrink-0">
                                                    <Server size={16} className="text-slate-200" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-slate-100 truncate">
                                                        {label}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <Badge status={st} />
                                                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <ShieldCheck size={12} />
                                                            {providerName}
                            </span>
                                                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <MapPin size={12} />
                                                            {dcLabel}
                            </span>
                                                    </div>

                                                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <Network size={12} />
                                                            {totalIps || "—"} IPs
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircle size={12} />
                                                            {freeIps || "—"} livres
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Link2 size={12} />
                                                            {assignedIps || "—"} uso
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <IconButton title="Copiar label" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(label); }}>
                                                    <Copy size={14} className="text-slate-200" />
                                                </IconButton>
                                                <IconButton title="Detalhes (em breve)" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                    <Eye size={14} className="text-slate-200" />
                                                </IconButton>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: IPS */}
                <div className="xl:col-span-8">
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                    <Network size={16} className="text-slate-300" />
                                    IPs do servidor
                                </div>

                                <div className="text-sm text-slate-400 mt-1">
                                    {selectedServer
                                        ? (selectedServer.server_label || selectedServer.serverLabel || selectedServer.name || selectedServer.hostname)
                                        : "Selecione um servidor para ver os IPs."}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge status="free" className="border-slate-800" />
                                    <span className="text-xs text-slate-400">({ipsStats.free})</span>

                                    <Badge status="reserved" className="border-slate-800" />
                                    <span className="text-xs text-slate-400">({ipsStats.reserved})</span>

                                    <Badge status="assigned" className="border-slate-800" />
                                    <span className="text-xs text-slate-400">({ipsStats.assigned})</span>

                                    <span className="text-xs text-slate-500 ml-2">
                    total: {ipsStats.total}
                  </span>
                                </div>
                            </div>

                            <div className="w-full max-w-sm">
                                <InputWithIcon
                                    icon={<Search size={14} />}
                                    value={ipSearch}
                                    onChange={(e) => setIpSearch(e.target.value)}
                                    placeholder="Buscar IP / gateway / subnet..."
                                />
                            </div>
                        </div>

                        <div className="overflow-auto rounded-xl border border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900/60 text-slate-300">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium">IP</th>
                                    <th className="text-left px-4 py-3 font-medium">Gateway</th>
                                    <th className="text-left px-4 py-3 font-medium">Subnet</th>
                                    <th className="text-left px-4 py-3 font-medium">Status</th>
                                    <th className="text-right px-4 py-3 font-medium">Ações</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {loadingIps ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-slate-400">
                                            Carregando IPs...
                                        </td>
                                    </tr>
                                ) : !selectedServer ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-slate-400">
                                            Selecione um servidor à esquerda para listar os IPs.
                                        </td>
                                    </tr>
                                ) : ips.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-slate-400">
                                            Nenhum IP encontrado para este servidor.
                                        </td>
                                    </tr>
                                ) : (
                                    ips.map((i, idx) => {
                                        const ip = i.ip_address || i.ip || "-";
                                        const gateway = i.gateway || "-";
                                        const subnet = i.subnet || "-";
                                        const st = i.status || "free";

                                        return (
                                            <tr key={`${ip}-${idx}`} className="hover:bg-slate-900/40">
                                                <td className="px-4 py-3 text-slate-100 font-medium">{ip}</td>
                                                <td className="px-4 py-3 text-slate-300">{gateway}</td>
                                                <td className="px-4 py-3 text-slate-300">{subnet}</td>
                                                <td className="px-4 py-3">
                                                    <Badge status={st} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <IconButton title="Copiar IP" onClick={() => copyToClipboard(ip)}>
                                                            <Copy size={14} className="text-slate-200" />
                                                        </IconButton>

                                                        <IconButton title="Reservar (em breve)" onClick={() => {}} disabled={true}>
                                                            <Bookmark size={14} className="text-slate-200" />
                                                        </IconButton>

                                                        <IconButton title="Atribuir (em breve)" onClick={() => {}} disabled={true}>
                                                            <Link2 size={14} className="text-slate-200" />
                                                        </IconButton>

                                                        <IconButton title="Detalhes (em breve)" onClick={() => {}}>
                                                            <Info size={14} className="text-slate-200" />
                                                        </IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer note */}
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                            <AlertTriangle size={14} />
                            Dica: futuramente você pode vincular este servidor físico ao Host do vCenter e sincronizar IPs automaticamente.
                        </div>
                    </div>
                </div>
            </div>

            {/* Debug footer */}
            <div className="text-[11px] text-slate-600">
                <span className="mr-3">render: {now()}</span>
            </div>
        </div>
    );
}

// src/pages/InfraIps/InfraIpsPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
    Network,
    Search,
    Filter,
    RefreshCw,
    ShieldCheck,
    Ban,
    CheckCircle2,
    Clock,
    FileText,
} from "lucide-react";

import InfraIpsApi from "../../services/infraIps";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

function badge(status) {
    const base = "inline-flex items-center px-2 py-1 rounded-lg text-xs border";
    const s = String(status || "free").toLowerCase();

    if (s === "assigned") return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-300`;
    if (s === "reserved") return `${base} border-sky-500/20 bg-sky-500/10 text-sky-300`;
    if (s === "blocked") return `${base} border-rose-500/20 bg-rose-500/10 text-rose-300`;
    return `${base} border-white/10 bg-white/5 text-slate-300`;
}

function IconButton({ title, onClick, children, disabled }) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-xl",
                "border border-white/10 bg-white/5 hover:bg-white/10 transition",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );
}

export default function InfraIpsPage() {
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

    // filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [datacenter, setDatacenter] = useState("");
    const [clusterId, setClusterId] = useState("");

    const [page, setPage] = useState(1);
    const limit = 25;

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);
    const isRoot = String(user?.role || "").toLowerCase() === "root";

    async function load(p = 1) {
        setLoading(true);
        try {
            const res = await InfraIpsApi.list({
                search,
                status,
                datacenter,
                cluster_id: clusterId,
                page: p,
                limit,
            });

            setRows(Array.isArray(res?.data) ? res.data : []);
            setMeta(res?.meta || { page: p, limit, total: 0, totalPages: 1 });
        } catch (err) {
            console.error("[InfraIpsPage] load error:", err);
            setRows([]);
            setMeta({ page: 1, limit, total: 0, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            load(1);
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, datacenter, clusterId]);

    function changePage(next) {
        const p = Math.max(1, Math.min(next, meta.totalPages || 1));
        setPage(p);
        load(p);
    }

    async function quickUpdate(id, payload) {
        try {
            await InfraIpsApi.update(id, payload);
            await load(page);
        } catch (err) {
            alert(err?.response?.data?.message || "Erro ao atualizar Infra IP");
        }
    }

    return (
        <div className="relative">
            {/* Background / Gradient (padrão VmPages) */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5">
                            <Network className="text-slate-200" size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-slate-100">Infra IPs</div>
                            <div className="text-xs text-slate-500">
                                Rede privada / WireGuard / NAT — estoque e atribuição
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <IconButton title="Recarregar" onClick={() => load(page)} disabled={loading}>
                            <RefreshCw size={16} className="text-slate-200" />
                        </IconButton>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5 relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <Search size={16} />
                            </div>
                            <input
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-100"
                                placeholder="Buscar por IP, gateway, cluster, host, vlan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                            >
                                <option value="">status (all)</option>
                                <option value="free">free</option>
                                <option value="reserved">reserved</option>
                                <option value="assigned">assigned</option>
                                <option value="blocked">blocked</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <input
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                                placeholder="datacenter"
                                value={datacenter}
                                onChange={(e) => setDatacenter(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <input
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                                placeholder="cluster_id"
                                value={clusterId}
                                onChange={(e) => setClusterId(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-1 flex items-center justify-end text-xs text-slate-500">
                            <Filter size={14} className="mr-2" />
                            {meta.total || 0}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-100">Lista</div>
                        <div className="text-xs text-slate-500">
                            Page {meta.page} / {meta.totalPages} • {meta.total} itens
                        </div>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-400 bg-black/20">
                            <tr>
                                <th className="text-left px-4 py-2">IP</th>
                                <th className="text-left px-4 py-2">DC</th>
                                <th className="text-left px-4 py-2">Cluster</th>
                                <th className="text-left px-4 py-2">Host</th>
                                <th className="text-left px-4 py-2">VLAN</th>
                                <th className="text-left px-4 py-2">Status</th>
                                <th className="text-left px-4 py-2">VM</th>
                                <th className="text-left px-4 py-2">Notes</th>
                                <th className="text-right px-4 py-2">Ações</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-6 text-slate-400">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-6 text-slate-400">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={String(r.id)} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-mono text-slate-100">{r.ip_address}</td>
                                        <td className="px-4 py-3 text-slate-300">{r.datacenter}</td>
                                        <td className="px-4 py-3 text-slate-300">
                                            <div className="text-slate-200">{r.cluster_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{r.cluster_id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{r.host_name || "-"}</td>
                                        <td className="px-4 py-3 text-slate-300">{r.vlan || "-"}</td>
                                        <td className="px-4 py-3">
                                            <span className={badge(r.status)}>{r.status || "free"}</span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <input
                                                value={r.vm_id || ""}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setRows((prev) =>
                                                        prev.map((x) => (x.id === r.id ? { ...x, vm_id: v } : x))
                                                    );
                                                }}
                                                className="w-20 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-100"
                                                placeholder="vm_id"
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <input
                                                value={r.notes || ""}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setRows((prev) =>
                                                        prev.map((x) => (x.id === r.id ? { ...x, notes: v } : x))
                                                    );
                                                }}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-100"
                                                placeholder="notes"
                                            />
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <IconButton
                                                    title="Salvar (vm_id/notes)"
                                                    onClick={() =>
                                                        quickUpdate(r.id, {
                                                            vm_id: r.vm_id ? Number(r.vm_id) : null,
                                                            notes: r.notes || null,
                                                        })
                                                    }
                                                >
                                                    <ShieldCheck size={16} className="text-slate-200" />
                                                </IconButton>

                                                <IconButton
                                                    title="Reservar"
                                                    onClick={() => quickUpdate(r.id, { status: "reserved" })}
                                                    disabled={String(r.status).toLowerCase() === "blocked"}
                                                >
                                                    <Clock size={16} className="text-slate-200" />
                                                </IconButton>

                                                <IconButton
                                                    title="Liberar (free)"
                                                    onClick={() => quickUpdate(r.id, { status: "free", vm_id: null })}
                                                    disabled={String(r.status).toLowerCase() === "blocked"}
                                                >
                                                    <CheckCircle2 size={16} className="text-slate-200" />
                                                </IconButton>

                                                <IconButton
                                                    title={isRoot ? "Bloquear (ROOT)" : "Somente ROOT"}
                                                    onClick={() => quickUpdate(r.id, { status: "blocked" })}
                                                    disabled={!isRoot}
                                                >
                                                    <Ban size={16} className="text-slate-200" />
                                                </IconButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Total: {meta.total || 0}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                onClick={() => changePage(1)}
                                disabled={meta.page <= 1}
                            >
                                {"<<"}
                            </button>
                            <button
                                className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                onClick={() => changePage(meta.page - 1)}
                                disabled={meta.page <= 1}
                            >
                                {"<"}
                            </button>

                            <div className="text-xs text-slate-400 px-2">
                                {meta.page} / {meta.totalPages}
                            </div>

                            <button
                                className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                onClick={() => changePage(meta.page + 1)}
                                disabled={meta.page >= meta.totalPages}
                            >
                                {">"}
                            </button>
                            <button
                                className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                onClick={() => changePage(meta.totalPages)}
                                disabled={meta.page >= meta.totalPages}
                            >
                                {">>"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* footer help */}
                <div className="text-[11px] text-slate-600 flex items-center gap-2">
                    <FileText size={12} />
                    Infra IPs: estoque privado (WireGuard/NAT). Public IPs ficam no Inventory DC.
                </div>
            </div>
        </div>
    );
}

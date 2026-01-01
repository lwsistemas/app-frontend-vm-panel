// src/pages/PublicIps/PublicIpsPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Search,
    RefreshCw,
    Ban,
    CheckCircle2,
    Clock,
    ShieldCheck,
} from "lucide-react";

import PublicIpsApi from "../../services/publicIps";

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

export default function PublicIpsPage() {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

    // filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [provider, setProvider] = useState("");
    const [dc, setDc] = useState("");

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
            const res = await PublicIpsApi.list({ search, status, provider, dc, page: p, limit });
            setRows(Array.isArray(res?.data) ? res.data : []);
            setMeta(res?.meta || { page: p, limit, total: 0, totalPages: 1 });
        } catch (err) {
            console.error("[PublicIpsPage] load error:", err);
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
    }, [search, status, provider, dc]);

    function changePage(next) {
        const p = Math.max(1, Math.min(next, meta.totalPages || 1));
        setPage(p);
        load(p);
    }

    async function quickUpdate(id, payload) {
        try {
            await PublicIpsApi.update(id, payload);
            await load(page);
        } catch (err) {
            alert(err?.response?.data?.message || "Erro ao atualizar IP público");
        }
    }

    return (
        <div className="relative">
            {/* Background / Gradient */}
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
                            <Activity className="text-slate-200" size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-slate-100">Public IPs</div>
                            <div className="text-xs text-slate-500">
                                IPs públicos do Datacenter/Provider (ReliableSite etc)
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
                                placeholder="Buscar por IP, gateway, subnet, mac..."
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
                                placeholder="provider"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <input
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                                placeholder="dc"
                                value={dc}
                                onChange={(e) => setDc(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-1 flex items-center justify-end text-xs text-slate-500">
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
                                <th className="text-left px-4 py-2">Subnet</th>
                                <th className="text-left px-4 py-2">Gateway</th>
                                <th className="text-left px-4 py-2">MAC</th>
                                <th className="text-left px-4 py-2">Status</th>
                                <th className="text-left px-4 py-2">VM</th>
                                <th className="text-right px-4 py-2">Ações</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-slate-400">Carregando...</td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-slate-400">Nenhum registro encontrado.</td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={String(r.id)} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-mono text-slate-100">{r.ip_address}</td>
                                        <td className="px-4 py-3 text-slate-300 font-mono">{r.subnet || "-"}</td>
                                        <td className="px-4 py-3 text-slate-300 font-mono">{r.gateway || "-"}</td>
                                        <td className="px-4 py-3 text-slate-300 font-mono">{r.mac_address || "-"}</td>
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

                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <IconButton
                                                    title="Salvar (vm_id)"
                                                    onClick={() =>
                                                        quickUpdate(r.id, {
                                                            vm_id: r.vm_id ? Number(r.vm_id) : null,
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
                        <div className="text-xs text-slate-500">Total: {meta.total || 0}</div>

                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                    onClick={() => changePage(1)} disabled={meta.page <= 1}>
                                {"<<"}
                            </button>
                            <button className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                    onClick={() => changePage(meta.page - 1)} disabled={meta.page <= 1}>
                                {"<"}
                            </button>

                            <div className="text-xs text-slate-400 px-2">{meta.page} / {meta.totalPages}</div>

                            <button className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                    onClick={() => changePage(meta.page + 1)} disabled={meta.page >= meta.totalPages}>
                                {">"}
                            </button>
                            <button className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10"
                                    onClick={() => changePage(meta.totalPages)} disabled={meta.page >= meta.totalPages}>
                                {">>"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

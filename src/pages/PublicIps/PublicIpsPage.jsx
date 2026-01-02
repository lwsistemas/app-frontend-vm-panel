import React, {useEffect, useMemo, useState} from "react";
import {
    Activity,
    Search,
    RefreshCw,
    CheckCircle2,
    Clock,
    Filter,
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
    Copy,
    Server,
    Link2,
    X,
    AlertCircle,
} from "lucide-react";

import PublicIpsApi from "../../services/publicIps";
import SelectSearch from "../../components/SelectSearch";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

function badge(status) {
    const base = "inline-flex items-center px-2 py-1 rounded-lg text-xs border";
    const s = String(status || "free").toLowerCase();

    if (s === "assigned") return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-300`;
    if (s === "reserved") return `${base} border-sky-500/20 bg-sky-500/10 text-sky-300`;
    return `${base} border-white/10 bg-white/5 text-slate-300`;
}

function pendingBadge() {
    return "inline-flex items-center px-2 py-1 rounded-lg text-[11px] border border-amber-500/20 bg-amber-500/10 text-amber-300";
}

function IconButton({title, onClick, children, disabled}) {
    return (<button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl", "border border-white/10 bg-white/5 hover:bg-white/10 transition", disabled && "opacity-40 cursor-not-allowed")}
    >
        {children}
    </button>);
}

function Modal({open, title, onClose, children}) {
    if (!open) return null;

    return (<div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
        <div
            className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-100">{title}</div>
                <button
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    onClick={onClose}
                >
                    <X size={16} className="text-slate-200"/>
                </button>
            </div>
            <div className="p-4">{children}</div>
        </div>
    </div>);
}

/**
 * Toast simples (sem libs)
 */
function Toast({toast, onClose}) {
    if (!toast) return null;

    const isOk = toast.type === "success";
    const base = "fixed top-4 right-4 z-[2000] w-[320px] max-w-[90vw] rounded-2xl border shadow-2xl overflow-hidden";
    const theme = isOk ? "border-emerald-500/20 bg-emerald-500/10" : "border-rose-500/20 bg-rose-500/10";

    return (<div className={cn(base, theme)}>
        <div className="p-3 flex items-start gap-3">
            <div className="mt-0.5">
                {isOk ? (<CheckCircle2 size={18} className="text-emerald-300"/>) : (
                    <AlertCircle size={18} className="text-rose-300"/>)}
            </div>
            <div className="flex-1">
                <div className="text-sm font-semibold text-slate-100">{toast.title}</div>
                <div className="text-xs text-slate-300 mt-0.5">{toast.message}</div>
            </div>
            <button
                className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                onClick={onClose}
            >
                <X size={14} className="text-slate-200"/>
            </button>
        </div>
    </div>);
}

export default function PublicIpsPage() {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({page: 1, limit: 25, total: 0, totalPages: 1});

    // filtros
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [provider, setProvider] = useState("");
    const [dc, setDc] = useState("");
    const [subnet, setSubnet] = useState("");
    const [serverId, setServerId] = useState("");

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [vmIdFilter, setVmIdFilter] = useState("");
    const [mac, setMac] = useState("");
    const [externalId, setExternalId] = useState("");

    // sort
    const [sort, setSort] = useState("ip_address");
    const [order, setOrder] = useState("asc");

    const [filters, setFilters] = useState({
        statuses: ["free", "reserved", "assigned"], providers: [], dcs: [], subnets: [], servers: [],
    });

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

    // --- modal assign VM ---
    const [vmModalOpen, setVmModalOpen] = useState(false);
    const [vmModalIp, setVmModalIp] = useState(null);
    const [vmSearch, setVmSearch] = useState("");
    const [vmOptions, setVmOptions] = useState([]);
    const [vmOptionsLoading, setVmOptionsLoading] = useState(false);

    // stash selection per ip id
    // selectedVmMap[ipId] = { id, label, ... } | null
    const [selectedVmMap, setSelectedVmMap] = useState({});

    // ✅ salvando por linha (efeito “na prática”)
    const [savingId, setSavingId] = useState(null);

    // ✅ toast simples
    const [toast, setToast] = useState(null);

    function showToast(type, title, message) {
        setToast({type, title, message});
        setTimeout(() => setToast(null), 2200);
    }

    function copy(txt) {
        if (!txt) return;
        navigator.clipboard.writeText(String(txt));
        showToast("success", "Copiado", "Valor copiado para a área de transferência");
    }

    async function loadFilters() {
        try {
            const res = await PublicIpsApi.filters();
            if (res?.ok) {
                // public ips: sem blocked
                const statuses = ["free", "reserved", "assigned"];
                setFilters({...res.data, statuses});
            }
        } catch (err) {
            console.warn("[PublicIpsPage] loadFilters warning:", err);
        }
    }

    async function load(p = 1) {
        setLoading(true);
        try {
            const res = await PublicIpsApi.list({
                search, status, provider, dc, subnet, host_server_id: serverId || undefined,

                vm_id: vmIdFilter || undefined, mac: mac || undefined, external_id: externalId || undefined,

                sort, order, page: p, limit,
            });

            setRows(Array.isArray(res?.data) ? res.data : []);
            setMeta(res?.meta || {page: p, limit, total: 0, totalPages: 1});
        } catch (err) {
            console.error("[PublicIpsPage] load error:", err);
            setRows([]);
            setMeta({page: 1, limit, total: 0, totalPages: 1});
        } finally {
            setLoading(false);
        }
    }

    function reloadFirstPage() {
        setPage(1);
        load(1);
    }

    function clearAllFilters() {
        setSearch("");
        setStatus("");
        setProvider("");
        setDc("");
        setSubnet("");
        setServerId("");
        setVmIdFilter("");
        setMac("");
        setExternalId("");
        setSort("ip_address");
        setOrder("asc");
        setShowAdvanced(false);
        setSelectedVmMap({});
        setPage(1);
        load(1);
    }

    useEffect(() => {
        loadFilters();
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // debounce filtros
    useEffect(() => {
        const t = setTimeout(() => reloadFirstPage(), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, provider, dc, subnet, serverId, vmIdFilter, mac, externalId, sort, order,]);

    function changePage(next) {
        const p = Math.max(1, Math.min(next, meta.totalPages || 1));
        setPage(p);
        load(p);
    }

    async function quickUpdate(id, payload) {
        try {
            await PublicIpsApi.update(id, payload);
            await load(page);
            showToast("success", "OK", "Atualização aplicada com sucesso");
        } catch (err) {
            const msg = err?.response?.data?.message || "Erro ao atualizar IP público";
            showToast("error", "Erro", msg);
        }
    }

    // ---- VM MODAL ----
    function openVmModal(ipRow) {
        // regra: reserved não recebe VM (fluxo operacional)
        if (String(ipRow?.status || "").toLowerCase() === "reserved") {
            showToast("error", "Bloqueado", "IP reservado não pode receber VM. Libere antes.");
            return;
        }

        setVmModalIp(ipRow);
        setVmSearch("");
        setVmOptions([]);
        setVmModalOpen(true);
    }

    async function fetchVmOptions(q = "") {
        setVmOptionsLoading(true);
        try {
            const res = await PublicIpsApi.vmOptions({search: q, page: 1, limit: 25});
            if (res?.ok) setVmOptions(res.data || []); else setVmOptions([]);
        } catch (err) {
            console.warn("[PublicIpsPage] vmOptions error:", err);
            setVmOptions([]);
        } finally {
            setVmOptionsLoading(false);
        }
    }

    useEffect(() => {
        if (!vmModalOpen) return;
        const t = setTimeout(() => fetchVmOptions(vmSearch), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vmSearch, vmModalOpen]);

    function setSelectedVm(ipId, vm) {
        setSelectedVmMap((prev) => ({
            ...prev, [String(ipId)]: vm ? {...vm} : null,
        }));
    }

    function clearSelectedVm(ipId) {
        setSelectedVmMap((prev) => {
            const next = {...prev};
            delete next[String(ipId)];
            return next;
        });
    }

    function getSelectedVm(ipId) {
        return Object.prototype.hasOwnProperty.call(selectedVmMap, String(ipId)) ? selectedVmMap[String(ipId)] : undefined; // undefined = nunca mexeu
    }

    // ✅ Dirty state real (efeito prático: badge pendente + botão salvar habilita)
    function isDirtyVm(ipRow) {
        const sel = getSelectedVm(ipRow.id);
        if (sel === undefined) return false;

        const currentVmId = ipRow.vm_id ? Number(ipRow.vm_id) : null;

        if (sel === null) {
            return currentVmId !== null || String(ipRow.status || "").toLowerCase() !== "free";
        }

        const selId = sel?.id ? Number(sel.id) : null;
        return selId !== currentVmId;
    }

    async function saveVmAssign(ipRow) {
        // regra: reserved não recebe VM
        if (String(ipRow?.status || "").toLowerCase() === "reserved") {
            showToast("error", "Bloqueado", "IP reservado não pode receber VM. Libere primeiro.");
            return;
        }

        const sel = getSelectedVm(ipRow.id);

        // não mexeu? não salva
        if (sel === undefined) return;

        const dirty = isDirtyVm(ipRow);
        if (!dirty) return;

        setSavingId(ipRow.id);

        try {
            // liberar
            if (sel === null) {
                const ok = confirm(`Remover VM do IP ${ipRow.ip_address} e marcar FREE?`);
                if (!ok) return;

                await PublicIpsApi.update(ipRow.id, {vm_id: null, status: "free"});
                clearSelectedVm(ipRow.id);
                await load(page);
                showToast("success", "OK", "IP liberado com sucesso");
                return;
            }

            // associar
            await PublicIpsApi.update(ipRow.id, {vm_id: Number(sel.id), status: "assigned"});
            clearSelectedVm(ipRow.id);
            await load(page);
            showToast("success", "OK", "VM atribuída ao IP com sucesso");
        } catch (err) {
            const msg = err?.response?.data?.message || "Erro ao salvar atribuição";
            showToast("error", "Erro", msg);
        } finally {
            setSavingId(null);
        }
    }

    return (<div className="relative">
        {/* Toast */}
        <Toast toast={toast} onClose={() => setToast(null)}/>

        {/* BG */}
        <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b bg-slate-900 border border-slate-800"/>
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]"/>
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]"/>
        </div>

        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5">
                        <Activity className="text-slate-200" size={18}/>
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-slate-100">Public IPs</div>
                        <div className="text-xs text-slate-500">
                            IP público: free/reserved/assigned • VM via SELECT • server_id confiável
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <IconButton title="Recarregar" onClick={() => load(page)} disabled={loading}>
                        <RefreshCw size={16} className={cn("text-slate-200", loading && "animate-spin")}/>
                    </IconButton>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl p-4 border border-white/10 bg-white/5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Search size={16}/>
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por IP, gateway, subnet, mac..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-100"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                        >
                            <option value="">status (all)</option>
                            {filters.statuses.map((s) => (<option key={s} value={s}>
                                {s}
                            </option>))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <SelectSearch
                            items={filters.providers}
                            value={provider}
                            onChange={(v) => setProvider(v)}
                            placeholder="provider"
                            getLabel={(x) => x}
                            getValue={(x) => x}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <SelectSearch
                            items={filters.dcs}
                            value={dc}
                            onChange={(v) => setDc(v)}
                            placeholder="dc (server)"
                            getLabel={(x) => x}
                            getValue={(x) => x}
                        />
                    </div>

                    <button
                        type="button"
                        className={cn("md:col-span-2 flex items-center justify-center gap-2 rounded-xl", "border border-white/10 bg-white/5 hover:bg-white/10 transition", "text-xs text-slate-300")}
                        onClick={() => setShowAdvanced((v) => !v)}
                    >
                        <Filter size={14}/>
                        Avançado
                        {showAdvanced ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                        <SelectSearch
                            items={filters.subnets}
                            value={subnet}
                            onChange={(v) => setSubnet(v)}
                            placeholder="subnet"
                            getLabel={(x) => x}
                            getValue={(x) => x}
                        />
                    </div>

                    <div className="md:col-span-8">
                        <SelectSearch
                            items={filters.servers || []}
                            value={serverId}
                            onChange={(v) => setServerId(v)}
                            placeholder="Servidor físico (server_id)"
                            getValue={(x) => String(x.id)}
                            getLabel={(x) => `${x.label} • id:${x.id} • ${x.dc || "-"} • ${x.status || ""}`}
                        />
                    </div>
                </div>

                {showAdvanced ? (<div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    <div className="md:col-span-2">
                        <input
                            value={vmIdFilter}
                            onChange={(e) => setVmIdFilter(e.target.value)}
                            placeholder="vm_id (filtro)"
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <input
                            value={mac}
                            onChange={(e) => setMac(e.target.value)}
                            placeholder="mac (exato)"
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <input
                            value={externalId}
                            onChange={(e) => setExternalId(e.target.value)}
                            placeholder="external_id (exato)"
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                        >
                            <option value="ip_address">sort: ip_address</option>
                            <option value="status">sort: status</option>
                            <option value="updated_at">sort: updated_at</option>
                            <option value="last_sync_at">sort: last_sync_at</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <select
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                        >
                            <option value="asc">order: asc</option>
                            <option value="desc">order: desc</option>
                        </select>
                    </div>
                </div>) : null}

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={12}/>
                        Operador seleciona (provider/dc/subnet/server/vm)
                    </div>
                    <div>
                        {meta.total || 0} itens • page {meta.page}/{meta.totalPages}
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
                        <thead className="text-xs text-slate-400 bg-blue-950/20">
                        <tr>
                            <th className="text-left px-4 py-2">IP</th>
                            <th className="text-left px-4 py-2">Subnet/GW</th>
                            <th className="text-left px-4 py-2">Status</th>
                            <th className="text-left px-4 py-2">Servidor</th>
                            <th className="text-left px-4 py-2">VM (select)</th>
                            <th className="text-right px-4 py-2">Ações</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                        {loading ? (<tr>
                            <td colSpan={6} className="px-4 py-6 text-slate-400">
                                Carregando...
                            </td>
                        </tr>) : rows.length === 0 ? (<tr>
                            <td colSpan={6} className="px-4 py-6 text-slate-300">
                                <div className="flex flex-col gap-2">
                                    <div className="text-sm font-semibold text-slate-100">
                                        Nenhum IP encontrado
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Nenhum registro com os filtros atuais.
                                        Tente ajustar os filtros ou limpar tudo.
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200"
                                            onClick={() => clearAllFilters()}
                                        >
                                            Limpar filtros
                                        </button>
                                        <button
                                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200"
                                            onClick={() => load(1)}
                                        >
                                            Tentar novamente
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>) : (rows.map((r) => {
                            const sel = getSelectedVm(r.id);
                            const reserved = String(r.status || "").toLowerCase() === "reserved";
                            const dirty = isDirtyVm(r);

                            return (<tr key={String(r.id)} className="border border-white/5 bg-gradient-to-r from-white/[0.02] via-white/[0.01] to-transparent hover:from-white/[0.04] hover:via-white/[0.02] transition"
                            >
                                {/* IP */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-100">{r.ip_address}</span>
                                        <IconButton title="Copiar IP" onClick={() => copy(r.ip_address)}>
                                            <Copy size={14} className="text-slate-200"/>
                                        </IconButton>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">
                                        mac: {r.mac_address || "-"}
                                    </div>
                                </td>

                                {/* subnet/gw */}
                                <td className="px-4 py-3 text-slate-300">
                                    <div className="font-mono">{r.subnet || "-"}</div>
                                    <div className="text-xs text-slate-500 font-mono">
                                        gw: {r.gateway || "-"}
                                    </div>
                                </td>

                                {/* status */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={badge(r.status)}>{r.status || "free"}</span>
                                        {dirty ? <span className={pendingBadge()}>Pendente</span> : null}
                                    </div>
                                </td>

                                {/* server */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Server size={14} className="text-slate-400"/>
                                        <div>
                                            <div className="text-slate-200 font-semibold">
                                                {r.server?.label || "-"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                id: {r.host_server_id || r.server?.id || "-"} • {r.server?.dc || ""}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* VM select */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-2 min-w-[220px]">
                                        <div className="text-xs text-slate-400">
                                            Atual:{" "}
                                            <span className="text-slate-200">
                                                                {r.vm_id ? `#${r.vm_id}` : "-"}
                                                            </span>
                                        </div>

                                        <button
                                            className={cn("w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2 text-xs text-slate-200", reserved && "opacity-40 cursor-not-allowed", dirty && "border-amber-500/20")}
                                            onClick={() => openVmModal(r)}
                                            disabled={reserved}
                                            title={reserved ? "Reservado não pode atribuir VM" : "Selecionar VM"}
                                        >
                                                            <span className="truncate">
                                                                {sel && sel !== null ? sel.label : "Selecionar VM"}
                                                            </span>
                                            <Link2 size={14} className="text-slate-400"/>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                className={cn("px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200", (!dirty || reserved || savingId === r.id) && "opacity-40 cursor-not-allowed")}
                                                disabled={!dirty || reserved || savingId === r.id}
                                                onClick={() => saveVmAssign(r)}
                                                title={!dirty ? "Sem alterações" : reserved ? "Reservado não pode salvar VM" : "Salvar alteração"}
                                            >
                                                {savingId === r.id ? "Salvando..." : "Salvar"}
                                            </button>

                                            <button
                                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200"
                                                onClick={() => clearSelectedVm(r.id)}
                                                disabled={sel === undefined || savingId === r.id}
                                                title="Cancelar seleção (não salva)"
                                            >
                                                Cancelar seleção
                                            </button>

                                            <button
                                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200"
                                                onClick={() => setSelectedVm(r.id, null)}
                                                disabled={savingId === r.id}
                                                title="Marcar para liberar (free) e depois salvar"
                                            >
                                                Marcar FREE
                                            </button>
                                        </div>
                                    </div>
                                </td>

                                {/* actions */}
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <IconButton
                                            title="Reservar"
                                            onClick={() => quickUpdate(r.id, {status: "reserved"})}
                                            disabled={String(r.status || "").toLowerCase() === "reserved" || savingId === r.id}
                                        >
                                            <Clock size={16} className="text-slate-200"/>
                                        </IconButton>

                                        <IconButton
                                            title="Liberar (free)"
                                            onClick={() => quickUpdate(r.id, {status: "free", vm_id: null})}
                                            disabled={savingId === r.id}
                                        >
                                            <CheckCircle2 size={16} className="text-slate-200"/>
                                        </IconButton>
                                    </div>
                                </td>
                            </tr>);
                        }))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Total: {meta.total || 0}</div>

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
        </div>

        {/* MODAL: Select VM */}
        <Modal
            open={vmModalOpen}
            title={`Selecionar VM para IP ${vmModalIp?.ip_address || ""}`}
            onClose={() => setVmModalOpen(false)}
        >
            <div className="space-y-3">
                <div className="text-xs text-slate-500">
                    Busque pelo nome/hostname/provider_vm_id e selecione. Depois clique em <b>Salvar</b> na linha do
                    IP.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Search size={16}/>
                        </div>
                        <input
                            value={vmSearch}
                            onChange={(e) => setVmSearch(e.target.value)}
                            placeholder="Buscar VM..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-100"
                        />
                    </div>

                    <div className="md:col-span-6">
                        <SelectSearch
                            items={vmOptions}
                            value={getSelectedVm(vmModalIp?.id)?.id || ""}
                            onChange={(v, item) => {
                                if (!vmModalIp) return;
                                setSelectedVm(vmModalIp.id, item || null);
                            }}
                            placeholder={vmOptionsLoading ? "Carregando..." : "Selecionar VM"}
                            getValue={(x) => String(x.id)}
                            getLabel={(x) => x.label || `#${x.id} • ${x.name}`}
                            menuPosition="relative"
                        />
                    </div>
                </div>

                <div className="text-xs text-slate-500">
                    {vmOptionsLoading ? "Buscando VMs..." : `${vmOptions.length} opções`}
                </div>
            </div>
        </Modal>
    </div>);
}

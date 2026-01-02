// src/components/VmSelectModal.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, CheckCircle2, AlertCircle } from "lucide-react";
import SelectSearch from "./SelectSearch";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

function Modal({ open, title, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-100">{title}</div>
                    <button
                        className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                        onClick={onClose}ssss
                    >
                        <X size={16} className="text-slate-200" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

function statusPill(st) {
    const s = String(st || "").toUpperCase();
    const base = "inline-flex items-center px-2 py-1 rounded-lg text-[11px] border";
    if (s === "POWERED_ON" || s === "ON")
        return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-300`;
    if (s === "POWERED_OFF" || s === "OFF")
        return `${base} border-rose-500/20 bg-rose-500/10 text-rose-300`;
    return `${base} border-white/10 bg-white/5 text-slate-300`;
}

/**
 * VmSelectModal
 * - open
 * - title
 * - api: ({search,page,limit}) => Promise<{ ok, data }>
 * - selected
 * - onSelect(item|null)
 * - onClose
 */
export default function VmSelectModal({
                                          open,
                                          title,
                                          api, // função: ({search,page,limit}) => Promise<{ ok, data }>
                                          selected,
                                          onSelect,
                                          onClose,
                                      }) {
    const [vmSearch, setVmSearch] = useState("");
    const [vmOptions, setVmOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const cacheRef = useRef(new Map()); // cache por termo
    const inputRef = useRef(null);

    async function fetchVmOptions(q = "") {
        const key = String(q || "").trim().toLowerCase();

        // cache
        if (cacheRef.current.has(key)) {
            setVmOptions(cacheRef.current.get(key));
            return;
        }

        setLoading(true);
        try {
            const res = await api({ search: q, page: 1, limit: 25 });
            const list = res?.ok ? res.data || [] : [];
            setVmOptions(list);
            cacheRef.current.set(key, list);
        } catch (err) {
            console.warn("[VmSelectModal] vmOptions error:", err);
            setVmOptions([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!open) return;
        setVmSearch("");
        setVmOptions([]);
        fetchVmOptions("");

        // focus
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => fetchVmOptions(vmSearch), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vmSearch, open]);

    const selectedId = useMemo(() => {
        return selected?.id ? String(selected.id) : "";
    }, [selected]);

    function renderVmItem(vm, ctx) {
        const label = vm.label || `#${vm.id} • ${vm.hostname || vm.name || "vm"}`;
        const ownerLabel =
            vm?.owner?.name
                ? `${vm.owner.name}${vm.owner.email ? ` • ${vm.owner.email}` : ""}`
                : vm?.owner_id
                    ? `owner_id=${vm.owner_id}`
                    : "";

        return (
            <div className={cn("flex items-start justify-between gap-3", ctx.selected && "opacity-95")}>
                <div className="min-w-0">
                    <div className="text-xs text-slate-100 truncate">{label}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                        {ownerLabel || "—"}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                        vm_id: #{vm.id} • provider_vm_id: {vm.provider_vm_id || vm.provider_vm_name || "—"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={statusPill(vm.status)}>{String(vm.status || "—")}</span>
                    {ctx.selected ? <CheckCircle2 size={14} className="text-sky-300" /> : null}
                </div>
            </div>
        );
    }

    return (
        <Modal open={open} title={title} onClose={onClose}>
            <div className="space-y-3">
                <div className="text-xs text-slate-500">
                    Busque por <b>hostname</b>, <b>nome</b>, <b>provider_vm_id</b>, ou dados do <b>owner</b> (email/CPF/login) e selecione.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Search size={16} />
                        </div>
                        <input
                            ref={inputRef}
                            value={vmSearch}
                            onChange={(e) => setVmSearch(e.target.value)}
                            placeholder="Buscar VM..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-100"
                            onKeyDown={(e) => {
                                if (e.key === "Escape") onClose?.();
                                if (e.key === "Enter") fetchVmOptions(vmSearch);
                            }}
                        />
                    </div>

                    <div className="md:col-span-7">
                        <SelectSearch
                            items={vmOptions}
                            value={selectedId}
                            onChange={(v, item) => onSelect(item || null)}
                            placeholder={loading ? "Carregando..." : "Selecionar VM"}
                            getValue={(x) => String(x.id)}
                            getLabel={(x) => x.label || `#${x.id} • ${x.hostname || x.name}`}
                            getSubLabel={(x) =>
                                x?.owner?.name
                                    ? `${x.owner.name}${x.owner.email ? ` • ${x.owner.email}` : ""}`
                                    : x?.owner_id
                                        ? `owner_id=${x.owner_id}`
                                        : ""
                            }
                            renderItem={(vm, ctx) => renderVmItem(vm, ctx)}
                            menuPosition="relative"
                            maxHeight={320}
                        />
                    </div>
                </div>
aa
                <div className={cn("text-xs flex items-center justify-between", loading ? "text-slate-400" : "text-slate-500")}>
                    <div className="flex items-center gap-2">
                        {loading ? (
                            <>
                                <div className="w-4 h-4 rounded-full border border-white/10 border-t-sky-400 animate-spin" />
                                Buscando VMs...
                            </>
                        ) : (
                            <>
                                {vmOptions.length === 0 ? (
                                    <>
                                        <AlertCircle size={14} className="text-slate-400" />
                                        Nenhuma VM encontrada
                                    </>
                                ) : (
                                    `${vmOptions.length} opções`
                                )}
                            </>
                        )}
                    </div>

                    <div className="text-[11px] text-slate-600">Enter busca • Esc fecha • ↑↓ navega</div>
                </div>
            </div>
        </Modal>
    );
}

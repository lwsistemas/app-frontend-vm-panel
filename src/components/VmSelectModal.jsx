// src/components/VmSelectModal.jsx

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import SelectSearch from "./SelectSearch";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

function Modal({ open, title, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-100">{title}</div>
                    <button
                        className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                        onClick={onClose}
                    >
                        <X size={16} className="text-slate-200" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

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

    async function fetchVmOptions(q = "") {
        setLoading(true);
        try {
            const res = await api({ search: q, page: 1, limit: 25 });
            if (res?.ok) setVmOptions(res.data || []);
            else setVmOptions([]);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => fetchVmOptions(vmSearch), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vmSearch, open]);

    return (
        <Modal open={open} title={title} onClose={onClose}>
            <div className="space-y-3">
                <div className="text-xs text-slate-500">
                    Busque por <b>hostname</b>, <b>nome</b>, <b>provider_vm_id</b>, ou dados do <b>owner</b> (email/CPF/login) e selecione.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Search size={16} />
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
                            value={selected?.id || ""}
                            onChange={(v, item) => onSelect(item || null)}
                            placeholder={loading ? "Carregando..." : "Selecionar VM"}
                            getValue={(x) => String(x.id)}
                            getLabel={(x) => x.label || `#${x.id} • ${x.hostname || x.name}`}
                            menuPosition="relative"
                        />
                    </div>
                </div>

                <div className={cn("text-xs", loading ? "text-slate-400" : "text-slate-500")}>
                    {loading ? "Buscando VMs..." : `${vmOptions.length} opções`}
                </div>
            </div>
        </Modal>
    );
}

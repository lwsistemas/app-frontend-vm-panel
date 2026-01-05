// src/pages/Invoices/components/InvoiceItemModal.jsx
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function toNumber(val) {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
}

export default function InvoiceItemModal({
                                             open,
                                             mode = "create", // "create" | "edit"
                                             initial = null,
                                             currency = "USD",
                                             onClose,
                                             onSubmit,
                                         }) {
    const [type, setType] = useState("");
    const [refId, setRefId] = useState("");
    const [description, setDescription] = useState("");
    const [qty, setQty] = useState("1");
    const [unitPrice, setUnitPrice] = useState("0");
    const [metaJson, setMetaJson] = useState("");

    const title = mode === "edit" ? "Editar Item" : "Adicionar Item";

    useEffect(() => {
        if (!open) return;

        const it = initial || {};
        setType(it.type || "");
        setRefId(it.ref_id !== null && it.ref_id !== undefined ? String(it.ref_id) : "");
        setDescription(it.description || "");
        setQty(it.qty !== null && it.qty !== undefined ? String(it.qty) : "1");
        setUnitPrice(it.unit_price !== null && it.unit_price !== undefined ? String(it.unit_price) : "0");

        if (it.meta && typeof it.meta === "object") {
            try {
                setMetaJson(JSON.stringify(it.meta, null, 2));
            } catch {
                setMetaJson("");
            }
        } else {
            setMetaJson("");
        }
    }, [open, initial]);

    const computedTotal = useMemo(() => {
        const q = toNumber(qty) ?? 0;
        const u = toNumber(unitPrice) ?? 0;
        return (q * u).toFixed(2);
    }, [qty, unitPrice]);

    if (!open) return null;

    function safeParseMeta() {
        const raw = String(metaJson || "").trim();
        if (!raw) return undefined;
        try {
            return JSON.parse(raw);
        } catch {
            return "__INVALID__";
        }
    }

    async function submit(e) {
        e.preventDefault();

        const q = toNumber(qty);
        const u = toNumber(unitPrice);

        if (!description.trim()) {
            return alert("Descrição é obrigatória.");
        }
        if (q === null || q <= 0) {
            return alert("Qty inválido.");
        }
        if (u === null || u < 0) {
            return alert("Unit price inválido.");
        }

        const meta = safeParseMeta();
        if (meta === "__INVALID__") {
            return alert("Meta precisa ser JSON válido.");
        }

        const payload = {
            type: type ? String(type).trim() : undefined,
            ref_id: refId ? Number(refId) : undefined,
            description: String(description).trim(),
            qty: q,
            unit_price: u,
            meta: meta,
        };

        await onSubmit(payload);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-100">{title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Total estimado: <span className="text-slate-200 font-semibold">{computedTotal}</span>{" "}
                            <span className="text-slate-400">{currency}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                        title="Fechar"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Type (opcional)">
                            <input
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="vm | addon | service..."
                            />
                        </Field>

                        <Field label="ref_id (opcional)">
                            <input
                                value={refId}
                                onChange={(e) => setRefId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="ex: 150"
                            />
                        </Field>

                        <Field label="Descrição (obrigatório)" className="md:col-span-2">
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="VM Basic / Setup fee / etc..."
                            />
                        </Field>

                        <Field label="Qty (obrigatório)">
                            <input
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="1"
                            />
                        </Field>

                        <Field label="Unit price (obrigatório)">
                            <input
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="99.90"
                            />
                        </Field>

                        <Field label="Meta JSON (opcional)" className="md:col-span-2">
                            <textarea
                                value={metaJson}
                                onChange={(e) => setMetaJson(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm font-mono"
                                placeholder='{"foo":"bar"}'
                            />
                        </Field>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={cls(
                                "px-4 py-2 rounded-xl border text-sm font-semibold",
                                "border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-emerald-200"
                            )}
                        >
                            Salvar Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children, className }) {
    return (
        <div className={cls("space-y-1.5", className)}>
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
            {children}
        </div>
    );
}

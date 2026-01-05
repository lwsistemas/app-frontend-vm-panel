// src/pages/Finance/Plans/components/PlanModal.jsx
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function toNumber(val) {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
}

export default function PlanModal({
                                      open,
                                      mode = "create", // create | edit
                                      initial = null,
                                      onClose,
                                      onSubmit,
                                  }) {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState("manual");
    const [billingType, setBillingType] = useState("one_time");
    const [interval, setInterval] = useState("month");
    const [defaultPrice, setDefaultPrice] = useState("0");
    const [currency, setCurrency] = useState("USD");
    const [status, setStatus] = useState("active");
    const [description, setDescription] = useState("");

    const title = useMemo(() => (mode === "edit" ? "Editar Plano" : "Novo Plano"), [mode]);

    useEffect(() => {
        if (!open) return;

        const p = initial || {};
        setCode(p.code || "");
        setName(p.name || "");
        setType(p.type || "manual");
        setBillingType(p.billing_type || "one_time");
        setInterval(p.interval || "month");
        setDefaultPrice(p.default_price !== undefined && p.default_price !== null ? String(p.default_price) : "0");
        setCurrency(p.currency || "USD");
        setStatus(p.status || "active");
        setDescription(p.description || "");
    }, [open, initial]);

    if (!open) return null;

    async function submit(e) {
        e.preventDefault();

        if (!code.trim()) return alert("Code é obrigatório");
        if (!name.trim()) return alert("Name é obrigatório");

        const price = toNumber(defaultPrice);
        if (price === null || price < 0) return alert("Default price inválido");

        const payload = {
            code: String(code).trim(),
            name: String(name).trim(),
            type: String(type || "manual").trim(),
            billing_type: String(billingType || "one_time").trim(),
            interval: billingType === "recurring" ? String(interval || "month").trim() : null,
            default_price: price,
            currency: String(currency || "USD").trim(),
            status: String(status || "active").trim(),
            description: description ? String(description).trim() : null,
        };

        await onSubmit(payload);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-100">{title}</div>
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
                        <Field label="Code (obrigatório)">
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="VM_MONTHLY"
                                disabled={mode === "edit"} // code geralmente não muda
                            />
                        </Field>

                        <Field label="Name (obrigatório)">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="VM Monthly"
                            />
                        </Field>

                        <Field label="Type">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                            >
                                <option value="manual">manual</option>
                                <option value="vm">vm</option>
                                <option value="ip">ip</option>
                                <option value="storage">storage</option>
                                <option value="license">license</option>
                                <option value="addon">addon</option>
                            </select>
                        </Field>

                        <Field label="Billing type">
                            <select
                                value={billingType}
                                onChange={(e) => setBillingType(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                            >
                                <option value="one_time">one_time</option>
                                <option value="recurring">recurring</option>
                            </select>
                        </Field>

                        {billingType === "recurring" ? (
                            <Field label="Interval">
                                <select
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                >
                                    <option value="month">month</option>
                                    <option value="week">week</option>
                                    <option value="day">day</option>
                                </select>
                            </Field>
                        ) : (
                            <div />
                        )}

                        <Field label="Default price">
                            <input
                                value={defaultPrice}
                                onChange={(e) => setDefaultPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="99.90"
                            />
                        </Field>

                        <Field label="Currency">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                            >
                                <option value="USD">USD</option>
                                <option value="BRL">BRL</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </Field>

                        <Field label="Status">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                            >
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </Field>

                        <Field label="Description" className="md:col-span-2">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                                placeholder="Opcional..."
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
                            Salvar
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

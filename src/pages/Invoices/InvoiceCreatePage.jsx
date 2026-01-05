// src/pages/Invoices/InvoiceCreatePage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

import InvoicesApi from "../../services/invoices";
import InvoiceItemModal from "./components/InvoiceItemModal";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function toNumber(val) {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
}

export default function InvoiceCreatePage() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);

    const [number, setNumber] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [issuedAt, setIssuedAt] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");

    const [items, setItems] = useState([]);
    const [itemModalOpen, setItemModalOpen] = useState(false);

    const subtotalPreview = useMemo(() => {
        const sum = items.reduce((acc, it) => acc + (toNumber(it.qty) ?? 0) * (toNumber(it.unit_price) ?? 0), 0);
        return sum.toFixed(2);
    }, [items]);

    async function addItem(payload) {
        setItems((prev) => [
            ...prev,
            {
                ...payload,
                // preview-only id
                _tmp_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                total: ((payload.qty ?? 0) * (payload.unit_price ?? 0)).toFixed(2),
            },
        ]);
        setItemModalOpen(false);
    }

    async function removeItem(tmpId) {
        const ok = await Swal.fire({
            title: "Remover item?",
            text: "Isso remove só do rascunho (a invoice ainda não foi criada).",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remover",
            cancelButtonText: "Cancelar",
        });

        if (!ok.isConfirmed) return;
        setItems((prev) => prev.filter((x) => x._tmp_id !== tmpId));
    }

    async function submit() {
        if (!number.trim()) {
            return Swal.fire("Atenção", "Number é obrigatório.", "warning");
        }

        const payload = {
            number: String(number).trim(),
            currency: String(currency || "USD").trim(),
            issued_at: issuedAt ? new Date(issuedAt).toISOString() : undefined,
            due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
            notes: notes ? String(notes).trim() : undefined,
            items: items.map((it) => ({
                type: it.type || undefined,
                ref_id: it.ref_id ?? undefined,
                description: it.description,
                qty: it.qty,
                unit_price: it.unit_price,
                meta: it.meta || undefined,
            })),
        };

        setSaving(true);
        try {
            const res = await InvoicesApi.create(payload);
            const invoiceId = res?.invoice?.id || res?.id;
            Swal.fire("OK", "Invoice criada com sucesso", "success");
            if (invoiceId) return navigate(`/invoices/${invoiceId}`);
            return navigate("/invoices");
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao criar invoice", "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                        title="Voltar"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className="p-3 rounded-2xl border border-white/10 bg-white/5 shrink-0">
                        <FileText className="w-5 h-5 text-sky-300" />
                    </div>

                    <div className="min-w-0">
                        <div className="text-lg font-semibold text-slate-100 flex items-center gap-3 min-w-0">
                            <span className="truncate">Nova Invoice</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            Subtotal preview:{" "}
                            <span className="text-slate-200 font-semibold">{subtotalPreview}</span>{" "}
                            <span className="text-slate-400">{currency}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setItemModalOpen(true)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                    >
                        <span className="flex items-center gap-2">
                            <Plus size={16} />
                            Add Item
                        </span>
                    </button>

                    <button
                        onClick={submit}
                        disabled={saving}
                        className={cls(
                            "px-4 py-2 rounded-xl border text-sm font-semibold",
                            saving
                                ? "border-white/10 bg-white/5 text-slate-500 opacity-60 cursor-not-allowed"
                                : "border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-emerald-200"
                        )}
                    >
                        {saving ? "Salvando..." : "Criar Invoice"}
                    </button>
                </div>
            </div>

            <Card title="Dados da Invoice">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Number (obrigatório)">
                        <input
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                            placeholder="INV-2026-00001"
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

                    <Field label="Issued at">
                        <input
                            type="date"
                            value={issuedAt}
                            onChange={(e) => setIssuedAt(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                        />
                    </Field>

                    <Field label="Due at">
                        <input
                            type="date"
                            value={dueAt}
                            onChange={(e) => setDueAt(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                        />
                    </Field>

                    <Field label="Notes" className="md:col-span-2">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                            placeholder="Observações / termos / etc..."
                        />
                    </Field>
                </div>
            </Card>

            <Card title={`Items (${items.length})`} subtitle="Itens que serão enviados junto no create">
                {items.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-slate-400">
                        Nenhum item adicionado. Você pode criar a invoice vazia e adicionar itens depois.
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-black/20">
                            <tr className="text-left text-xs text-slate-400">
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">ref_id</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Unit</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((it) => (
                                <tr key={it._tmp_id} className="border-t border-white/5">
                                    <td className="px-4 py-3 text-slate-300">{it.type || "—"}</td>
                                    <td className="px-4 py-3 text-slate-300">{it.ref_id ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-200">{it.description}</td>
                                    <td className="px-4 py-3 text-slate-300">{it.qty}</td>
                                    <td className="px-4 py-3 text-slate-300">{it.unit_price}</td>
                                    <td className="px-4 py-3 text-slate-200 font-semibold">
                                        {it.total} {currency}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => removeItem(it._tmp_id)}
                                            className="px-3 py-2 rounded-xl border border-rose-700/40 bg-rose-900/10 hover:bg-rose-900/15 text-xs font-semibold text-rose-200"
                                            title="Remover"
                                        >
                                                <span className="inline-flex items-center gap-2">
                                                    <Trash2 size={14} />
                                                    Remover
                                                </span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <InvoiceItemModal
                open={itemModalOpen}
                mode="create"
                currency={currency}
                onClose={() => setItemModalOpen(false)}
                onSubmit={addItem}
            />
        </div>
    );
}

function Card({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
            <div className="mb-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
                {subtitle ? <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div> : null}
            </div>
            {children}
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

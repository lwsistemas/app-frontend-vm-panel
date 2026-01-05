// src/pages/Invoices/components/InvoiceAddPaymentModal.jsx
import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import InvoicesApi from "../../../services/invoices.jsx";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function toLocalDatetimeInputValue(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function InvoiceAddPaymentModal({
                                                   open,
                                                   invoiceId,
                                                   currency = "USD",
                                                   onClose,
                                                   onSaved,
                                               }) {
    const [saving, setSaving] = useState(false);

    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("manual");
    const [gateway, setGateway] = useState("");
    const [txid, setTxid] = useState("");
    const [paidAt, setPaidAt] = useState(toLocalDatetimeInputValue());

    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        setAmount("");
        setMethod("manual");
        setGateway("");
        setTxid("");
        setPaidAt(toLocalDatetimeInputValue());
        setError(null);
        setSaving(false);
    }, [open]);

    const amountNumber = useMemo(() => {
        const n = Number(amount);
        return Number.isFinite(n) ? n : 0;
    }, [amount]);

    async function handleSave() {
        setError(null);

        if (!invoiceId) {
            setError("Invoice inválida.");
            return;
        }

        if (!amountNumber || amountNumber <= 0) {
            setError("Informe um valor maior que zero.");
            return;
        }

        try {
            setSaving(true);

            // Swagger aceita:
            // amount (required)
            // method, gateway, currency, txid, raw, paid_at, status...
            const payload = {
                amount: amountNumber,
                method,
                currency,
                gateway: gateway || undefined,
                txid: txid || undefined,
                paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
                status: "confirmed", // ou "pending" se quiser permitir
            };

            await InvoicesApi.addPayment(invoiceId, payload); // ✅ corrigido

            onSaved?.();
            onClose?.();
        } catch (e) {
            console.error(e);
            setError("Erro ao registrar pagamento.");
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={saving ? undefined : onClose}
            />

            {/* modal */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 shadow-xl">
                    <div className="p-4 border-b border-white/10 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-white">Registrar Pagamento</div>
                            <div className="text-xs text-slate-400 mt-1">
                                Pagamento parcial permitido. Isso gera um registro em <code>/payments</code>.
                            </div>
                        </div>

                        <button
                            onClick={saving ? undefined : onClose}
                            className={cls(
                                "p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10",
                                saving ? "opacity-50 cursor-not-allowed" : ""
                            )}
                            title="Fechar"
                        >
                            <X size={18} className="text-slate-200" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {error ? (
                            <div className="px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-200">
                                {error}
                            </div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Valor</label>
                                <input
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="ex: 50"
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20"
                                    disabled={saving}
                                />
                                <div className="text-[11px] text-slate-500">Moeda: {currency}</div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Método</label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20"
                                    disabled={saving}
                                >
                                    <option value="manual">Manual</option>
                                    <option value="pix">PIX</option>
                                    <option value="credit_card">Cartão</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="bank_transfer">Transferência</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Gateway (opcional)</label>
                                <input
                                    value={gateway}
                                    onChange={(e) => setGateway(e.target.value)}
                                    placeholder="ex: stripe, asaas..."
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20"
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">TXID (opcional)</label>
                                <input
                                    value={txid}
                                    onChange={(e) => setTxid(e.target.value)}
                                    placeholder="ex: trx_123"
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20"
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs text-slate-400">Pago em</label>
                                <input
                                    type="datetime-local"
                                    value={paidAt}
                                    onChange={(e) => setPaidAt(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20"
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className={cls(
                                "px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-200",
                                saving ? "opacity-50 cursor-not-allowed" : ""
                            )}
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={cls(
                                "px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/15 hover:bg-emerald-500/20 text-sm text-emerald-100 flex items-center gap-2",
                                saving ? "opacity-70 cursor-not-allowed" : ""
                            )}
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                            Salvar pagamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

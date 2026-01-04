// src/pages/Invoices/components/InvoiceActions.jsx
import { useMemo, useState } from "react";
import { Loader2, CreditCard, Ban, RotateCcw } from "lucide-react";
import { setInvoiceStatus } from "../../../services/invoices.jsx";
import InvoiceAddPaymentModal from "./InvoiceAddPaymentModal.jsx";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

export default function InvoiceActions({ invoice, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [payOpen, setPayOpen] = useState(false);

    const status = useMemo(() => String(invoice?.status || "").toLowerCase(), [invoice?.status]);

    const canPay = ["pending", "overdue"].includes(status);
    const canCancel = ["draft", "pending", "overdue"].includes(status);
    const canRefund = ["paid"].includes(status);

    async function changeStatus(nextStatus) {
        if (!invoice?.id) return;

        try {
            setLoading(true);
            await setInvoiceStatus(invoice.id, nextStatus);
            await onRefresh?.();
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar status da invoice.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Pagar = registrar payment */}
            {canPay ? (
                <button
                    onClick={() => setPayOpen(true)}
                    disabled={loading}
                    className={cls(
                        "px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/15 hover:bg-emerald-500/20 text-sm text-emerald-100 flex items-center gap-2",
                        loading ? "opacity-60 cursor-not-allowed" : ""
                    )}
                    title="Registrar pagamento"
                >
                    <CreditCard size={16} />
                    Pagar
                </button>
            ) : null}

            {/* Cancelar */}
            {canCancel ? (
                <button
                    onClick={() => changeStatus("canceled")}
                    disabled={loading}
                    className={cls(
                        "px-3 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-sm text-red-100 flex items-center gap-2",
                        loading ? "opacity-60 cursor-not-allowed" : ""
                    )}
                    title="Cancelar invoice"
                >
                    <Ban size={16} />
                    Cancelar
                </button>
            ) : null}

            {/* Refund */}
            {canRefund ? (
                <button
                    onClick={() => changeStatus("refunded")}
                    disabled={loading}
                    className={cls(
                        "px-3 py-2 rounded-xl border border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/15 text-sm text-orange-100 flex items-center gap-2",
                        loading ? "opacity-60 cursor-not-allowed" : ""
                    )}
                    title="Marcar como refund"
                >
                    <RotateCcw size={16} />
                    Refund
                </button>
            ) : null}

            {/* Loading pill */}
            {loading ? (
                <span className="text-xs text-slate-400 flex items-center gap-2 ml-1">
          <Loader2 size={14} className="animate-spin" /> processando...
        </span>
            ) : null}

            {/* Modal registrar pagamento */}
            <InvoiceAddPaymentModal
                open={payOpen}
                invoiceId={invoice?.id}
                currency={invoice?.currency || "USD"}
                onClose={() => setPayOpen(false)}
                onSaved={onRefresh}
            />
        </div>
    );
}

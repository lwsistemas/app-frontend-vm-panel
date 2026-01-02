import React from "react";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import InvoicesApi from "../../services/invoices";

function IconButton({ title, onClick, disabled, children }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`w-9 h-9 rounded-xl flex items-center justify-center
        border border-white/10 bg-white/5 hover:bg-white/10 transition
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
            {children}
        </button>
    );
}

export default function InvoiceActions({ invoice, onReload }) {
    const status = String(invoice.status || "").toLowerCase();

    async function confirmPay() {
        const res = await Swal.fire({
            title: "Marcar como paga?",
            text: `Invoice ${invoice.number}`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sim, pagar",
            cancelButtonText: "Cancelar",
        });

        if (!res.isConfirmed) return;

        try {
            await InvoicesApi.pay(invoice.id);
            Swal.fire("Pago", "Invoice marcada como paga", "success");
            onReload();
        } catch (err) {
            Swal.fire("Erro", "Falha ao pagar invoice", "error");
        }
    }

    async function confirmCancel() {
        const res = await Swal.fire({
            title: "Cancelar invoice?",
            text: `Invoice ${invoice.number}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, cancelar",
            cancelButtonText: "Voltar",
        });

        if (!res.isConfirmed) return;

        try {
            await InvoicesApi.cancel(invoice.id);
            Swal.fire("Cancelada", "Invoice cancelada", "success");
            onReload();
        } catch (err) {
            Swal.fire("Erro", "Falha ao cancelar invoice", "error");
        }
    }

    return (
        <div className="inline-flex items-center gap-2">
            {/* Ver detalhes (sempre) */}
            <IconButton title="Ver detalhes" onClick={() => alert("Detalhes depois")}>
                <Eye size={16} />
            </IconButton>

            {/* Marcar como paga */}
            <IconButton
                title="Marcar como paga"
                onClick={confirmPay}
                disabled={!(status === "issued" || status === "overdue")}
            >
                <CheckCircle2 size={16} />
            </IconButton>

            {/* Cancelar */}
            <IconButton
                title="Cancelar invoice"
                onClick={confirmCancel}
                disabled={!(status === "issued" || status === "overdue")}
            >
                <XCircle size={16} />
            </IconButton>
        </div>
    );
}

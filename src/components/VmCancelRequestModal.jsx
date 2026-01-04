// src/components/VmCancelRequestModal.jsx
import { useEffect, useState } from "react";
import { X, Loader2, Ban } from "lucide-react";
import Swal from "sweetalert2";
import { createTicket } from "../services/tickets";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

export default function VmCancelRequestModal({ open, vm, onClose, onSent }) {
    const [saving, setSaving] = useState(false);
    const [reason, setReason] = useState("customer_request");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!open) return;
        setSaving(false);
        setReason("customer_request");
        setMessage("");
    }, [open]);

    async function handleSend() {
        if (!vm?.id) return;

        try {
            setSaving(true);

            const payload = {
                type: "VM_CANCEL_REQUEST",
                subject: `Cancelamento de VM: ${vm.name || vm.hostname || `#${vm.id}`}`,
                priority: "normal",
                resource_type: "vm",
                resource_id: vm.id,
                reason,
                message,
                meta: {
                    vm_id: vm.id,
                    vm_name: vm.name,
                    hostname: vm.hostname,
                    provider: vm.provider,
                    cluster: vm.cluster_name,
                    provider_vm_id: vm.provider_vm_id,
                },
            };

            await createTicket(payload);

            Swal.fire("Solicitação enviada", "O DC/NOC irá avaliar e executar o cancelamento.", "success");

            onSent?.();
            onClose?.();
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Não foi possível enviar a solicitação.", "error");
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={saving ? undefined : onClose}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 shadow-xl">
                    <div className="p-4 border-b border-white/10 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-white flex items-center gap-2">
                                <Ban size={16} className="text-orange-200" />
                                Solicitar cancelamento de VM
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                Isso não desliga automaticamente. Gera um ticket para o DC/NOC.
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
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-xs text-slate-400">VM</div>
                            <div className="text-sm text-slate-100 mt-1 font-mono">
                                {vm.name || vm.hostname || `#${vm.id}`}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Provider: <span className="text-slate-300">{vm.provider || "-"}</span>{" "}
                                · Cluster: <span className="text-slate-300">{vm.cluster_name || "-"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Motivo</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={saving}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20"
                                >
                                    <option value="customer_request">Solicitação do cliente</option>
                                    <option value="billing">Billing / inadimplência</option>
                                    <option value="security">Segurança</option>
                                    <option value="abuse">Abuse</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Prioridade</label>
                                <div className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-300 text-sm">
                                    normal
                                </div>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs text-slate-400">Descrição (opcional)</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={saving}
                                    rows={4}
                                    placeholder="Explique o motivo do cancelamento..."
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 outline-none focus:border-white/20 resize-none"
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
                            onClick={handleSend}
                            disabled={saving}
                            className={cls(
                                "px-4 py-2 rounded-xl border border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/15 text-sm text-orange-100 flex items-center gap-2",
                                saving ? "opacity-70 cursor-not-allowed" : ""
                            )}
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                            Enviar solicitação
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

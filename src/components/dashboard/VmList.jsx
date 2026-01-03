import { useMemo } from "react";
import VmRow from "./VmRow.jsx";
import { VM_UI } from "./vm.ui";

export default function VmList({ vms = [], onChange, currentUser, selected = [], setSelected }) {
    const role = currentUser?.role || "basic";

    const isOperator = role === "root" || role === "admin" || role === "support";
    const isClient = role === "client" || role === "basic";

    const vmsSafe = useMemo(() => (Array.isArray(vms) ? vms.filter(Boolean) : []), [vms]);

    const allSelected = vmsSafe.length > 0 && selected.length === vmsSafe.length;

    function toggleAll() {
        if (!isOperator && !isClient) return;
        setSelected(allSelected ? [] : vmsSafe.map((vm) => vm.id));
    }

    function toggleOne(id) {
        if (!isOperator && !isClient) return;
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    if (!vmsSafe.length) {
        return (
            <div className={`rounded-2xl border border-slate-800/70 ${VM_UI.panelBg} p-6 text-center text-slate-400`}>
                Nenhuma VM encontrada
            </div>
        );
    }

    return (
        <div className={`rounded-2xl border border-slate-800/70 ${VM_UI.panelBg} overflow-hidden`}>
            {/* Bulk Bar */}
            <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-800/70 ${VM_UI.headerStripBg}`}>
                <label className="flex items-center gap-3 select-none">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-300">
                        Selecionadas: <b className="text-white">{selected.length}</b>
                    </span>
                </label>

                <div className="text-xs text-slate-500">Total nesta lista: {vmsSafe.length}</div>
            </div>

            {/* Header da tabela */}
            <div className="hidden lg:grid grid-cols-[40px_1.6fr_0.9fr_0.9fr_0.7fr_170px] gap-3 px-4 py-2 border-b border-slate-800/70 text-xs text-slate-400">
                <div />
                <div>VM</div>
                <div>Status</div>
                <div>IP</div>
                <div>CPU/RAM</div>
                <div className="text-right">Ações</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/70">
                {vmsSafe.map((vm) => (
                    <VmRow
                        key={vm.id}
                        vm={vm}
                        selected={selected.includes(vm.id)}
                        toggle={() => toggleOne(vm.id)}
                        onChange={onChange}
                        currentUser={currentUser}
                    />
                ))}
            </div>
        </div>
    );
}

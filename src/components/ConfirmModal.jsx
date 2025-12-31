import { X } from 'lucide-react';

export default function ConfirmModal({
                                         open,
                                         title,
                                         description,
                                         confirmText = 'Confirmar',
                                         cancelText = 'Cancelar',
                                         loading = false,
                                         onConfirm,
                                         onClose,
                                     }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-xl">

                {/* HEADER */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-200">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="px-5 py-4 text-sm text-slate-400">
                    {description}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm rounded flex items-center gap-2
                            ${
                            loading
                                ? 'bg-sky-700 cursor-not-allowed'
                                : 'bg-sky-600 hover:bg-sky-500'
                        }
                        `}
                    >
                        {loading && (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

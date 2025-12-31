import { Loader2 } from "lucide-react";

export default function GlobalLoader({ visible, label = "Processando..." }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* box */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 shadow-2xl min-w-[260px]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600/10 flex items-center justify-center border border-sky-600/20">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                    </div>

                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-slate-100">
                            {label}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            Aguarde alguns segundos…
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

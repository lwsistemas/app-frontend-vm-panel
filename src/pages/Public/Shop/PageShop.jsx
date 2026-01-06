// src/pages/Public/Shop/PageShop.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Cpu, MemoryStick, HardDrive, Repeat, CalendarClock, Shield } from "lucide-react";
import Shop from "../../../services/shop";
import PublicHeader from "./components/PublicHeader";

function parseMeta(meta) {
    try {
        if (!meta) return null;
        return typeof meta === "string" ? JSON.parse(meta) : meta;
    } catch {
        return null;
    }
}

function fmtMoney(v, cur = "USD") {
    const n = Number(v || 0);
    return `${n.toFixed(2)} ${cur}`;
}

function SpecItem({ icon, value }) {
    return (
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="opacity-80">{icon}</span>
            <span className="truncate">{value}</span>
        </div>
    );
}

function BillingPill({ billing_type, interval }) {
    const recurring = String(billing_type || "").toLowerCase() === "recurring";
    const Icon = recurring ? Repeat : CalendarClock;

    return (
        <span className="shrink-0 inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-300">
      <Icon size={14} className="opacity-80" />
            {billing_type}
            {interval ? ` · ${interval}` : ""}
    </span>
    );
}

function PlanCard({ plan }) {
    const meta = useMemo(() => parseMeta(plan.meta), [plan.meta]);

    const cpu = meta?.cpu ?? null;
    const memGb = meta?.memory_mb ? Math.round(meta.memory_mb / 1024) : null;
    const diskGb = meta?.disk_gb ?? null;

    return (
        <a
            href={`/shop/plans/${plan.id}`}
            className="group rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4 hover:bg-white/5 transition"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        {plan.code}
                    </div>

                    <div className="mt-1 text-base font-semibold text-slate-100 truncate">
                        {plan.name || `Plan #${plan.id}`}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <SpecItem icon={<Cpu size={14} />} value={cpu ? `${cpu} vCPU` : "CPU —"} />
                        <SpecItem
                            icon={<MemoryStick size={14} />}
                            value={memGb ? `${memGb}GB RAM` : "RAM —"}
                        />
                        <SpecItem
                            icon={<HardDrive size={14} />}
                            value={diskGb ? `${diskGb}GB Disk` : "Disk —"}
                        />
                    </div>

                    {meta?.sla && (
                        <div className="mt-3 inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-300">
                            <Shield size={14} className="opacity-80" />
                            SLA: <span className="text-slate-200">{meta.sla}</span>
                        </div>
                    )}
                </div>

                <BillingPill billing_type={plan.billing_type} interval={plan.interval} />
            </div>

            <div className="mt-5 flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-100">
                    {fmtMoney(plan.default_price, plan.currency)}
                </div>

                <div className="px-3 py-2 rounded-xl border border-sky-700/40 bg-sky-900/10 group-hover:bg-white/5 text-sm font-semibold text-sky-200">
                    Configure
                </div>
            </div>
        </a>
    );
}

function SectionCard({ id, title, children }) {
    return (
        <section
            id={id}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5"
        >
            <div className="text-sm font-semibold text-slate-100">{title}</div>
            <div className="mt-2 text-xs text-slate-400">{children}</div>
        </section>
    );
}

export default function PageShop() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [plans, setPlans] = useState([]);
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setErr(null);

            const res = await Shop.plans.list({ limit: 50, type: "vm" });
            const list = Array.isArray(res?.data) ? res.data : [];
            setPlans(list);
        } catch (e) {
            setErr(e?.message || "Falha ao carregar planos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;
            await load();
        })();
        return () => {
            mounted = false;
        };
    }, [load]);

    const filteredPlans = useMemo(() => {
        const base = plans.filter((p) => ["vm", "dedicated"].includes(p.type));
        const q = query.trim().toLowerCase();
        if (!q) return base;

        return base.filter((p) => {
            const meta = parseMeta(p.meta);
            const hay = [
                p.code,
                p.name,
                p.type,
                p.billing_type,
                p.interval,
                p.description,
                meta?.notes,
                meta?.sla,
                meta?.cpu ? `${meta.cpu} cpu` : null,
                meta?.memory_mb ? `${meta.memory_mb} memory` : null,
                meta?.disk_gb ? `${meta.disk_gb} disk` : null,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return hay.includes(q);
        });
    }, [plans, query]);

    return (
        <div className="relative min-h-screen text-slate-200">
            {/* Background padrão painel */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            {/* Header pesado existente */}
            <PublicHeader cartCount={0} onOpenCart={() => {}} />

            <main className="max-w-6xl mx-auto p-6 space-y-5">
                {/* Header interno */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5">
                                <span className="text-slate-200 font-bold">🛒</span>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-slate-100">Shop</div>
                                <div className="text-xs text-slate-500">
                                    Plans · padrão painel · configure e finalize
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={load}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                        >
                            Atualizar
                        </button>
                    </div>

                    {/* Filters box */}
                    <div className="mt-4 rounded-2xl p-4 border border-white/10 bg-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-8 relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    ⌕
                                </div>
                                <input
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500"
                                    placeholder="Buscar por plano, cpu, ram, disk, sla..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-4">
                                <a
                                    href="#support"
                                    className="block text-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                                >
                                    Suporte
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                {loading && (
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5 text-slate-400">
                        Carregando...
                    </div>
                )}

                {err && (
                    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-b from-slate-950 to-slate-900 p-5 text-red-300">
                        {err}
                    </div>
                )}

                {!loading && !err && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredPlans.map((p) => (
                            <PlanCard key={p.id} plan={p} />
                        ))}
                    </div>
                )}

                {/* About / Support */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectionCard id="about" title="Sobre">
                        Catálogo oficial do VM Panel. Preço e validação são sempre
                        autoritativos no backend. Fluxo: selecionar plano → configurar →
                        checkout.
                    </SectionCard>

                    <SectionCard id="support" title="Suporte">
                        Precisa de ajuda? Abra ticket ou consulte a documentação. Em produção
                        o checkout exige login/registro antes de finalizar.
                    </SectionCard>
                </div>

                {/* Footer */}
                <footer className="border-t border-white/10 pt-6 text-xs text-slate-500">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>VM Panel · Shop</div>
                        <div className="flex gap-3">
                            <a href="#about" className="hover:text-slate-300">
                                Sobre
                            </a>
                            <a href="#support" className="hover:text-slate-300">
                                Suporte
                            </a>
                            <a href="/docs" className="hover:text-slate-300">
                                Docs
                            </a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

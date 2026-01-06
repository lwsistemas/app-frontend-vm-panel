// src/pages/Public/Shop/PlanDetailPage.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
    Cpu,
    MemoryStick,
    HardDrive,
    Network,
    Shield,
    Repeat,
    CalendarClock,
    ArrowLeft,
    ShoppingCart,
    SlidersHorizontal,
    Calculator,
    BadgeDollarSign,
    AlertTriangle,
    Hash,
} from "lucide-react";

import Shop from "../../../../services/shop.jsx";
import PublicHeader from "../components/PublicHeader";

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

function clamp(n, min, max) {
    const x = Number(n || 0);
    if (Number.isNaN(x)) return min;
    return Math.max(min, Math.min(max, x));
}

function isPositiveInt(x) {
    const n = Number(x);
    return Number.isInteger(n) && n > 0;
}

function debounce(fn, wait = 500) {
    let t = null;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

function Pill({ children }) {
    return (
        <span className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-300">
            {children}
        </span>
    );
}

function BillingPill({ billing_type, interval }) {
    const recurring = String(billing_type || "").toLowerCase() === "recurring";
    const Icon = recurring ? Repeat : CalendarClock;
    return (
        <Pill>
            <Icon size={14} className="opacity-80" />
            {billing_type}
            {interval ? ` · ${interval}` : ""}
        </Pill>
    );
}

function SpecItem({ icon, label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="opacity-80">{icon}</span>
                <span>{label}</span>
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-100">{value}</div>
        </div>
    );
}

function Field({ icon, label, hint, children }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="opacity-80">{icon}</span>
                        <span className="font-semibold">{label}</span>
                    </div>
                    {hint && <div className="mt-1 text-[11px] text-slate-500">{hint}</div>}
                </div>
            </div>
            <div className="mt-3">{children}</div>
        </div>
    );
}

function RangeRow({ value, setValue, min, max, step = 1, suffix = "" }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                    {min}
                    {suffix}
                </span>
                <span className="text-slate-200 font-semibold">
                    {value}
                    {suffix}
                </span>
                <span className="text-slate-400">
                    {max}
                    {suffix}
                </span>
            </div>

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-sky-500"
            />

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => setValue(clamp(e.target.value, min, max))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100"
                />
                <div className="text-xs text-slate-400 whitespace-nowrap">{suffix}</div>
            </div>
        </div>
    );
}

export default function PlanDetailPage() {
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [plan, setPlan] = useState(null);

    const [customEnabled, setCustomEnabled] = useState(false);
    const [qty, setQty] = useState(1);

    const [cpu, setCpu] = useState(1);
    const [memGb, setMemGb] = useState(2);
    const [diskGb, setDiskGb] = useState(40);

    const [calcLoading, setCalcLoading] = useState(false);
    const [calcErr, setCalcErr] = useState(null);
    const [calcResult, setCalcResult] = useState(null);

    const meta = useMemo(() => parseMeta(plan?.meta), [plan?.meta]);
    const planCurrency = plan?.currency || "USD";

    const baseDefaults = useMemo(() => {
        const baseCpu = meta?.cpu ?? 1;
        const baseMemGb = meta?.memory_mb ? Math.round(meta.memory_mb / 1024) : 2;
        const baseDisk = meta?.disk_gb ?? 40;

        return {
            baseCpu,
            baseMemGb,
            baseDisk,
            bw: meta?.bandwidth_mbps ?? null,
            sla: meta?.sla ?? null,
        };
    }, [meta]);

    const limits = useMemo(() => {
        return {
            cpu: { min: 1, max: 32, step: 1 },
            memGb: { min: 1, max: 128, step: 1 },
            diskGb: { min: 20, max: 2000, step: 10 },
            qty: { min: 1, max: 100, step: 1 },
        };
    }, []);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setErr(null);

            const res = await Shop.plans.get(id);
            const p = res?.plan || res?.data?.plan || res?.data || null;

            setPlan(p);

            const pMeta = parseMeta(p?.meta);
            const dCpu = pMeta?.cpu ?? 1;
            const dMemGb = pMeta?.memory_mb ? Math.round(pMeta.memory_mb / 1024) : 2;
            const dDisk = pMeta?.disk_gb ?? 40;

            setCpu(dCpu);
            setMemGb(dMemGb);
            setDiskGb(dDisk);

            setCustomEnabled(false);
            setQty(1);
            setCalcResult(null);
            setCalcErr(null);
        } catch (e) {
            setErr(e?.message || "Falha ao carregar plano");
        } finally {
            setLoading(false);
        }
    }, [id]);

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

    const customPayload = useMemo(() => {
        if (!plan?.id) return null;

        const payload = {
            plan_id: plan.id,
            qty: isPositiveInt(qty) ? qty : 1,
            custom: null,
        };

        if (customEnabled) {
            payload.custom = {
                cores: clamp(cpu, limits.cpu.min, limits.cpu.max),
                memory_gb: clamp(memGb, limits.memGb.min, limits.memGb.max),
                disk_gb: clamp(diskGb, limits.diskGb.min, limits.diskGb.max),
            };
        }

        return payload;
    }, [plan?.id, qty, customEnabled, cpu, memGb, diskGb, limits]);

    // ✅ abort + debounce (evita loop e race condition)
    const abortRef = useRef(null);
    const reqSeqRef = useRef(0);

    const doCalc = useCallback(async () => {
        if (!customPayload) return;

        // se custom off, não calcula
        if (!customEnabled) return;

        const mySeq = ++reqSeqRef.current;

        try {
            setCalcLoading(true);
            setCalcErr(null);

            // abort previous
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const res = await Shop.prices.calc(customPayload, {
                signal: abortRef.current.signal,
            });

            const price = res?.price || res?.data?.price || null;
            if (!price) throw new Error("Resposta inválida do cálculo");

            // só aplica o último request
            if (mySeq === reqSeqRef.current) {
                setCalcResult(price);
            }
        } catch (e) {
            // abort = ignora
            if (e?.name === "AbortError" || e?.name === "CanceledError") return;

            if (mySeq === reqSeqRef.current) {
                setCalcErr(e?.message || "Falha ao calcular preço");
                setCalcResult(null);
            }
        } finally {
            if (mySeq === reqSeqRef.current) {
                setCalcLoading(false);
            }
        }
    }, [customPayload, customEnabled]);

    const debouncedCalcRef = useRef(null);
    useEffect(() => {
        debouncedCalcRef.current = debounce(() => doCalc(), 450);
    }, [doCalc]);

    useEffect(() => {
        if (!plan?.id) return;

        if (!customEnabled) {
            setCalcResult(null);
            setCalcErr(null);
            setCalcLoading(false);
            return;
        }

        // dispara apenas após parar de mexer
        debouncedCalcRef.current?.();
    }, [plan?.id, customEnabled, cpu, memGb, diskGb, qty]);

    function buildCartItem() {
        const hasCustom = !!customEnabled;

        const unitPrice = calcResult?.unit_price ?? Number(plan.default_price || 0);
        const q = isPositiveInt(qty) ? qty : 1;

        return {
            kind: "plan",
            plan_id: plan.id,
            product_id: null,
            qty: q,

            customization: hasCustom
                ? {
                    cores: clamp(cpu, limits.cpu.min, limits.cpu.max),
                    memory_gb: clamp(memGb, limits.memGb.min, limits.memGb.max),
                    disk_gb: clamp(diskGb, limits.diskGb.min, limits.diskGb.max),
                }
                : null,

            pricing_version: calcResult?.pricing_version || null,
            unit_price: unitPrice,
            total_price: calcResult?.total_price ?? unitPrice * q, // ✅ usa total do backend quando existir

            meta: {
                code: plan.code,
                name: plan.name,
                type: plan.type,
                billing_type: plan.billing_type,
                interval: plan.interval,
                currency: plan.currency || "USD",
                custom: hasCustom ? { cpu, memGb, diskGb } : null,
            },
        };
    }

    function addToCart() {
        if (!plan?.id) return;

        if (customEnabled && calcResult?.unit_price == null) {
            setCalcErr("Calcule o preço antes de adicionar ao carrinho.");
            return;
        }

        const item = buildCartItem();
        const key = "vm_panel_shop_cart_v1";

        const raw = localStorage.getItem(key);
        const cart = raw ? JSON.parse(raw) : { items: [] };

        cart.items = Array.isArray(cart.items) ? cart.items : [];
        cart.items.push(item);

        localStorage.setItem(key, JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent("vm-panel-cart-updated"));
    }

    const title = plan?.name || `Plan #${id}`;
    const code = plan?.code || "-";
    const basePrice = fmtMoney(plan?.default_price, planCurrency);

    const calcUnitText = useMemo(() => {
        if (!customEnabled) return null;
        if (calcResult?.unit_price == null) return null;
        return fmtMoney(calcResult.unit_price, planCurrency);
    }, [customEnabled, calcResult, planCurrency]);

    const calcTotalText = useMemo(() => {
        if (!customEnabled) return null;
        if (calcResult?.total_price == null) return null;
        return fmtMoney(calcResult.total_price, planCurrency);
    }, [customEnabled, calcResult, planCurrency]);

    const cpuBase = baseDefaults.baseCpu;
    const memGbBase = baseDefaults.baseMemGb;
    const diskGbBase = baseDefaults.baseDisk;

    const billing_type = plan?.billing_type;
    const interval = plan?.interval;

    return (
        <div className="relative min-h-screen text-slate-200">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            <PublicHeader cartCount={0} onOpenCart={() => {}} />

            <main className="max-w-6xl mx-auto p-6 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <a
                        href="/shop"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                    >
                        <ArrowLeft size={16} />
                        Voltar
                    </a>

                    <button
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                        onClick={addToCart}
                        disabled={customEnabled && calcResult?.unit_price == null}
                        title={customEnabled && calcResult?.unit_price == null ? "Calcule o preço antes" : ""}
                    >
                        <ShoppingCart size={16} />
                        Adicionar ao carrinho
                    </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">{code}</div>
                            <div className="mt-1 text-2xl font-bold text-slate-100">{title}</div>

                            {plan?.description && (
                                <div className="mt-2 text-sm text-slate-400 max-w-3xl">{plan.description}</div>
                            )}

                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <BillingPill billing_type={billing_type} interval={interval} />
                                {baseDefaults.sla && (
                                    <Pill>
                                        <Shield size={14} className="opacity-80" />
                                        SLA: <span className="text-slate-200">{baseDefaults.sla}</span>
                                    </Pill>
                                )}
                                <Pill>
                                    <span className="opacity-80">type:</span>
                                    <span className="text-slate-200">{plan?.type || "-"}</span>
                                </Pill>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <div className="text-xs text-slate-500">A partir de</div>
                            <div className="text-3xl font-extrabold text-slate-100">{basePrice}</div>

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <a
                                    href="#configure"
                                    className="px-4 py-2 rounded-xl border border-sky-700/40 bg-sky-900/10 hover:bg-white/5 text-sm font-semibold text-sky-200"
                                >
                                    Configure
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl p-4 border border-white/10 bg-white/5">
                        <div className="text-xs text-slate-400">
                            Configure com presets ou personalize recursos. Preço sempre calculado no backend.
                        </div>
                    </div>
                </div>

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

                {!loading && !err && plan && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <SpecItem icon={<Cpu size={16} />} label="CPU" value={`${cpuBase} vCPU`} />
                            <SpecItem icon={<MemoryStick size={16} />} label="Memória" value={`${memGbBase} GB`} />
                            <SpecItem icon={<HardDrive size={16} />} label="Disco" value={`${diskGbBase} GB`} />
                            <SpecItem icon={<Network size={16} />} label="Banda" value={baseDefaults.bw ? `${baseDefaults.bw} Mbps` : "—"} />
                            <SpecItem icon={<Shield size={16} />} label="SLA" value={baseDefaults.sla ? String(baseDefaults.sla) : "—"} />
                            <SpecItem icon={<Repeat size={16} />} label="Cobrança" value={`${billing_type}${interval ? ` / ${interval}` : ""}`} />
                        </div>

                        <div id="configure" className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={18} className="text-slate-300" />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-100">Configuração</div>
                                        <div className="text-xs text-slate-500">Custom com cálculo autoritativo (cores/memory_gb/disk_gb)</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setCustomEnabled((v) => !v);
                                            setCalcErr(null);
                                            setCalcResult(null);
                                            setCpu(cpuBase);
                                            setMemGb(memGbBase);
                                            setDiskGb(diskGbBase);
                                            setQty(1);
                                        }}
                                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                                            customEnabled
                                                ? "border-sky-700/40 bg-sky-900/10 hover:bg-white/5 text-sky-200"
                                                : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                                        }`}
                                    >
                                        {customEnabled ? "Custom: ON" : "Custom: OFF"}
                                    </button>

                                    {customEnabled && (
                                        <button
                                            onClick={doCalc}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                                            disabled={calcLoading}
                                        >
                                            <Calculator size={16} />
                                            Calcular
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
                                <div className="xl:col-span-2 space-y-4">
                                    <Field icon={<Cpu size={16} />} label="CPU" hint="cores (backend)">
                                        <RangeRow value={cpu} setValue={setCpu} min={limits.cpu.min} max={limits.cpu.max} step={limits.cpu.step} />
                                    </Field>

                                    <Field icon={<MemoryStick size={16} />} label="Memória" hint="memory_gb (backend)">
                                        <RangeRow value={memGb} setValue={setMemGb} min={limits.memGb.min} max={limits.memGb.max} step={limits.memGb.step} suffix=" GB" />
                                    </Field>

                                    <Field icon={<HardDrive size={16} />} label="Disco" hint="disk_gb (backend)">
                                        <RangeRow value={diskGb} setValue={setDiskGb} min={limits.diskGb.min} max={limits.diskGb.max} step={limits.diskGb.step} suffix=" GB" />
                                    </Field>

                                    <Field icon={<Hash size={16} />} label="Quantidade" hint="qty">
                                        <RangeRow value={qty} setValue={setQty} min={limits.qty.min} max={limits.qty.max} step={limits.qty.step} />
                                    </Field>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5">
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <BadgeDollarSign size={16} className="opacity-80" />
                                            <span className="font-semibold">Preço</span>
                                        </div>

                                        {!customEnabled && (
                                            <div className="mt-3">
                                                <div className="text-xs text-slate-500">Plano base</div>
                                                <div className="text-3xl font-extrabold text-slate-100">{basePrice}</div>
                                                <div className="mt-2 text-xs text-slate-500">Ative Custom para recalcular pelo backend.</div>
                                            </div>
                                        )}

                                        {customEnabled && (
                                            <div className="mt-3 space-y-2">
                                                <div className="text-xs text-slate-500">Custom (backend)</div>

                                                {calcLoading && (
                                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400 text-sm">
                                                        Calculando...
                                                    </div>
                                                )}

                                                {calcErr && (
                                                    <div className="rounded-xl border border-red-500/20 bg-white/5 p-3 text-red-300 text-sm flex items-start gap-2">
                                                        <AlertTriangle size={16} className="mt-0.5" />
                                                        <div>{calcErr}</div>
                                                    </div>
                                                )}

                                                {calcUnitText && !calcLoading && !calcErr && (
                                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                                                        <div>
                                                            <div className="text-xs text-slate-500">Unit price</div>
                                                            <div className="text-3xl font-extrabold text-slate-100">{calcUnitText}</div>
                                                        </div>

                                                        {calcTotalText && (
                                                            <div>
                                                                <div className="text-xs text-slate-500">Total ({qty}x)</div>
                                                                <div className="text-xl font-bold text-slate-100">{calcTotalText}</div>
                                                            </div>
                                                        )}

                                                        {calcResult?.pricing_version && (
                                                            <div className="text-[11px] text-slate-500">
                                                                pricing_version:{" "}
                                                                <span className="text-slate-300">{calcResult.pricing_version}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {customEnabled && (
                                        <button
                                            onClick={addToCart}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-sky-700/40 bg-sky-900/10 hover:bg-white/5 text-sm font-semibold text-sky-200"
                                            disabled={calcResult?.unit_price == null}
                                            title={calcResult?.unit_price == null ? "Calcule o preço antes" : ""}
                                        >
                                            <ShoppingCart size={16} />
                                            Adicionar ao carrinho
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <footer className="border-t border-white/10 pt-6 text-xs text-slate-500">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>VM Panel · Shop</div>
                        <div className="flex gap-3">
                            <a href="/shop#about" className="hover:text-slate-300">
                                Sobre
                            </a>
                            <a href="/shop#support" className="hover:text-slate-300">
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

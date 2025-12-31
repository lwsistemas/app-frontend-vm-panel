import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Lock,
    User as UserIcon,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    ShieldCheck,
    Cloud,
    Server,
    Bell,
    BadgeCheck,
    Shield,
    Activity,
} from "lucide-react";
import api from "../services";
import logo from "../assets/img/logo.png";

// ✅ Fallback image
import heroImg from "../assets/img/login-hero.jpg";
// ✅ AWS-style loop video (se existir)
import heroVideo from "../assets/img/login-hero.jpg";

export default function Login() {
    const navigate = useNavigate();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPass, setShowPass] = useState(false);

    // ✅ status backend
    const [health, setHealth] = useState({
        ok: true,
        label: "All systems operational",
        detail: "",
        loading: true,
    });

    // ✅ 2FA badge ready (futuro)
    const [twoFAEnabled] = useState(false);

    // ✅ parallax
    const heroRef = useRef(null);
    const rafRef = useRef(null);
    const target = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });

    const year = useMemo(() => new Date().getFullYear(), []);

    /* =============================
     * BACKEND HEALTH
     * ============================= */
    async function loadHealth() {
        try {
            const { data } = await api.get("/health");

            // ✅ formatos aceitos:
            // { ok: true, status: "operational" }
            // { success: true, message: "ok" }
            const ok =
                data?.ok ??
                data?.success ??
                (data?.status === "ok") ??   // ✅ seu caso
                (data === "ok") ??
                true;

            setHealth({
                ok: !!ok,
                label: ok ? "All systems operational" : "Degraded performance",
                detail: data?.message || data?.detail || "",
                loading: false,
            });

        } catch (e) {
            setHealth({
                ok: false,
                label: "Status unavailable",
                detail: "",
                loading: false,
            });
        }
    }

    useEffect(() => {
        loadHealth();
        const t = setInterval(loadHealth, 30000);
        return () => clearInterval(t);
    }, []);

    /* =============================
     * PARALLAX (leve e suave)
     * ============================= */
    useEffect(() => {
        const el = heroRef.current;
        if (!el) return;

        function onMove(e) {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            // alvo
            target.current.x = x;
            target.current.y = y;

            if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
        }

        function tick() {
            // suaviza
            current.current.x += (target.current.x - current.current.x) * 0.08;
            current.current.y += (target.current.y - current.current.y) * 0.08;

            const tx = current.current.x * 18; // intensidade
            const ty = current.current.y * 12;

            // aplica no hero content
            el.style.setProperty("--px", `${tx}px`);
            el.style.setProperty("--py", `${ty}px`);

            rafRef.current = requestAnimationFrame(tick);
        }

        el.addEventListener("mousemove", onMove);

        return () => {
            el.removeEventListener("mousemove", onMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    /* =============================
     * LOGIN
     * ============================= */
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        try {
            setLoading(true);

            const { data } = await api.post("/auth/login", { login, password });

            if (data?.error) {
                setError(data.error);
                return;
            }

            localStorage.setItem("authKey", data.authKey);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/");
        } catch {
            setError("Erro ao autenticar. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 text-slate-200">

            {/* ================= LEFT / HERO (VIDEO LOOP + PARALLAX) ================= */}
            <div
                ref={heroRef}
                className="relative hidden lg:flex items-center justify-center overflow-hidden"
                style={{
                    // usado pelo parallax
                    transform: "translate3d(0,0,0)",
                }}
            >
                {/* video background */}
                <video
                    className="absolute inset-0 w-full h-full object-cover opacity-65"
                    src={heroVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={(e) => {
                        // fallback se vídeo não existir
                        e.currentTarget.style.display = "none";
                    }}
                />

                {/* fallback image */}
                <img
                    src={heroImg}
                    alt="Cloud Infrastructure"
                    className="absolute inset-0 w-full h-full object-cover opacity-55"
                />

                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-slate-900/92" />

                {/* subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.10]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)",
                        backgroundSize: "56px 56px",
                    }}
                />

                {/* glow */}
                <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-sky-600/20 blur-[90px]" />
                <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-[90px]" />

                {/* content (parallax applied here) */}
                <div
                    className="relative z-10 max-w-lg px-12"
                    style={{
                        transform: "translate3d(var(--px, 0px), var(--py, 0px), 0)",
                        transition: "transform 60ms linear",
                    }}
                >
                    <img src={logo} alt="LW" className="h-10 mb-6 opacity-95" />

                    <h1 className="text-3xl font-semibold text-white leading-tight">
                        Gerencie sua infraestrutura<br />
                        com precisão e segurança
                    </h1>

                    <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                        Controle VMs, redes, alertas e operações críticas com um painel moderno,
                        confiável e escalável.
                    </p>

                    <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-slate-300">
                        <Feature icon={<Server size={18} />} label="VMs & Templates" />
                        <Feature icon={<Bell size={18} />} label="Alertas em tempo real" />
                        <Feature icon={<Cloud size={18} />} label="Infra Cloud" />
                    </div>

                    <div className="mt-10 text-xs text-slate-400">
                        © {year} LW Sistemas • Infraestrutura profissional
                    </div>
                </div>
            </div>

            {/* ================= RIGHT / LOGIN ================= */}
            <div className="relative flex items-center justify-center px-4">
                {/* glow behind card */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-sky-600/10 blur-[80px]" />
                </div>

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                        <img src={logo} alt="LW" className="h-9" />
                        <span className="text-lg font-semibold text-white">
              LW Cloud Panel
            </span>
                    </div>

                    {/* card */}
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                        {/* header */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-800/70">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-sky-300" />
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-white">
                                            Acesso seguro
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Entre com suas credenciais
                                        </div>
                                    </div>
                                </div>

                                {/* 2FA badge-ready */}
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border
                    ${twoFAEnabled
                                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
                                            : "bg-slate-500/10 border-slate-500/25 text-slate-300"
                                        }`}
                                        title="2FA pronto para ativar"
                                    >
                                        <BadgeCheck className="w-3.5 h-3.5" />
                                        2FA
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* status bar */}
                        <div className="px-6 py-3 border-b border-slate-800/60 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                                <Activity className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-300">Status</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                <span
                    className={`inline-block w-2 h-2 rounded-full
                  ${health.loading ? "bg-slate-500" : health.ok ? "bg-emerald-400" : "bg-yellow-400"}`}
                />
                                <span className="text-slate-200">
                  {health.loading ? "Carregando..." : health.label}
                </span>
                            </div>
                        </div>

                        {/* form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Login"
                                icon={<UserIcon size={16} />}
                                value={login}
                                onChange={setLogin}
                                placeholder="Usuário"
                            />

                            {/* password */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400">Senha</label>
                                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>

                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Senha"
                                        className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-950/40 border border-slate-800
                               focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40
                               text-sm placeholder:text-slate-500"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-800/60 transition"
                                        title={showPass ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60
                           transition font-semibold text-sm flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    <>
                                        Entrar
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {/* footer small */}
                            <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
                                <Shield className="w-3.5 h-3.5" />
                                Conexão segura • © {year} LW Sistemas
                            </div>
                        </form>
                    </div>
                    <div className="pt-3 mt-1 text-center text-xs text-slate-500">
                        Não tem uma conta?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/register")}
                            className="font-medium text-sky-400 hover:text-sky-300 hover:underline transition"
                        >
                            Criar conta
                        </button>

                    </div>


                    {/* micro text */}
                    <div className="mt-6 text-center text-xs text-slate-500">
                        Dica: ative 2FA quando estiver disponível para maior segurança.
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================= COMPONENTS ================= */

function Feature({ icon, label }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-center">{label}</span>
        </div>
    );
}

function Input({ label, icon, value, onChange, placeholder }) {
    return (
        <div className="space-y-2">
            <label className="text-xs text-slate-400">{label}</label>
            <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950/40 border border-slate-800
                     focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40
                     text-sm placeholder:text-slate-500"
                />
            </div>
        </div>
    );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Lock,
    Phone,
    FileText,
    ArrowRight,
    Loader2,
    ShieldCheck,
    Cloud,
    Server,
    Bell,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import api from "../services";

import logo from "../assets/img/logo.png";
import heroImg from "../assets/img/login-hero.jpg";
import heroVideo from "../assets/img/login-hero.jpg";

export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [document, setDocument] = useState(""); // CPF/CNPJ
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false); // ✅ trava botão
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const year = useMemo(() => new Date().getFullYear(), []);

    function normalizeDoc(v) {
        return (v || "").replace(/\D/g, ""); // só números
    }

    function normalizePhone(v) {
        return (v || "").replace(/[^\d+]/g, "");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;

        setError(null);
        setSuccess(null);

        const doc = normalizeDoc(document);
        const ph = normalizePhone(phone);

        if (!name || !email || !ph || !doc || !login || !password) {
            setError("Preencha todos os campos.");
            return;
        }

        if (doc.length !== 11 && doc.length !== 14) {
            setError("CPF deve ter 11 dígitos ou CNPJ 14 dígitos.");
            return;
        }

        try {
            setLoading(true);

            const { data } = await api.post("/auth/register", {
                name,
                email,
                phone: ph,
                document: doc,
                login,
                password,
                phone_ddi: "+55"
            });

            if (data?.error) {
                setError(data.error);
                return;
            }

            setSuccess("Conta criada com sucesso! Verifique seu WhatsApp e Email.");
        } catch (err) {
            setError("Erro ao criar conta. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 text-slate-200">

            {/* ================= LEFT / HERO ================= */}
            <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
                <video
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    src={heroVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />

                <img
                    src={heroImg}
                    alt="Cloud Infrastructure"
                    className="absolute inset-0 w-full h-full object-cover opacity-55"
                />

                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-slate-900/92" />

                <div className="relative z-10 max-w-lg px-12">
                    <img src={logo} alt="LW" className="h-10 mb-6 opacity-95" />

                    <h1 className="text-3xl font-semibold text-white leading-tight">
                        Crie sua conta e<br />gerencie sua infraestrutura
                    </h1>

                    <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                        Tenha acesso ao painel completo para controle de VMs, alertas
                        e operações críticas com segurança.
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

            {/* ================= RIGHT / REGISTER ================= */}
            <div className="flex items-center justify-center px-4">
                <div className="w-full max-w-md">

                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                        <img src={logo} alt="LW" className="h-9" />
                        <span className="text-lg font-semibold text-white">
              LW Cloud Panel
            </span>
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">

                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-800/70">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-sky-300" />
                                </div>
                                <div>
                                    <div className="text-base font-semibold text-white">
                                        Criar conta
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Cliente entra ativo automaticamente
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* mensagens */}
                            {error && (
                                <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {success}
                                </div>
                            )}

                            <Input label="Nome" icon={<User size={16} />} value={name} onChange={setName} />
                            <Input label="E-mail" icon={<Mail size={16} />} value={email} onChange={setEmail} />

                            <Input
                                label="Telefone (WhatsApp)"
                                icon={<Phone size={16} />}
                                value={phone}
                                onChange={setPhone}
                                placeholder="+5581999999999"
                            />

                            <Input
                                label="CPF / CNPJ"
                                icon={<FileText size={16} />}
                                value={document}
                                onChange={setDocument}
                                placeholder="Somente números"
                            />

                            <Input label="Login" icon={<User size={16} />} value={login} onChange={setLogin} />
                            <Input
                                label="Senha"
                                icon={<Lock size={16} />}
                                type="password"
                                value={password}
                                onChange={setPassword}
                            />

                            {/* ✅ botão trava e não duplica */}
                            {!success ? (
                                <button
                                    disabled={loading}
                                    className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60
                             transition font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            Criar conta
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => navigate("/login", { state: { login } })}
                                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition
                             font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Ir para Login
                                </button>
                            )}

                            <div className="text-center text-xs text-slate-500 pt-2">
                                Já tem conta?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="font-medium text-sky-400 hover:text-sky-300 hover:underline transition"
                                >
                                    Entrar
                                </button>
                            </div>
                        </form>
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

function Input({ label, icon, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="space-y-2">
            <label className="text-xs text-slate-400">{label}</label>
            <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
                <input
                    type={type}
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

// src/components/PublicHeader.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";
import logo from "../../../../assets/img/logo.png"; // <- sua logo

export default function PublicHeader({ cartCount = 0, onOpenCart }) {
    const [query, setQuery] = useState("");
    const loc = useLocation();

    useEffect(() => {
        setQuery("");
    }, [loc.pathname]);

    return (
        <header className="w-full border-b border-white/10 bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>

                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-100">VM Panel</div>
                            <div className="text-xs text-slate-400 -mt-0.5">Catálogo público</div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-3 ml-6">
                        <Link to="/plans" className="text-sm text-slate-200 hover:underline">Plans</Link>
                        <Link to="/about" className="text-sm text-slate-400 hover:underline">Sobre</Link>
                        <Link to="/docs" className="text-sm text-slate-400 hover:underline">Docs</Link>
                    </nav>
                </div>

                <div className="flex-1 px-4 max-w-xl">
                    <div className="relative">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pesquisar planos..."
                            className="w-full px-4 py-2 rounded-2xl bg-black/20 border border-white/10 text-slate-200 text-sm"
                        />
                        <button className="absolute right-1 top-1.5 p-2 rounded-xl text-slate-200" title="Buscar">
                            <Search size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={onOpenCart} className="relative px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2">
                        <ShoppingCart size={16} />
                        <span className="text-slate-200">Carrinho</span>
                        {cartCount > 0 ? (
                            <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold bg-rose-600 text-white w-5 h-5 rounded-full">
                {cartCount}
              </span>
                        ) : null}
                    </button>
                </div>
            </div>
        </header>
    );
}

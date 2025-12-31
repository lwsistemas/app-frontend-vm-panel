import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import logo from '../../src/assets/img/logo.png';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
            <div className="text-center max-w-md">

                {/* LOGO */}
                <div className="flex justify-center mb-6">
                    <img
                        src={logo}
                        alt="LW Sistemas"
                        className="h-14 w-auto opacity-90"
                    />
                </div>

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-2">404</h1>
                <p className="text-slate-400 mb-6">
                    A página que você tentou acessar não existe ou foi movida.
                </p>

                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                               bg-sky-600 hover:bg-sky-500 transition font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o Dashboard
                </button>
            </div>
        </div>
    );
}

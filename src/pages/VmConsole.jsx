import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services';
import Header from '../components/Header';
import { ArrowLeft, Monitor } from 'lucide-react';

export default function VmConsole() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [iframeUrl, setIframeUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function loadConsole() {
            try {
                setLoading(true);

                const { data } = await api.post(`/vm/${id}/console`);

                if (!data?.iframeUrl) {
                    throw new Error('URL do console inválida');
                }

                if (mounted) {
                    setIframeUrl(data.iframeUrl);
                }

            } catch (err) {
                console.error('[VM][CONSOLE]', err);
                setError(err.response?.data?.error || 'Erro ao abrir console da VM');
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadConsole();

        return () => {
            mounted = false;
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Header />

            {/* HEADER */}
            <div className="flex items-center gap-4 p-3 border-b border-slate-800 bg-slate-900">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Monitor className="w-4 h-4 text-sky-400" />
                    Console da VM #{id}
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 bg-black">
                {loading && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Carregando console…
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-full text-red-400">
                        {error}
                    </div>
                )}

                {!loading && !error && iframeUrl && (
                    <iframe
                        src={iframeUrl}
                        title="VM Console"
                        className="w-full h-full border-0 bg-black"
                        allow="clipboard-read; clipboard-write; fullscreen"
                    />
                )}
            </div>
        </div>
    );
}

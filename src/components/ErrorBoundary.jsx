import React from 'react';
import { AlertOctagon, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('💥 ErrorBoundary capturou erro:', error, info);
    }

    reload() {
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
                    <div className="max-w-md text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertOctagon className="w-8 h-8 text-red-400" />
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold mb-2">
                            Ocorreu um erro inesperado
                        </h2>

                        <p className="text-sm text-slate-400 mb-6">
                            Algo deu errado ao carregar esta página.
                            Se o problema persistir, contate o administrador.
                        </p>

                        <button
                            onClick={() => this.reload()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                                       bg-sky-600 hover:bg-sky-500 transition font-semibold"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Recarregar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function SystemLogs({ logs }) {
    return (
        <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
                Logs do sistema
            </h2>

            <div className="rounded-lg bg-black border border-slate-800 p-3 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                        <span className="text-slate-500">[{log.time}]</span>{' '}
                        {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

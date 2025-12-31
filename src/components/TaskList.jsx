export default function TaskList({ tasks }) {
    return (
        <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
                Tarefas em execução
            </h2>

            <div className="rounded-lg bg-slate-900 border border-slate-800 divide-y divide-slate-800">
                {tasks.length === 0 && (
                    <div className="p-4 text-xs text-slate-500">
                        Nenhuma tarefa em execução
                    </div>
                )}

                {tasks.map((t, i) => (
                    <div key={i} className="p-3 flex justify-between text-xs">
                        <span>{t.label}</span>
                        <span className="text-slate-500">{t.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

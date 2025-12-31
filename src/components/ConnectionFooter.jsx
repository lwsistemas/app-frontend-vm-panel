export default function ConnectionFooter({ api, ip, timezone }) {
    return (
        <footer className="fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800 text-xs text-slate-400 px-6 py-2 flex justify-between">

            <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                API: {api}
            </div>

            <div className="flex items-center gap-6">
                <span>IP: {ip}</span>
                <span>Timezone: {timezone}</span>
                <span>{new Date().toLocaleTimeString()}</span>
            </div>

        </footer>
    );
}

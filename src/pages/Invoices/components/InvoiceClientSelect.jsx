// src/pages/Invoices/components/InvoiceClientSelect.jsx
import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import UsersApi from "../../../services/users";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

/**
 * InvoiceClientSelect
 *
 * Props:
 * - value: selected owner id (string|number|null)
 * - onChange: function(id|null)
 * - disabled: boolean
 * - placeholder: string
 */
export default function InvoiceClientSelect({
                                                value,
                                                onChange,
                                                disabled = false,
                                                placeholder = "Pesquisar cliente por nome/email...",
                                            }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");

    const ref = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        function onDoc(e) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // normalize API response shapes to an array
    function normalizeUsersResponse(res) {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.users)) return res.users;
        // fallback: try to find array on object
        for (const k of Object.keys(res)) {
            if (Array.isArray(res[k])) return res[k];
        }
        return [];
    }

    async function fetchResults(q = "") {
        setLoading(true);
        try {
            // UsersApi.simple may return array or { data: [...] } or { users: [...] }
            const res = await UsersApi.simple({ search: q || undefined, limit: 50 });
            const data = normalizeUsersResponse(res);
            setResults(data);
            return data;
        } catch (err) {
            console.error("InvoiceClientSelect fetchResults", err);
            setResults([]);
            return [];
        } finally {
            setLoading(false);
        }
    }

    function scheduleFetch(q) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchResults(q), 260);
    }

    useEffect(() => {
        // initial load
        fetchResults("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // if value changes, try to set a label from current results
        if (!value) {
            setSelectedLabel("");
            return;
        }

        const found = results.find((r) => String(r.id) === String(value));
        if (found) {
            setSelectedLabel(found.name || found.login || found.email || `#${found.id}`);
            return;
        }

        // not in results: set fallback label `Owner #id — não encontrado`
        setSelectedLabel(`#${value} — não encontrado`);
        // optionally you could try to fetch a single user by id if API exposes it
    }, [value, results]);

    function onSelect(item) {
        onChange?.(item?.id ?? null);
        setSelectedLabel(item?.name || item?.login || item?.email || `#${item?.id}`);
        setOpen(false);
    }

    function clearSelection(e) {
        e?.stopPropagation?.();
        onChange?.(null);
        setSelectedLabel("");
        setQuery("");
        setResults([]);
    }

    return (
        <div ref={ref} className="relative w-full">
            <div
                className={cls(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl border",
                    "bg-black/30 text-slate-100 text-sm",
                    disabled ? "border-white/10 opacity-60 cursor-not-allowed" : "border-white/10 cursor-text"
                )}
                onClick={() => {
                    if (disabled) return;
                    setOpen(true);
                    const input = ref.current?.querySelector("input");
                    if (input) input.focus();
                }}
            >
                <div className="flex items-center gap-2 flex-1">
                    <div className="text-slate-400">
                        <Search size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {open ? (
                            <input
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    scheduleFetch(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") setOpen(false);
                                }}
                                placeholder={placeholder}
                                className="w-full bg-transparent outline-none text-slate-100 text-sm"
                            />
                        ) : (
                            <div className="text-slate-300 truncate text-sm">
                                {selectedLabel ? selectedLabel : <span className="text-slate-500">{placeholder}</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {loading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : value ? (
                        <button onClick={clearSelection} className="p-1 rounded hover:bg-white/5" title="Limpar">
                            <X size={14} className="text-slate-400" />
                        </button>
                    ) : (
                        <div className="text-slate-400 text-xs"> </div>
                    )}
                </div>
            </div>

            {open ? (
                <div className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-lg border border-white/10 bg-slate-900 p-2 shadow-lg">
                    {loading ? (
                        <div className="px-3 py-2 text-slate-400 text-sm">Carregando...</div>
                    ) : results.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500">Nenhum cliente encontrado.</div>
                    ) : (
                        results.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => onSelect(r)}
                                className="w-full text-left px-3 py-2 rounded hover:bg-white/5 flex items-center gap-3"
                            >
                                <div className="min-w-0 overflow-hidden">
                                    <div className="text-sm text-slate-100 truncate">{r.name || r.login || r.email || `#${r.id}`}</div>
                                    <div className="text-xs text-slate-400 truncate">{r.email || r.login || `#${r.id}`}</div>
                                </div>
                                <div className="text-xs text-slate-400">{r.role ? r.role : ""}</div>
                            </button>
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

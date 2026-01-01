// src/components/SelectSearch.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

/**
 * SelectSearch
 * - items: array
 * - value
 * - onChange(value, item)
 *
 * Props extras:
 * - hideSearch: boolean (não mostra input interno)
 * - drop: "auto" | "down" | "up"
 */
export default function SelectSearch({
                                         items = [],
                                         value = "",
                                         onChange,
                                         placeholder = "Selecione...",
                                         getLabel = (x) => String(x),
                                         getValue = (x) => String(x),
                                         className,

                                         hideSearch = false,
                                         drop = "auto",
    menuPosition = "absolute",
                                     }) {
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [dropDir, setDropDir] = useState("down");

    const selected = useMemo(() => {
        return items.find((it) => String(getValue(it)) === String(value)) || null;
    }, [items, value, getValue]);

    const filtered = useMemo(() => {
        const s = String(q || "").toLowerCase().trim();
        if (!s) return items;
        return items.filter((it) => String(getLabel(it)).toLowerCase().includes(s));
    }, [items, q, getLabel]);

    useEffect(() => {
        function onDocClick(e) {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    function computeDropDirection() {
        if (!rootRef.current) return "down";
        if (drop === "down") return "down";
        if (drop === "up") return "up";

        const rect = rootRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const spaceBelow = viewportH - rect.bottom;
        const spaceAbove = rect.top;

        // dropdown ~ 280px
        const needed = 280;
        if (spaceBelow < needed && spaceAbove > spaceBelow) return "up";
        return "down";
    }

    function toggleOpen() {
        const dir = computeDropDirection();
        setDropDir(dir);
        setOpen((v) => !v);
    }
    const menuPos = menuPosition === "relative" ? "relative" : "absolute";



    const menuClass =
        dropDir === "up"
            ? `${menuPos} z-[2000] mb-2 ${menuPosition === "relative" ? "" : "bottom-full"} w-full ...`
            : `${menuPos} z-[2000] mt-2 ${menuPosition === "relative" ? "" : "top-full"} w-full ...`;


    return (
        <div ref={rootRef} className={cn("inhe select-search-root", className)}>
            <button
                type="button"
                onClick={toggleOpen}
                className={cn(
                    "w-full text-left bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100",
                    "hover:bg-white/5 transition"
                )}
            >
                {selected ? getLabel(selected) : <span className="text-slate-500">{placeholder}</span>}
            </button>

            {open ? (
                <div className={menuClass}>
                    {!hideSearch ? (
                        <div className="p-2 border-b border-white/10">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-100"
                            />
                        </div>
                    ) : null}

                    <div className="max-h-64 overflow-auto">
                        <button
                            type="button"
                            onClick={() => {
                                onChange?.("", null);
                                setOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5"
                        >
                            (limpar)
                        </button>

                        {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-slate-500">Nenhum resultado</div>
                        ) : (
                            filtered.map((it) => {
                                const v = getValue(it);
                                const label = getLabel(it);

                                return (
                                    <button
                                        key={String(v)}
                                        type="button"
                                        onClick={() => {
                                            onChange?.(String(v), it);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-xs hover:bg-white/5",
                                            String(v) === String(value) ? "text-sky-300" : "text-slate-200"
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

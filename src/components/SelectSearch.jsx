// src/components/SelectSearch.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

function cn(...arr) {
    return arr.filter(Boolean).join(" ");
}

/**
 * SelectSearch
 *
 * Compatível com o uso atual:
 * - items, value, onChange(v, item)
 * - getLabel, getValue, placeholder
 * - hideSearch, drop, menuPosition
 *
 * Melhorias (opcionais):
 * - renderItem(item, { selected, active }) => JSX (lista rica)
 * - getSubLabel(item) => string (linha menor)
 * - maxHeight => number (altura max do menu)
 * - countLabel => string (custom contador)
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

                                         renderItem, // ✅ opcional
                                         getSubLabel, // ✅ opcional
                                         maxHeight = 260,
                                         countLabel,
                                     }) {
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [dropDir, setDropDir] = useState("down");
    const [activeIndex, setActiveIndex] = useState(-1);

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

    const menuPos = menuPosition === "relative" ? "relative" : "absolute";

    function computeDropDirection() {
        if (!rootRef.current) return "down";
        if (drop === "down") return "down";
        if (drop === "up") return "up";

        const rect = rootRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const spaceBelow = viewportH - rect.bottom;
        const spaceAbove = rect.top;

        const needed = Math.min(320, maxHeight + 80);
        if (spaceBelow < needed && spaceAbove > spaceBelow) return "up";
        return "down";
    }

    function openMenu() {
        const dir = computeDropDirection();
        setDropDir(dir);
        setOpen(true);
        setActiveIndex(filtered.length > 0 ? 0 : -1);

        setTimeout(() => {
            if (!hideSearch && inputRef.current) inputRef.current.focus();
        }, 0);
    }

    function closeMenu() {
        setOpen(false);
        setActiveIndex(-1);
    }

    function toggleOpen() {
        if (open) closeMenu();
        else openMenu();
    }

    const menuClass =
        dropDir === "up"
            ? `${menuPos} z-[2000] mb-2 ${menuPosition === "relative" ? "" : "bottom-full"} w-full rounded-xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden`
            : `${menuPos} z-[2000] mt-2 ${menuPosition === "relative" ? "" : "top-full"} w-full rounded-xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden`;

    const handleClear = useCallback(() => {
        onChange?.("", null);
        closeMenu();
    }, [onChange]);

    const selectItem = useCallback(
        (it) => {
            const v = getValue(it);
            onChange?.(String(v), it);
            closeMenu();
        },
        [onChange, getValue]
    );

    function ensureActiveVisible(idx) {
        const el = listRef.current?.querySelector?.(`[data-idx="${idx}"]`);
        if (!el || !listRef.current) return;

        const container = listRef.current;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;

        if (top < container.scrollTop) container.scrollTop = top - 8;
        else if (bottom > container.scrollTop + container.clientHeight)
            container.scrollTop = bottom - container.clientHeight + 8;
    }

    function onKeyDown(e) {
        if (!open) {
            if (e.key === "Enter" || e.key === "ArrowDown") {
                e.preventDefault();
                openMenu();
            }
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            closeMenu();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.min(filtered.length - 1, activeIndex + 1);
            setActiveIndex(next);
            ensureActiveVisible(next);
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = Math.max(0, activeIndex - 1);
            setActiveIndex(prev);
            ensureActiveVisible(prev);
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && filtered[activeIndex]) {
                selectItem(filtered[activeIndex]);
            }
        }
    }

    useEffect(() => {
        if (!open) return;
        setActiveIndex(filtered.length > 0 ? 0 : -1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, open]);

    return (
        <div
            ref={rootRef}
            className={cn("select-search-root relative", className)}
            onKeyDown={onKeyDown}
        >
            <button
                type="button"
                onClick={toggleOpen}
                className={cn(
                    "w-full text-left bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-slate-100",
                    "hover:bg-white/5 transition"
                )}
            >
                {selected ? (
                    <div className="flex flex-col">
                        <span className="truncate">{getLabel(selected)}</span>
                        {getSubLabel ? (
                            <span className="text-[11px] text-slate-500 truncate">
                {getSubLabel(selected)}
              </span>
                        ) : null}
                    </div>
                ) : (
                    <span className="text-slate-500">{placeholder}</span>
                )}
            </button>

            {open ? (
                <div className={menuClass}>
                    {!hideSearch ? (
                        <div className="p-2 border-b border-white/10">
                            <input
                                ref={inputRef}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-100"
                            />
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                <span>{countLabel || `${filtered.length} itens`}</span>
                                <span className="opacity-70">↑↓ Enter Esc</span>
                            </div>
                        </div>
                    ) : null}

                    <div ref={listRef} className="overflow-auto" style={{ maxHeight }}>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5"
                        >
                            (limpar)
                        </button>

                        {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-slate-500">Nenhum resultado</div>
                        ) : (
                            filtered.map((it, idx) => {
                                const v = getValue(it);
                                const isSel = String(v) === String(value);
                                const isActive = idx === activeIndex;

                                return (
                                    <button
                                        key={String(v)}
                                        type="button"
                                        data-idx={idx}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => selectItem(it)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-xs hover:bg-white/5",
                                            isSel ? "text-sky-300" : "text-slate-200",
                                            isActive && "bg-white/5"
                                        )}
                                    >
                                        {renderItem ? (
                                            <div>{renderItem(it, { selected: isSel, active: isActive })}</div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="truncate">{getLabel(it)}</span>
                                                {getSubLabel ? (
                                                    <span className="text-[11px] text-slate-500 truncate">
                            {getSubLabel(it)}
                          </span>
                                                ) : null}
                                            </div>
                                        )}
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

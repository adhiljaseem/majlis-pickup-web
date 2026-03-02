"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { typesenseClient } from "../lib/typesense";
import { resolveForBranch } from "../hooks/useTypesenseSearch";
import { TypesenseProduct, Product } from "../types";

interface SearchAutocompleteProps {
    branchId: string;
    value: string;
    onChange: (val: string) => void;
    className?: string;
    inputClassName?: string;
    mobile?: boolean;
}

export function SearchAutocomplete({
    branchId,
    value,
    onChange,
    inputClassName,
    mobile = false,
}: SearchAutocompleteProps) {
    const router = useRouter();
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const res = await typesenseClient
                .collections("products")
                .documents()
                .search({
                    q,
                    query_by: "name,brand,category,subcategory,subsubcategory,barcodes,tags,searchKeywords",
                    per_page: 6,
                    highlight_full_fields: "name",
                });
            const docs = res.hits?.map(h => h.document as unknown as TypesenseProduct) || [];
            const resolved = docs
                .map(d => resolveForBranch(d, branchId))
                .filter((p): p is Product => p !== null);
            setSuggestions(resolved);
            setOpen(resolved.length > 0);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [value, fetchSuggestions]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setActive(-1);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
        else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            const p = suggestions[active];
            router.push(`/${branchId}/product/${p.id}`);
            setOpen(false);
            onChange(p.name);
        } else if (e.key === "Escape") {
            setOpen(false);
            setActive(-1);
        }
    };

    const handleSelect = (p: Product) => {
        router.push(`/${branchId}/product/${p.id}`);
        setOpen(false);
        onChange("");
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Input */}
            <div className="relative group/search">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`h-4 w-4 text-neutral-400 group-focus-within/search:text-indigo-500 transition-colors ${loading ? "animate-pulse text-indigo-400" : ""}`} />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    placeholder="Search products..."
                    className={inputClassName ?? (mobile
                        ? "w-full bg-neutral-100/80 border border-transparent focus:bg-white focus:border-indigo-500 rounded-full py-2.5 pl-11 pr-10 text-sm text-neutral-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-neutral-400"
                        : "w-full bg-neutral-100/80 hover:bg-white border border-transparent hover:border-neutral-200 focus:bg-white focus:border-indigo-500 rounded-full py-2.5 pl-11 pr-10 text-sm text-neutral-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-neutral-400"
                    )}
                />
                {value && (
                    <button
                        onClick={() => { onChange(""); setSuggestions([]); setOpen(false); }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <ul className="py-1.5 max-h-80 overflow-y-auto no-scrollbar">
                        {suggestions.map((p, i) => (
                            <li key={p.id}>
                                <button
                                    onMouseDown={() => handleSelect(p)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === active ? "bg-indigo-50" : "hover:bg-neutral-50"}`}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                        {p.imageUrl
                                            ? <Image src={p.imageUrl} alt={p.name} width={48} height={48} className="w-full h-full object-contain" />
                                            : <div className="text-[8px] text-neutral-300 font-bold">IMG</div>
                                        }
                                    </div>
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-neutral-800 truncate">{p.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {p.category && (
                                                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{p.category}</span>
                                            )}
                                            <span className="text-xs font-black text-indigo-600">QAR {(p.offerPrice || p.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <svg className="w-4 h-4 text-neutral-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="px-4 py-2 border-t border-neutral-50 text-[10px] text-neutral-400 font-medium">
                        ↑ ↓ Navigate &nbsp;·&nbsp; Enter Select &nbsp;·&nbsp; Esc Close
                    </div>
                </div>
            )}
        </div>
    );
}

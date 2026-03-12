"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Category } from "../types";
import { motion } from "framer-motion";

interface CategoryFilterProps {
    branchId: string;
    onSelect: (categoryName: string | null) => void;
    selectedCategory: string | null;
}

export function CategoryFilter({ branchId, onSelect, selectedCategory }: CategoryFilterProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const q = query(
                    collection(db, "categories"),
                    where("visible", "==", true),
                    where("visibleInBranches", "array-contains", branchId),
                    orderBy("order", "asc")
                );
                const snap = await getDocs(q);
                const list = snap.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                })) as Category[];
                setCategories(list);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    }, [branchId]);

    if (loading) {
        return (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-24 bg-neutral-100 rounded-full animate-pulse flex-shrink-0" />
                ))}
            </div>
        );
    }

    if (categories.length === 0) return null;

    return (
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x">
            <button
                onClick={() => onSelect(null)}
                className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-bold transition-all border
                    ${selectedCategory === null 
                        ? "bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-900/20" 
                        : "bg-white text-neutral-600 border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"
                    }`}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.name === selectedCategory ? null : cat.name)}
                    className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-bold transition-all border flex items-center gap-2
                        ${selectedCategory === cat.name 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" 
                            : "bg-white text-neutral-600 border-neutral-100 hover:border-indigo-100 hover:bg-indigo-50/30"
                        }`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}

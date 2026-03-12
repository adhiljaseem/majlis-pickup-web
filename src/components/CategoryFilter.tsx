"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy, QuerySnapshot, DocumentData } from "firebase/firestore";
import { Category, Subcategory, SubSubcategory } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface CategoryFilterProps {
    branchId: string;
    onSelect: (category: string | null, subcategory: string | null, subsubcategory: string | null) => void;
    selectedCategory: string | null;
    selectedSubcategory: string | null;
    selectedSubsubcategory: string | null;
}

export function CategoryFilter({ 
    branchId, 
    onSelect, 
    selectedCategory,
    selectedSubcategory,
    selectedSubsubcategory
}: CategoryFilterProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    
    const catScrollRef = useRef<HTMLDivElement>(null);
    const subScrollRef = useRef<HTMLDivElement>(null);
    const subsubScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, "categories"),
            where("visible", "==", true),
            where("visibleInBranches", "array-contains", branchId),
            orderBy("order", "asc")
        );

        const unsubscribe = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Category[];
            setCategories(list);
            setLoading(false);
        }, (err: any) => {
            console.error("Failed to fetch categories:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [branchId]);

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
        if (ref.current) {
            const { scrollLeft, clientWidth } = ref.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth * 0.6 : scrollLeft + clientWidth * 0.6;
            ref.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-24 bg-neutral-100 rounded-full animate-pulse flex-shrink-0" />
                ))}
            </div>
        );
    }

    if (categories.length === 0) return null;

    // Determine active subcategories and subsubcategories
    const activeCategoryObj = categories.find(c => c.name === selectedCategory);
    
    // Safely handle subcategories which might be an object/map or array from Firestore JSON
    let activeSubcategories: Subcategory[] = [];
    if (activeCategoryObj?.subcategories) {
        if (Array.isArray(activeCategoryObj.subcategories)) {
            activeSubcategories = activeCategoryObj.subcategories;
        } else if (typeof activeCategoryObj.subcategories === 'object') {
             // If stored as a map in Firestore { "subId": { ... } }
             activeSubcategories = Object.values(activeCategoryObj.subcategories);
        }
    }
    
    // Filter visible subcategories and sort if needed
    activeSubcategories = activeSubcategories.filter(s => s.visible !== false);

    const activeSubcategoryObj = activeSubcategories.find(s => s.name === selectedSubcategory);
    
    let activeSubsubcategories: SubSubcategory[] = [];
    if (activeSubcategoryObj?.subSubcategories) {
        if (Array.isArray(activeSubcategoryObj.subSubcategories)) {
            activeSubsubcategories = activeSubcategoryObj.subSubcategories;
        } else if (typeof activeSubcategoryObj.subSubcategories === 'object') {
             activeSubsubcategories = Object.values(activeSubcategoryObj.subSubcategories);
        }
    }
    activeSubsubcategories = activeSubsubcategories.filter(s => s.visible !== false);

    return (
        <section className="flex flex-col gap-3 py-2">
            {/* LEVEL 1: Main Categories (Text Pills) */}
            <div className="relative group/nav-cat">
                <button 
                    onClick={() => scroll(catScrollRef, "left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-1.5 bg-white rounded-full shadow-md border border-neutral-100 text-neutral-400 hover:text-indigo-600 opacity-0 group-hover/nav-cat:opacity-100 transition-all hidden md:flex active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => scroll(catScrollRef, "right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-1.5 bg-white rounded-full shadow-md border border-neutral-100 text-neutral-400 hover:text-indigo-600 opacity-0 group-hover/nav-cat:opacity-100 transition-all hidden md:flex active:scale-95"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <div 
                    ref={catScrollRef}
                    className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x"
                >
                    <button
                        onClick={() => onSelect(null, null, null)}
                        className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-bold transition-all border
                            ${selectedCategory === null 
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-900/20" 
                                : "bg-white text-neutral-600 border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"
                            }`}
                    >
                        All Products
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id || cat.name}
                            onClick={() => onSelect(cat.name === selectedCategory ? null : cat.name, null, null)}
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
            </div>

            {/* LEVEL 2: Subcategories (Image + Text Cards) */}
            <AnimatePresence mode="popLayout">
                {selectedCategory && activeSubcategories.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative group/nav-sub overflow-hidden"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-3 bg-indigo-200 rounded-full" />
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Subcategories</span>
                        </div>
                        
                        <button 
                            onClick={() => scroll(subScrollRef, "left")}
                            className="absolute left-0 top-1/2 -translate-x-2 z-20 p-1 bg-white rounded-full shadow-md border border-neutral-100 text-neutral-400 hover:text-indigo-600 opacity-0 group-hover/nav-sub:opacity-100 transition-all hidden md:flex active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => scroll(subScrollRef, "right")}
                            className="absolute right-0 top-1/2 translate-x-2 z-20 p-1 bg-white rounded-full shadow-md border border-neutral-100 text-neutral-400 hover:text-indigo-600 opacity-0 group-hover/nav-sub:opacity-100 transition-all hidden md:flex active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div 
                            ref={subScrollRef}
                            className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x"
                        >
                            {activeSubcategories.map((sub, idx) => {
                                const isActive = selectedSubcategory === sub.name;
                                return (
                                    <button
                                        key={sub.id || sub.name || idx}
                                        onClick={() => onSelect(selectedCategory, isActive ? null : sub.name, null)}
                                        className={`flex flex-col items-center gap-2 flex-shrink-0 w-20 sm:w-24 p-2 rounded-2xl transition-all border
                                            ${isActive 
                                                ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                                                : "bg-white border-transparent hover:bg-neutral-50 hover:border-neutral-100"
                                            }`}
                                    >
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white shadow-sm border border-neutral-100 overflow-hidden relative flex items-center justify-center p-1">
                                            {sub.iconUrl ? (
                                                <Image src={sub.iconUrl} alt={sub.name} fill className="object-contain p-2" />
                                            ) : (
                                                <div className="w-full h-full bg-neutral-50 flex items-center justify-center text-[10px] text-neutral-300 font-bold rounded-lg truncate px-1">Img</div>
                                            )}
                                            {isActive && (
                                                <div className="absolute inset-0 ring-2 ring-indigo-500 rounded-xl" />
                                            )}
                                        </div>
                                        <span className={`text-[10px] sm:text-xs font-bold text-center line-clamp-2 leading-tight
                                            ${isActive ? "text-indigo-700" : "text-neutral-600"}`}
                                        >
                                            {sub.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEVEL 3: Sub-subcategories (Smaller Text Pills) */}
            <AnimatePresence mode="popLayout">
                {selectedSubcategory && activeSubsubcategories.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative group/nav-subsub overflow-hidden"
                    >
                        <button 
                            onClick={() => scroll(subsubScrollRef, "left")}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 p-1 bg-white rounded-full shadow-md border border-neutral-100 text-neutral-400 hover:text-indigo-600 opacity-0 group-hover/nav-subsub:opacity-100 transition-all hidden md:flex active:scale-95"
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => scroll(subsubScrollRef, "right")}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 p-1 bg-white rounded-full shadow-md border border-neutral-100 text-neutral-400 hover:text-indigo-600 opacity-0 group-hover/nav-subsub:opacity-100 transition-all hidden md:flex active:scale-95"
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>

                        <div 
                            ref={subsubScrollRef}
                            className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x"
                        >
                            {activeSubsubcategories.map((subsub, idx) => {
                                const isActive = selectedSubsubcategory === subsub.name;
                                return (
                                    <button
                                        key={subsub.id || subsub.name || idx}
                                        onClick={() => onSelect(selectedCategory, selectedSubcategory, isActive ? null : subsub.name)}
                                        className={`flex-shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-all border flex items-center gap-2
                                            ${isActive 
                                                ? "bg-neutral-800 text-white border-neutral-800" 
                                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                                            }`}
                                    >
                                        {subsub.iconUrl && (
                                            <div className="w-4 h-4 relative -ml-1">
                                                <Image src={subsub.iconUrl} alt="" fill className="object-contain" />
                                            </div>
                                        )}
                                        {subsub.name}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

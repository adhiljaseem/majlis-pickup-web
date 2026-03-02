"use client";

import { useCart } from "../context/CartContext";
import { Product, TypesenseProduct } from "../types";
import { useEffect, useState } from "react";
import { hapticSoft } from "../lib/haptics";
import NextLink from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { typesenseClient } from "../lib/typesense";
import { resolveForBranch } from "../hooks/useTypesenseSearch";
import { X, Sparkles } from "lucide-react";

export function ProductImage({ src, alt }: { src: string; alt: string }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <div className="w-full h-full flex items-center justify-center text-neutral-300 font-medium text-xs">No Image</div>;
    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setFailed(true)}
        />
    );
}

export function ProductCard({ product, branchId }: { product: Product, branchId: string }) {
    const { addToCart, items, updateQuantity } = useCart();
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [alternatives, setAlternatives] = useState<Product[]>([]);
    const [loadingAlts, setLoadingAlts] = useState(false);

    const cartItem = items.find(i => i.id === product.id);
    const isSelected = !!cartItem && cartItem.quantity > 0;
    const hasDiscount = product.offerPrice > 0 && product.offerPrice < product.price;
    const displayPrice = hasDiscount ? product.offerPrice : product.price;
    const outOfStock = product.stock <= 0;

    const fetchAlternatives = async () => {
        if (alternatives.length > 0) return;
        setLoadingAlts(true);
        try {
            const res = await typesenseClient
                .collections("products")
                .documents()
                .search({
                    q: "*",
                    query_by: "name",
                    filter_by: `category:=[${product.category}] && branchPrices.${branchId}.stock:>0 && id:!=[${product.id}]`,
                    per_page: 3,
                });

            const docs = res.hits?.map(h => h.document as unknown as TypesenseProduct) || [];
            const resolved = docs.map(d => resolveForBranch(d, branchId)).filter((p): p is Product => p !== null);
            setAlternatives(resolved);
        } catch (err) {
            console.error("Failed to fetch alternatives:", err);
        } finally {
            setLoadingAlts(false);
        }
    };

    const handleOutOfStockClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        hapticSoft();
        setShowAlternatives(true);
        fetchAlternatives();
    };

    return (
        <div className="relative h-full">
            <NextLink
                href={`/${branchId}/product/${product.id}`}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all group flex flex-col h-full cursor-pointer
                ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/10 bg-indigo-50/5' : 'border-neutral-100 hover:border-indigo-100'} 
                ${outOfStock ? 'opacity-60' : 'hover:shadow-md'}`}>
                <div className="aspect-square rounded-xl bg-neutral-50 mb-3 overflow-hidden relative flex items-center justify-center">
                    {product.imageUrl ? (
                        <ProductImage src={product.imageUrl} alt={product.name} />
                    ) : (
                        <div className="text-neutral-300 font-medium text-xs">No Image</div>
                    )}
                    {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            OFFER
                        </span>
                    )}
                    {outOfStock && (
                        <div
                            onClick={handleOutOfStockClick}
                            className="absolute inset-0 bg-white/60 flex items-center justify-center cursor-help group/out"
                        >
                            <span className="bg-neutral-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 group-hover/out:scale-105 transition-transform shadow-lg shadow-black/20">
                                Out of Stock <Sparkles className="w-3" />
                            </span>
                        </div>
                    )}
                    {!outOfStock && (
                        <div className="absolute bottom-2 right-2 z-10">
                            {cartItem ? (
                                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full p-1 shadow-lg border border-white/40 ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); hapticSoft(); updateQuantity(product.id, cartItem.quantity - 1); }}
                                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-red-50 transition-colors text-lg font-bold"
                                    >
                                        -
                                    </button>
                                    <span key={cartItem.quantity} className="text-sm font-bold min-w-[1.5rem] text-center text-neutral-900 animate-pop">
                                        {cartItem.quantity}
                                    </span>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); hapticSoft(); addToCart(product); }}
                                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-lg font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); hapticSoft(); addToCart(product); }}
                                    className="h-9 w-9 rounded-full bg-neutral-900/90 backdrop-blur-sm text-white flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg hover:scale-110 active:scale-95 group/btn"
                                    aria-label="Add to cart"
                                >
                                    <span className="text-xl leading-none mb-0.5 group-hover/btn:rotate-90 transition-transform">+</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col flex-1">
                    <h4 className="font-semibold text-sm mb-0.5 line-clamp-2 text-neutral-800">{product.name}</h4>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-bold text-indigo-600 text-base">QAR {displayPrice.toFixed(2)}</span>
                            {hasDiscount && (
                                <span className="text-[10px] text-neutral-400 line-through">QAR {product.price.toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                </div>
            </NextLink>

            {/* Alternatives Overlay */}
            <AnimatePresence>
                {showAlternatives && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 bg-white rounded-2xl flex flex-col p-3 shadow-2xl border border-indigo-100 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Try these instead</span>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAlternatives(false); }}
                                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                            {loadingAlts ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[9px] text-neutral-400">Finding alternatives...</span>
                                </div>
                            ) : alternatives.length > 0 ? (
                                alternatives.map(alt => (
                                    <div
                                        key={alt.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            hapticSoft();
                                            addToCart(alt);
                                            setShowAlternatives(false);
                                        }}
                                        className="flex items-center gap-2 p-1.5 rounded-xl border border-neutral-50 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer group/alt"
                                    >
                                        <div className="w-10 h-10 bg-neutral-50 rounded-lg overflow-hidden relative flex-shrink-0">
                                            {alt.imageUrl && <Image src={alt.imageUrl} alt={alt.name} fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-neutral-800 line-clamp-1 group-hover/alt:text-indigo-600">{alt.name}</p>
                                            <p className="text-[9px] text-indigo-600 font-black">QAR {alt.price.toFixed(2)}</p>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-sm group-hover/alt:scale-110 transition-transform">
                                            +
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-neutral-400 text-[10px]">No similar items found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

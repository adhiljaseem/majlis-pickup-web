"use client";

import { PackageSearch } from "lucide-react";
import { useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import { useTypesenseSearch } from "../../hooks/useTypesenseSearch";
import { useCart } from "../../context/CartContext";
import { Product } from "../../types";
import { useState as useImageState } from "react";
import { ProductSkeleton } from "../../components/Skeleton";
import { hapticSoft } from "../../lib/haptics";
import NextLink from "next/link";

function ProductImage({ src, alt }: { src: string; alt: string }) {
    const [failed, setFailed] = useImageState(false);
    if (failed) return <div className="w-full h-full flex items-center justify-center text-neutral-300 font-medium text-xs">No Image</div>;
    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setFailed(true)}
        />
    );
}

function ProductCard({ product, branchId }: { product: Product, branchId: string }) {
    const router = useRouter();
    const { addToCart, items, updateQuantity } = useCart();
    const cartItem = items.find(i => i.id === product.id);
    const isSelected = !!cartItem && cartItem.quantity > 0;
    const hasDiscount = product.offerPrice > 0 && product.offerPrice < product.price;
    const displayPrice = hasDiscount ? product.offerPrice : product.price;
    const outOfStock = product.stock <= 0;

    return (
        <div
            onClick={() => router.push(`/${branchId}/product/${product.id}`)}
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
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="bg-neutral-900 text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
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
        </div>
    );
}

export default function BranchHomePage({
    params,
}: {
    params: Promise<{ branchId: string }>;
}) {
    const { branchId } = use(params);
    const { searchQuery } = useCart();
    const { results, loading, error, searchProducts } = useTypesenseSearch(branchId);

    // Initial load
    useEffect(() => {
        searchProducts();
    }, [branchId]);

    // Handle typing search from global context
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            searchProducts(searchQuery);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">


            {/* Hero Banner Area */}
            {!searchQuery && (
                <div className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white p-8 sm:p-10 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 max-w-sm">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider mb-4 border border-white/20">
                            EXPRESS PICKUP
                        </span>
                        <h2 className="text-3xl font-bold mb-3">Ready when you are.</h2>
                        <p className="text-neutral-300 mb-6 text-sm leading-relaxed">
                            Order fresh groceries online. We&apos;ll pack them up so you can simply grab and go.
                        </p>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                    {error}
                </div>
            )}

            {/* Product Grid Area */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-neutral-800">
                    {searchQuery ? `Search Results for "${searchQuery}"` : "Available Products"}
                </h3>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {[...Array(10)].map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {results.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                branchId={branchId}
                            />
                        ))}
                    </div>
                ) : !error && (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-neutral-100 shadow-sm">
                        <PackageSearch className="w-12 h-12 text-neutral-300 mb-4" />
                        <h4 className="text-lg font-bold text-neutral-800">No products found</h4>
                        <p className="text-sm text-neutral-500 mt-1 max-w-xs">{searchQuery ? "Try adjusting your search terms." : "This branch currently has no active inventory."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

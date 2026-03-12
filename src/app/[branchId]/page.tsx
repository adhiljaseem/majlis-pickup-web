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
import { MobileCartSummary } from "../../components/MobileCartSummary";
import Image from "next/image";
import { ProductCard } from "../../components/ProductCard";
import { CategoryFilter } from "../../components/CategoryFilter";


export default function BranchHomePage({
    params,
}: {
    params: Promise<{ branchId: string }>;
}) {
    const { branchId } = use(params);
    const { searchQuery } = useCart();
    const { results, loading, error, searchProducts, hasMore } = useTypesenseSearch(branchId);
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        searchProducts(searchQuery, false, selectedCategory || undefined);
        // Load recent products for "Buy It Again"
        const saved = localStorage.getItem("pickup_recent_products");
        if (saved) {
            try {
                setRecentProducts(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent products", e);
            }
        }
    }, [branchId, selectedCategory]);

    // Handle typing search from global context
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            searchProducts(searchQuery, false, selectedCategory || undefined);
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

            {/* Category Filter */}
            <CategoryFilter 
                branchId={branchId}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
            />

            {/* Product Grid Area */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-neutral-800">
                    {searchQuery ? `Search Results for "${searchQuery}"` : "Available Products"}
                </h3>

                {/* Buy It Again Section */}
                {!searchQuery && recentProducts.length > 0 && (
                    <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                                <span className="text-indigo-600">🔄</span> Buy It Again
                            </h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                            {recentProducts.map((product) => (
                                <div key={product.id} className="w-[44vw] sm:w-[220px] flex-shrink-0 snap-start">
                                    <ProductCard
                                        product={product}
                                        branchId={branchId}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && results.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {[...Array(10)].map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            {results.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    branchId={branchId}
                                />
                            ))}
                        </div>

                        {/* Pagination / Show More */}
                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={() => searchProducts(searchQuery, true, selectedCategory || undefined)}
                                    disabled={loading}
                                    className="px-8 py-3 bg-white border border-neutral-200 rounded-full font-bold text-neutral-700 hover:bg-neutral-50 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Show More Products"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : !error && (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-neutral-100 shadow-sm">
                        <PackageSearch className="w-12 h-12 text-neutral-300 mb-4" />
                        <h4 className="text-lg font-bold text-neutral-800">No products found</h4>
                        <p className="text-sm text-neutral-500 mt-1 max-w-xs">{searchQuery ? "Try adjusting your search terms." : "This branch currently has no active inventory."}</p>
                    </div>
                )}
            </div>

            <MobileCartSummary />
        </div>
    );
}

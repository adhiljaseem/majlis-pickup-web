"use client";

import { use, useEffect } from "react";
import { Heart, PackageSearch } from "lucide-react";
import { ProductCard } from "../../../components/ProductCard";
import { useWishlist } from "../../../context/WishlistContext";
import NextLink from "next/link";
import { MobileCartSummary } from "../../../components/MobileCartSummary";

export default function WishlistPage({
    params,
}: {
    params: Promise<{ branchId: string }>;
}) {
    const { branchId } = use(params);
    const { wishlist } = useWishlist();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm border border-pink-100">
                    <Heart className="w-6 h-6 fill-pink-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Your Wishlist</h1>
                    <p className="text-sm text-neutral-500">
                        {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                    </p>
                </div>
            </div>

            {/* Content Area */}
            {wishlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 pb-20">
                    {wishlist.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            branchId={branchId}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-neutral-100 shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                        <Heart className="w-10 h-10 text-neutral-300" />
                    </div>
                    <h4 className="text-xl font-bold text-neutral-800 mb-2">Your wishlist is empty</h4>
                    <p className="text-sm text-neutral-500 max-w-sm mb-8">
                        Save your favorite items here while you shop to easily find them later.
                    </p>
                    <NextLink
                        href={`/${branchId}`}
                        className="px-8 py-3 bg-neutral-900 text-white rounded-full font-bold hover:bg-indigo-600 transition-colors shadow-lg active:scale-95"
                    >
                        Start Browsing
                    </NextLink>
                </div>
            )}

            <MobileCartSummary />
        </div>
    );
}

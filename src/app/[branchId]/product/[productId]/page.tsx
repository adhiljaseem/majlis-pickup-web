"use client";

import { use, useEffect, useState } from "react";
import { Link as ReactLink, ShoppingBag, ArrowLeft, Plus, Minus, Share2, Heart } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "../../../../context/CartContext";
import { useWishlist } from "../../../../context/WishlistContext";
import { typesenseClient } from "../../../../lib/typesense";
import { resolveForBranch } from "../../../../hooks/useTypesenseSearch";
import { Product, TypesenseProduct } from "../../../../types";
import { hapticSoft } from "../../../../lib/haptics";
import NextLink from "next/link";
import Image from "next/image";
import { ProductCard } from "../../../../components/ProductCard";

export default function ProductDetailsPage({
    params: paramsPromise,
}: {
    params: Promise<{ branchId: string; productId: string }>;
}) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { items, addToCart, updateQuantity } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

    const cartItem = items.find(i => i.id === product?.id);

    useEffect(() => {
        async function fetchProduct() {
            setLoading(true);
            try {
                // Use search with filter since the API key is search-only
                // and does not permit direct document retrieval
                const searchRes = await typesenseClient
                    .collections("products")
                    .documents()
                    .search({
                        q: "*",
                        query_by: "name",
                        filter_by: `id:=[${params.productId}]`,
                        per_page: 1,
                    });

                const hits = searchRes.hits || [];
                const rawDoc = hits[0]?.document as unknown as TypesenseProduct | undefined;

                console.log("Fetched doc:", rawDoc);

                if (!rawDoc) {
                    setProduct(null);
                    setLoading(false);
                    return;
                }

                const resolved = resolveForBranch(rawDoc, params.branchId);
                console.log("Resolved:", resolved);
                setProduct(resolved);

                if (resolved?.category) {
                    const relatedRes = await typesenseClient
                        .collections("products")
                        .documents()
                        .search({
                            q: "*",
                            query_by: "name",
                            filter_by: `category:=[${resolved.category}]`,
                            per_page: 8,
                        });

                    const relatedDocs = relatedRes.hits?.map(h => h.document as unknown as TypesenseProduct) || [];
                    const resolvedRelated = relatedDocs
                        .map(d => resolveForBranch(d, params.branchId))
                        .filter((p): p is Product => p !== null && p.id !== resolved.id);

                    setRelatedProducts(resolvedRelated);
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [params.productId, params.branchId]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product?.name,
                url: window.location.href,
            });
        }
    };

    if (loading) {
        return (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8">
                <div className="h-10 w-32 bg-neutral-100 rounded-lg animate-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-square bg-neutral-100 rounded-3xl animate-shimmer" />
                    <div className="space-y-4">
                        <div className="h-8 w-3/4 bg-neutral-100 rounded-lg animate-shimmer" />
                        <div className="h-6 w-1/4 bg-neutral-100 rounded-lg animate-shimmer" />
                        <div className="h-24 w-full bg-neutral-100 rounded-lg animate-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h2 className="text-2xl font-bold text-neutral-800">Product not found</h2>
                <p className="text-neutral-500 mb-6">This item might be out of stock or unavailable.</p>
                <NextLink href={`/${params.branchId}`} className="text-indigo-600 font-bold hover:underline">
                    Back to Shop
                </NextLink>
            </div>
        );
    }

    const hasDiscount = product.offerPrice > 0 && product.offerPrice < product.price;
    const isWishlisted = isInWishlist(product.id);
    const outOfStock = product.stock <= 0;

    return (
        <div className="max-w-5xl mx-auto pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-bold text-sm transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            hapticSoft();
                            isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product);
                        }}
                        className="p-2 text-neutral-400 hover:text-pink-500 transition-colors bg-white rounded-full shadow-sm hover:shadow-md border border-neutral-100"
                    >
                        <Heart className={`w-5 h-5 ${isWishlisted ? "fill-pink-500 text-pink-500" : ""}`} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                {/* Product Image Gallery */}
                <div className="relative aspect-square bg-neutral-50 rounded-[2.5rem] overflow-hidden border border-neutral-100 p-8 flex items-center justify-center">
                    {product.imageUrl ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain hover:scale-105 transition-transform duration-700 p-8"
                        />
                    ) : (
                        <div className="text-neutral-300 font-bold">No Image</div>
                    )}
                    {hasDiscount && (
                        <div className="absolute top-8 left-8 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl tracking-wider">
                            OFFER
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    <div className="mb-8">
                        {product.category && (
                            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">
                                {product.category}
                            </span>
                        )}
                        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 mb-4 leading-tight">
                            {product.name}
                        </h1>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-indigo-600">QAR {(product.offerPrice || product.price).toFixed(2)}</span>
                            {hasDiscount && (
                                <span className="text-lg text-neutral-400 line-through">QAR {product.price.toFixed(2)}</span>
                            )}
                        </div>
                    </div>

                    {product.description && (
                        <div className="mb-10">
                            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">About this item</h3>
                            <p className="text-neutral-600 leading-relaxed whitespace-pre-line text-base">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Cart Controls */}
                    <div className="flex flex-col gap-4 mt-8 sm:mt-auto">
                        <div className="flex items-center gap-6 p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
                            {cartItem ? (
                                <div className="flex items-center gap-4 bg-white rounded-2xl p-2 shadow-sm border border-neutral-100 flex-1 justify-center">
                                    <button
                                        onClick={() => { hapticSoft(); updateQuantity(product.id, cartItem.quantity - 1); }}
                                        className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <span className="text-xl font-black w-10 text-center">{cartItem.quantity}</span>
                                    <button
                                        onClick={() => { hapticSoft(); updateQuantity(product.id, cartItem.quantity + 1); }}
                                        disabled={outOfStock || cartItem.quantity >= (product.maxPurchase || 999) || cartItem.quantity >= product.stock}
                                        className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { hapticSoft(); addToCart(product); }}
                                    className="flex-1 px-8 py-5 bg-neutral-900 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-neutral-900/10 active:scale-95"
                                >
                                    <ShoppingBag className="w-6 h-6" />
                                    Add to Cart
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="border-t border-neutral-100 pt-12">
                    <h2 className="text-xl font-black text-neutral-900 mb-8 uppercase tracking-wider flex items-center gap-3">
                        <div className="h-1 w-6 bg-indigo-500" />
                        Related Products
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        {relatedProducts.map(p => (
                            <ProductCard key={p.id} product={p} branchId={params.branchId} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

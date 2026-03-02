"use client";

import { useCart } from "../../../context/CartContext";
import { ArrowLeft, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { typesenseClient } from "../../../lib/typesense";
import { resolveForBranch } from "../../../hooks/useTypesenseSearch";
import { Product, TypesenseProduct } from "../../../types";
import { ProductCard } from "../../../components/ProductCard";

export default function CartPage({ params }: { params: Promise<{ branchId: string }> }) {
    const { branchId } = use(params);
    const { items, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [suggestions, setSuggestions] = useState<Product[]>([]);

    useEffect(() => {
        async function fetchSuggestions() {
            try {
                // Fetch some low-price small snacks/items
                const res = await typesenseClient
                    .collections("products")
                    .documents()
                    .search({
                        q: "*",
                        query_by: "name",
                        filter_by: "branchPrices.*.price:<20",
                        per_page: 8,
                    });

                const docs = res.hits?.map(h => h.document as unknown as TypesenseProduct) || [];
                const resolved = docs
                    .map(d => resolveForBranch(d, branchId))
                    .filter((p): p is Product => p !== null && !items.find(i => i.id === p.id))
                    .slice(0, 4);

                setSuggestions(resolved);
            } catch (err) {
                console.error("Failed to fetch upsell suggestions:", err);
            }
        }
        fetchSuggestions();
    }, [branchId, items]);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
                <p className="text-neutral-500 mb-8 max-w-sm">Looks like you haven&apos;t added anything to your pickup order yet.</p>
                <Link
                    href={`/${branchId}`}
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href={`/${branchId}`}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Review Order</h1>
            </div>

            <div className="bg-white rounded-3xl p-2 sm:p-6 shadow-sm border border-neutral-100">
                <div className="divide-y divide-neutral-100">
                    {items.map((item) => (
                        <div key={item.id} className="py-6 flex gap-4 sm:gap-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-neutral-50 rounded-2xl overflow-hidden relative border border-neutral-100 flex-shrink-0 flex items-center justify-center">
                                {item.imageUrl ? (
                                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                ) : (
                                    <span className="text-xs text-neutral-400 text-center px-2">No Image</span>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 justify-center">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-bold text-neutral-900 text-sm sm:text-base">{item.name}</h3>
                                        <p className="text-neutral-500 text-xs sm:text-sm mt-1">{item.category}</p>
                                    </div>
                                    <div>
                                        {item.offerPrice > 0 && item.offerPrice < item.price ? (
                                            <div className="flex flex-col items-end">
                                                <p className="font-bold text-indigo-600">QAR {(item.offerPrice * item.quantity).toFixed(2)}</p>
                                                <p className="text-[10px] text-neutral-400 line-through">QAR {(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ) : (
                                            <p className="font-bold text-indigo-600">QAR {(item.price * item.quantity).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4">
                                    <div className="flex items-center gap-3 bg-neutral-100/80 rounded-full py-1.5 px-2 border border-neutral-200/50">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:text-indigo-600"
                                        >
                                            -
                                        </button>
                                        <span className="min-w-[1.5rem] text-center font-semibold text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:text-indigo-600"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors bg-red-50 hover:bg-red-100 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upselling Section */}
            {suggestions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="text-indigo-600">🛍️</span> Complete Your Order
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {suggestions.map(product => (
                            <ProductCard key={product.id} product={product} branchId={branchId} />
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="space-y-3 text-sm mb-6 pb-6 border-b border-neutral-800">
                    <div className="flex justify-between text-neutral-400">
                        <span>Subtotal ({itemCount} items)</span>
                        <span>QAR {cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                        <span>Service Fee</span>
                        <span>QAR 0.00</span>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-neutral-400 text-sm mb-1">Total</p>
                        <p className="text-3xl font-bold">QAR {cartTotal.toFixed(2)}</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsCheckingOut(true);
                        router.push(`/${branchId}/checkout`);
                    }}
                    disabled={isCheckingOut}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-400 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    {isCheckingOut ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Preparing Checkout...</>
                    ) : (
                        "Proceed to Checkout"
                    )}
                </button>
            </div>
        </div>
    );
}

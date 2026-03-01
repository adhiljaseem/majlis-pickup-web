"use client";

import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useParams } from "next/navigation";

export function MobileCartSummary() {
    const { itemCount, cartTotal } = useCart();
    const params = useParams();
    const branchId = params?.branchId as string;

    if (itemCount === 0 || !branchId) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 sm:hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <Link
                href={`/${branchId}/cart`}
                className="bg-neutral-900 border border-white/10 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between active:scale-95 transition-transform"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <ShoppingBag className="w-6 h-6 text-indigo-400" />
                        <span className="absolute -top-2 -right-2 bg-white text-neutral-900 text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center">
                            {itemCount}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider leading-none">View Cart</span>
                        <span className="font-bold text-sm">QAR {cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm bg-white/5 py-2 px-3 rounded-xl border border-white/5">
                    Checkout
                    <ArrowRight className="w-4 h-4" />
                </div>
            </Link>
        </div>
    );
}

"use client";

import { ShoppingBag, Store, PackageSearch, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ReactNode, use, useState, useEffect } from "react";
import { hapticSoft } from "../../lib/haptics";
import { PWAInstallPrompt } from "../../components/PWAInstallPrompt";
import { useCart } from "../../context/CartContext";
import { usePathname } from "next/navigation";
import { SearchAutocomplete } from "../../components/SearchAutocomplete";
import { MobileCartSummary } from "../../components/MobileCartSummary";
import { motion, AnimatePresence } from "framer-motion";

export default function BranchLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ branchId: string }>;
}) {
    const { branchId } = use(params);
    const { itemCount, searchQuery, setSearchQuery, lastAddedTimestamp } = useCart();
    const pathname = usePathname();
    const [lastOrder, setLastOrder] = useState<{ id: string, phone: string } | null>(null);

    const isHome = pathname === `/${branchId}`;

    useEffect(() => {
        const id = localStorage.getItem("pickup_last_order_id");
        const phone = localStorage.getItem("pickup_phone");
        if (id && phone) {
            setLastOrder({ id, phone });
        }
    }, [pathname]); // Refresh when navigating

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-500/30">
            {/* Sticky Premium Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 supports-[backdrop-filter]:bg-white/60 border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">

                    {/* Logo Section */}
                    <Link
                        href={`/${branchId}`}
                        className="flex items-center shrink-0 group"
                    >
                        <div className="h-10 sm:h-12 w-auto flex items-center justify-center">
                            <Image
                                src="/logo.png"
                                alt="Majlis Hypermarket"
                                width={180}
                                height={48}
                                className="h-full w-auto object-contain transition-transform group-hover:scale-105"
                                unoptimized
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                                <Store className="w-5 h-5" />
                            </div>
                        </div>
                    </Link>

                    {/* Header Search Bar */}
                    <div className="flex-1 max-w-2xl hidden sm:block mx-4">
                        {(isHome || pathname.includes('/product/')) && (
                            <SearchAutocomplete
                                branchId={branchId}
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        )}
                    </div>

                    {/* Track Order Icon */}
                    <Link
                        href={lastOrder
                            ? `/${branchId}/track?orderId=${lastOrder.id}&phone=${encodeURIComponent(lastOrder.phone)}`
                            : `/${branchId}/track`
                        }
                        className="p-2 text-neutral-600 hover:text-indigo-600 transition-colors hover:scale-105"
                        title="Track Order"
                    >
                        <PackageSearch className="w-6 h-6 sm:w-7 sm:h-7" />
                    </Link>

                    {/* Wishlist Icon */}
                    <Link
                        href={`/${branchId}/wishlist`}
                        className="p-2 text-neutral-600 hover:text-pink-500 transition-colors hover:scale-105"
                        title="Wishlist"
                    >
                        <Heart className="w-6 h-6 sm:w-7 sm:h-7" />
                    </Link>

                    {/* Cart Icon with Animation */}
                    <Link
                        href={`/${branchId}/cart`}
                        className="relative p-2 text-neutral-600 hover:text-indigo-600 transition-colors hover:scale-105"
                    >
                        <motion.div
                            key={lastAddedTimestamp}
                            initial={lastAddedTimestamp > 0 ? { scale: 1.5, rotate: 15 } : {}}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                        </motion.div>
                        <AnimatePresence mode="popLayout">
                            {itemCount > 0 && (
                                <motion.span
                                    key={itemCount}
                                    initial={{ y: -12, opacity: 0, scale: 0.5 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: 12, opacity: 0, scale: 0.5 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                    className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] sm:text-[11px] font-black w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white overflow-hidden"
                                >
                                    {itemCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>

                {/* Mobile Search Bar */}
                {(isHome || pathname.includes('/product/')) && (
                    <div className="sm:hidden px-4 pb-3">
                        <SearchAutocomplete
                            branchId={branchId}
                            value={searchQuery}
                            onChange={setSearchQuery}
                            mobile
                        />
                    </div>
                )}
                <PWAInstallPrompt />
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 pb-32 sm:pb-8">
                {children}
            </main>
        </div>
    );
}

"use client";

import { ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ReactNode, use } from "react";
import { useCart } from "../../context/CartContext";
import { usePathname } from "next/navigation";
import { MobileCartSummary } from "../../components/MobileCartSummary";
import { SearchAutocomplete } from "../../components/SearchAutocomplete";

export default function BranchLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ branchId: string }>;
}) {
    const { branchId } = use(params);
    const { itemCount, searchQuery, setSearchQuery } = useCart();
    const pathname = usePathname();

    const isHome = pathname === `/${branchId}`;

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

                    {/* Header Search Bar (Only shown on home page) */}
                    {isHome && (
                        <div className="flex-1 max-w-2xl hidden sm:block mx-4">
                            <SearchAutocomplete
                                branchId={branchId}
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </div>
                    )}

                    {/* Cart Icon */}
                    <Link href={`/${branchId}/cart`} className="relative shrink-0 p-2 transition-transform hover:scale-105">
                        <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-700" />
                        {itemCount > 0 && (
                            <span className="absolute top-0 right-0 h-5 w-5 sm:h-5 sm:w-5 rounded-full bg-red-500 border-2 border-white text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                                {itemCount > 99 ? '99+' : itemCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Mobile Search Bar (Below header on small screens) */}
                {isHome && (
                    <div className="sm:hidden px-4 pb-3">
                        <SearchAutocomplete
                            branchId={branchId}
                            value={searchQuery}
                            onChange={setSearchQuery}
                            mobile
                        />
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 pb-32 sm:pb-8">
                {children}
            </main>

            <MobileCartSummary />
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { db, ensureAuth } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { MapPin, ArrowRight, Store, Truck, Clock, ShoppingBag } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  coordinates?: string;
  isActive?: boolean;
  isPickupEnabled?: boolean;
  openingTime?: string;
  closingTime?: string;
}

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualId, setManualId] = useState("");

  useEffect(() => {
    async function fetchBranches() {
      try {
        await ensureAuth();
        const snap = await getDocs(collection(db, "branch"));
        const list: Branch[] = snap.docs
          .map((d) => ({
            id: d.id,
            name: d.data().name || d.id,
            coordinates: d.data().coordinates,
            isActive: d.data().isActive,
            isPickupEnabled: d.data().isPickupEnabled,
            openingTime: d.data().openingTime,
            closingTime: d.data().closingTime,
          }))
          .filter((b) => b.isActive !== false && b.isPickupEnabled !== false);
        setBranches(list);
      } catch (err) {
        console.error("Could not load branches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 supports-[backdrop-filter]:bg-white/60 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 h-16 sm:h-20 flex items-center gap-4">
          <div className="h-10 sm:h-12 w-auto flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Majlis Hypermarket"
              className="h-full w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-15 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500 rounded-full blur-[100px] opacity-15 translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400 rounded-full blur-[80px] opacity-10 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider mb-6 backdrop-blur-sm">
            <Truck className="w-3.5 h-3.5" />
            EXPRESS PICKUP SERVICE
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
            Order Online.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Pick Up Instantly.
            </span>
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-base sm:text-lg leading-relaxed mb-10">
            Browse products from your nearest branch. We prepare your order so you can simply drive up and grab it.
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 text-sm">
            <div className="flex items-center gap-2 text-neutral-300">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Ready in minutes</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              <span>1000+ products</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Multiple branches</span>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Selection */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Select Your Branch</h2>
          <p className="text-neutral-500 text-sm">Choose a branch to browse available products and place your pickup order.</p>
        </div>

        {/* Branch Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : branches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {branches.map((branch) => (
              <Link
                key={branch.id}
                href={`/${branch.id}`}
                className="group relative bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-tr-2xl rounded-bl-[4rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-neutral-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {branch.name}
                  </h3>
                  {branch.openingTime && branch.closingTime && (
                    <p className="text-sm text-neutral-500 flex items-center gap-1.5 mb-3">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      {branch.openingTime} &ndash; {branch.closingTime}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Browse Products
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Fallback: Manual branch ID entry */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20">
                <Store className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-neutral-900 mb-2">Enter Branch ID</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Enter the branch code shared with you to start shopping.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualId.trim()) {
                    window.location.href = `/${manualId.trim()}`;
                  }
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. BazFuIEXAHazmMMxokOv"
                  className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  Go
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} Majlis Hypermarket. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

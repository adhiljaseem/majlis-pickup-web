"use client";

import { useEffect, useState } from "react";
import { db, ensureAuth } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { MapPin, ArrowRight, Store, Truck, Clock, ShoppingBag, Navigation, Loader2 } from "lucide-react";
import { getUserLocation, parseCoordinates, haversineDistance, Coordinates } from "../lib/geo";
import { motion, AnimatePresence } from "framer-motion";

interface Branch {
  id: string;
  name: string;
  coordinates?: string;
  isActive?: boolean;
  isPickupEnabled?: boolean;
  openingTime?: string;
  closingTime?: string;
  distance?: number; // km from user
  activeOrders?: number; // pending orders count
}

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationState, setLocationState] = useState<"detecting" | "found" | "denied" | "idle">("idle");
  const [nearestBranch, setNearestBranch] = useState<Branch | null>(null);
  const [manualId, setManualId] = useState("");
  const [busyData, setBusyData] = useState<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      try {
        await ensureAuth();

        // Fetch branches
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

        // Detect location
        setLocationState("detecting");
        const userLoc = await getUserLocation();

        if (userLoc) {
          // Calculate distances
          const withDistances = list.map(b => {
            const coords = b.coordinates ? parseCoordinates(b.coordinates) : null;
            return {
              ...b,
              distance: coords ? haversineDistance(userLoc.lat, userLoc.lng, coords.lat, coords.lng) : Infinity,
            };
          }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

          setBranches(withDistances);
          setNearestBranch(withDistances[0] || null);
          setLocationState("found");
        } else {
          setBranches(list);
          setLocationState("denied");
        }

        // Fetch busy data for all branches
        try {
          const q = query(
            collection(db, "orders"),
            where("status", "in", ["pending", "confirmed", "preparing_order"])
          );
          const orderSnap = await getDocs(q);
          const counts: Record<string, number> = {};
          orderSnap.docs.forEach(d => {
            const bid = d.data().branchId;
            counts[bid] = (counts[bid] || 0) + 1;
          });
          setBusyData(counts);
        } catch (e) {
          console.error("Failed to fetch busy data", e);
        }
      } catch (err) {
        console.error("Could not load branches:", err);
        setLocationState("denied");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const formatDistance = (km?: number) => {
    if (!km || km === Infinity) return null;
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)} km away`;
  };

  const getBusyLabel = (branchId: string) => {
    const count = busyData[branchId] || 0;
    if (count === 0) return { text: "Not busy", color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" };
    if (count <= 3) return { text: "Moderate", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    return { text: "Busy now", color: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" };
  };

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
          {locationState === "found" && nearestBranch && (
            <div className="ml-auto flex items-center gap-2 text-xs text-neutral-500 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <Navigation className="w-3 h-3 text-green-600" />
              <span className="font-semibold text-green-700">📍 Location detected</span>
            </div>
          )}
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

        {/* Location Detection State */}
        {loading || locationState === "detecting" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
                <Navigation className="w-8 h-8 text-indigo-600 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div className="absolute -inset-4 rounded-full border-2 border-indigo-200 animate-ping opacity-30" />
            </div>
            <p className="text-neutral-600 font-semibold">Finding your nearest branch...</p>
            <p className="text-neutral-400 text-sm">Please allow location access for the best experience</p>
          </div>
        ) : (
          <>
            {/* Nearest Branch Card (Prominent) */}
            <AnimatePresence>
              {nearestBranch && locationState === "found" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">📍 Your Nearest Branch</h2>
                    <p className="text-neutral-500 text-sm">Based on your current location</p>
                  </div>

                  <Link
                    href={`/${nearestBranch.id}`}
                    className="block group relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 flex items-center gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                            Closest to you
                          </span>
                        </div>
                        <h3 className="font-black text-xl sm:text-2xl mb-1 truncate">
                          {nearestBranch.name}
                        </h3>
                        <div className="flex items-center gap-4 text-white/80 text-sm">
                          {formatDistance(nearestBranch.distance) && (
                            <span className="flex items-center gap-1.5">
                              <Navigation className="w-3.5 h-3.5" />
                              {formatDistance(nearestBranch.distance)}
                            </span>
                          )}
                          {nearestBranch.openingTime && nearestBranch.closingTime && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {nearestBranch.openingTime} – {nearestBranch.closingTime}
                            </span>
                          )}
                        </div>
                        {/* Busy Status */}
                        {(() => {
                          const busy = getBusyLabel(nearestBranch.id);
                          return (
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${busy.color}`}>
                              <span className={`w-2 h-2 rounded-full ${busy.dot} animate-pulse`} />
                              {busy.text}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Denied Banner */}
            {locationState === "denied" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Enable location for a better experience</p>
                  <p className="text-amber-600 text-xs">We&apos;ll find the nearest branch and show you accurate distances.</p>
                </div>
              </motion.div>
            )}

            {/* All Branches */}
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                {nearestBranch ? "Other Branches" : "Select Your Branch"}
              </h2>
              <p className="text-neutral-500 text-sm">
                {nearestBranch
                  ? "Or choose a different branch if you prefer"
                  : "Choose a branch to browse available products and place your pickup order."
                }
              </p>
            </div>

            {branches.filter(b => b.id !== nearestBranch?.id).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {branches.filter(b => b.id !== nearestBranch?.id).map((branch, idx) => (
                  <motion.div
                    key={branch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link
                      href={`/${branch.id}`}
                      className="group relative bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1 h-full block"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-tr-2xl rounded-bl-[4rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Store className="w-6 h-6 text-white" />
                          </div>
                          {formatDistance(branch.distance) && (
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                              📍 {formatDistance(branch.distance)}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-neutral-900 mb-1 group-hover:text-indigo-600 transition-colors">
                          {branch.name}
                        </h3>
                        {branch.openingTime && branch.closingTime && (
                          <p className="text-sm text-neutral-500 flex items-center gap-1.5 mb-2">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            {branch.openingTime} &ndash; {branch.closingTime}
                          </p>
                        )}
                        {/* Busy Badge */}
                        {(() => {
                          const busy = getBusyLabel(branch.id);
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${busy.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${busy.dot}`} />
                              {busy.text}
                            </div>
                          );
                        })()}
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Browse Products
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : !nearestBranch ? (
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
            ) : null}
          </>
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

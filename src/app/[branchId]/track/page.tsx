"use client";

import { use, useEffect, useState } from "react";
import { db, ensureAuth } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, Car, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";


// The ordered list of statuses as provided by the user
const STATUS_STEPS = [
    "Pending",
    "Confirmed",
    "Preparing Order",
    "Ready for Pickup",
    "Picked Up"
];

// Helper to get step index
const getStepIndex = (status: string) => {
    // If status is "confirmed" (old lowercase), default it to 1
    if (status === "confirmed") return 1;
    const index = STATUS_STEPS.indexOf(status);
    return index === -1 ? 0 : index;
};

interface OrderData {
    id: string;
    customerName?: string;
    totalAmount?: number;
    carNumber?: string;
    status: string;
    userMobile?: string;
}

export default function TrackOrderPage({ params }: { params: Promise<{ branchId: string }> }) {
    const { branchId } = use(params);

    const [orderId, setOrderId] = useState("");
    const [phone, setPhone] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderData | null>(null);

    // Clean up listener when unmounting or searching again
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderId || !phone) {
            setError("Please enter both your Order ID and Phone Number.");
            return;
        }

        setError(null);
        setLoading(true);
        setOrder(null);

        try {
            await ensureAuth();

            // Set up a real-time listener for the specific order document
            const orderRef = doc(db, "orders", orderId.trim());

            onSnapshot(orderRef, (docSnap) => {
                setLoading(false);

                if (!docSnap.exists()) {
                    setError("Order not found. Please check your Order ID.");
                    setOrder(null);
                    return;
                }

                const data = docSnap.data();

                // Simple security check: phone number must match (strip spaces just in case)
                const dbPhone = (data.userMobile || "").replace(/\s+/g, "");
                const inputPhone = phone.replace(/\s+/g, "");

                // Check if the DB phone ends with the input phone to allow missing country codes
                if (dbPhone === inputPhone || dbPhone.endsWith(inputPhone) || inputPhone.endsWith(dbPhone)) {
                    setOrder({ id: docSnap.id, ...data } as OrderData);
                    setError(null);
                } else {
                    setError("Phone number does not match our records for this order.");
                    setOrder(null);
                }
            }, (err: { code?: string; message: string }) => {
                console.error("Firestore Listen Error:", err);
                if (err.code === 'permission-denied') {
                    setError("SECURITY ERROR: Database rules prevent reading this order. Please update Firestore rules to allow read access to the 'orders' collection.");
                } else {
                    setError("Could not retrieve tracking details. Please try again.");
                }
                setLoading(false);
            });

        } catch (err: unknown) {
            console.error("Setup Error:", err);
            const errorObj = err as { code?: string };
            if (errorObj.code === 'permission-denied') {
                setError("SECURITY ERROR: Database rules prevent reading this order. Please update Firestore rules.");
            } else {
                setError("Something went wrong. Please check your connection.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-center gap-4">
                <Link
                    href={`/${branchId}`}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Track Your Order</h1>
            </div>

            {/* Tracking Search Form */}
            {!order && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm">
                    <p className="text-neutral-500 text-sm mb-6">Enter your details below to see the live status of your Web Pickup order.</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Order ID</label>
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="e.g. 10051"
                                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 12345678"
                                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !orderId || !phone}
                            className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-colors shadow-sm"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Track Order"
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Live Tracking Result */}
            {order && (
                <div className="space-y-6">
                    {/* Header Summary */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/3" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-white/80 text-sm font-medium mb-1">Order #{order.id}</p>
                                    <h2 className="text-2xl font-bold">{order.customerName || "Customer"}</h2>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total</p>
                                    <p className="font-bold">QAR {order.totalAmount?.toFixed(2) || "0.00"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-white/90 text-sm bg-black/20 rounded-xl px-4 py-3 w-fit">
                                <Car className="w-4 h-4" />
                                <span className="font-medium">{order.carNumber || "No car specified"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200">
                        <h3 className="font-bold text-lg mb-6 flex items-center justify-between">
                            Order Status
                            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
                                Live
                            </span>
                        </h3>

                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-neutral-100 rounded-full" />

                            <div className="space-y-6">
                                {STATUS_STEPS.map((stepLabel, index) => {
                                    const currentIdx = getStepIndex(order.status);
                                    const isCompleted = index < currentIdx;
                                    const isCurrent = index === currentIdx;
                                    const isPending = index > currentIdx;

                                    return (
                                        <div key={stepLabel} className="relative flex gap-4">
                                            {/* Status Icon */}
                                            <div className="relative z-10 bg-white pt-1 pb-1">
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500
                                                    ${isCompleted ? 'bg-indigo-500 text-white' : ''}
                                                    ${isCurrent ? 'bg-indigo-600 text-white shadow-indigo-500/30' : ''}
                                                    ${isPending ? 'bg-neutral-100 text-neutral-400 border-neutral-50' : ''}
                                                `}>
                                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                                        isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                            <div className="w-2 h-2 rounded-full bg-current" />}
                                                </div>
                                            </div>

                                            {/* Status Text */}
                                            <div className="pt-2 flex-1 pb-2">
                                                <p className={`font-bold text-lg tracking-tight transition-colors duration-500
                                                    ${isCompleted ? 'text-neutral-900' : ''}
                                                    ${isCurrent ? 'text-indigo-600' : ''}
                                                    ${isPending ? 'text-neutral-400' : ''}
                                                `}>
                                                    {stepLabel}
                                                </p>
                                                {isCurrent && (
                                                    <p className="text-sm text-neutral-500 mt-1">
                                                        {index === 0 && "We have received your order request."}
                                                        {index === 1 && "Your order is confirmed."}
                                                        {index === 2 && "Our team is packing your items now."}
                                                        {index === 3 && "Drive to the branch, we are ready!"}
                                                        {index === 4 && "Order completed. Thank you!"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setOrder(null)}
                        className="w-full text-center py-4 text-neutral-500 font-medium hover:text-neutral-900 transition-colors"
                    >
                        Track another order
                    </button>
                </div>
            )}
        </div>
    );
}

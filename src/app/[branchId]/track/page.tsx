"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, use, Suspense } from "react";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2, ArrowLeft, Package, CheckCircle, CheckCircle2, Car, XCircle } from "lucide-react";
import Link from "next/link";

interface OrderData {
    status: string;
    customerName: string;
    userMobile: string;
    carNumber: string;
    items: any[];
    totalAmount: number;
}

const STEPS = [
    { id: "confirmed", label: "Order Confirmed", icon: CheckCircle2 },
    { id: "preparing", label: "Preparing Order", icon: Package },
    { id: "ready_for_pickup", label: "Ready for Pickup", icon: Car },
    { id: "completed", label: "Completed", icon: CheckCircle }
];

function TrackContent({ branchId }: { branchId: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const urlOrderId = searchParams.get("orderId") || "";
    const urlPhone = searchParams.get("phone") || "";

    const [orderId, setOrderId] = useState(urlOrderId);
    const [phone, setPhone] = useState(urlPhone);

    const [isTracking, setIsTracking] = useState(!!urlOrderId && !!urlPhone);
    const [loading, setLoading] = useState(!!urlOrderId && !!urlPhone);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderData | null>(null);

    useEffect(() => {
        if (!isTracking || !orderId || !phone) return;

        setLoading(true);
        setError(null);

        const orderRef = doc(db, "orders", orderId);

        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
            if (!docSnap.exists()) {
                setError("Order not found. Please check your Order ID.");
                setLoading(false);
                setOrder(null);
                return;
            }

            const data = docSnap.data() as OrderData;

            // Validate phone number for basic security
            if (data.userMobile !== phone) {
                setError("Mobile number does not match the order records.");
                setLoading(false);
                setOrder(null);
                return;
            }

            setOrder(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching order:", err);
            setError("Unable to track order right now.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isTracking, orderId, phone]);

    const handleStartTracking = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !phone.trim()) {
            setError("Please provide both Order ID and Mobile Number");
            return;
        }

        // Update URL to support sharing/refreshing
        router.replace(`/${branchId}/track?orderId=${orderId}&phone=${encodeURIComponent(phone)}`);
        setIsTracking(true);
    };

    if (!isTracking) {
        return (
            <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${branchId}`}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Track Order</h1>
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100">
                    <p className="text-neutral-500 mb-6">Enter your details to track your order in real-time.</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleStartTracking} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Order ID</label>
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="e.g. 10001"
                                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-bold text-neutral-900 placeholder:font-normal placeholder:text-neutral-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Mobile Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 33123456"
                                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-bold text-neutral-900 placeholder:font-normal placeholder:text-neutral-400"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/20 mt-4"
                        >
                            Track Now
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-500">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-neutral-500 font-medium">Locating your order...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-md mx-auto py-20 px-4 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Order Not Found</h2>
                <p className="text-neutral-500 mb-8 max-w-sm mx-auto">{error}</p>
                <button
                    onClick={() => setIsTracking(false)}
                    className="bg-neutral-900 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-neutral-800 transition-colors shadow-xl"
                >
                    Try Another Order
                </button>
            </div>
        );
    }

    const currentStepIndex = STEPS.findIndex(s => s.id === order.status);
    const isCancelled = order.status === "cancelled";

    return (
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href={`/${branchId}`}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Track Order</h1>
            </div>

            {/* Order Header */}
            <div className="bg-indigo-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-indigo-200 text-sm font-medium mb-1">Order Number</p>
                            <p className="text-3xl font-black">{orderId}</p>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                            <Car className="w-4 h-4 text-indigo-200" />
                            <span className="font-bold text-sm tracking-wide">{order.carNumber}</span>
                        </div>
                    </div>

                    <p className="text-indigo-100 font-medium">Customer: <span className="text-white font-bold">{order.customerName}</span></p>
                </div>
            </div>

            {/* Live Timeline */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-sm relative">
                {isCancelled ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="text-xl font-bold text-neutral-900">Order Cancelled</h3>
                        <p className="text-neutral-500 mt-2">This order has been cancelled by the branch.</p>
                    </div>
                ) : (
                    <div className="space-y-8 relative">
                        {/* Connecting line */}
                        <div className="absolute left-[1.3rem] top-4 bottom-8 w-0.5 bg-neutral-100 -z-0" />

                        {STEPS.map((step, index) => {
                            const isCompleted = currentStepIndex >= index;
                            const isCurrent = currentStepIndex === index;
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className="relative z-10 flex gap-4 items-start">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${isCurrent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' :
                                        isCompleted ? 'bg-indigo-100 text-indigo-600' :
                                            'bg-neutral-50 border-2 border-neutral-200 text-neutral-300'
                                        }`}>
                                        <Icon className={`w-5 h-5 ${isCurrent && index !== (STEPS.length - 1) ? 'animate-pulse' : ''}`} />
                                    </div>

                                    <div className={`pt-2.5 transition-opacity duration-500 ${!isCompleted && !isCurrent ? 'opacity-40' : 'opacity-100'}`}>
                                        <h4 className={`font-bold text-base ${isCurrent ? 'text-indigo-600' : 'text-neutral-800'}`}>
                                            {step.label}
                                        </h4>
                                        {isCurrent && (
                                            <p className="text-sm text-neutral-500 mt-1 font-medium animate-in fade-in duration-500">
                                                {step.id === 'confirmed' && 'Branch has received your order.'}
                                                {step.id === 'preparing' && 'Staff are bagging your items now.'}
                                                {step.id === 'ready_for_pickup' && 'Park in the Express Zone, it is ready!'}
                                                {step.id === 'completed' && 'Delivered to your car. Thank you!'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {!isCancelled && (
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex justify-center items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live Updates Active
                    </p>
                </div>
            )}
        </div>
    );
}

export default function TrackOrderPage({ params }: { params: Promise<{ branchId: string }> }) {
    const { branchId } = use(params);
    return (
        <Suspense fallback={<div className="flex justify-center py-32"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>}>
            <TrackContent branchId={branchId} />
        </Suspense>
    );
}

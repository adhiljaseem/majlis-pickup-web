"use client";

import { CheckCircle2, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, use } from "react";
import confetti from "canvas-confetti";

export default function SuccessPage({ params }: { params: Promise<{ branchId: string }> }) {
    const { branchId } = use(params);

    // Trigger premium confetti on load!
    useEffect(() => {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#4f46e5', '#a855f7', '#ec4899']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#4f46e5', '#a855f7', '#ec4899']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    return (
        <div className="max-w-md mx-auto py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-700">

            <div className="relative inline-flex mb-8">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                <div className="relative bg-white rounded-full p-6 shadow-xl shadow-indigo-500/10 border border-indigo-50">
                    <CheckCircle2 className="w-16 h-16 text-indigo-500" />
                </div>
            </div>

            <h1 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">Order Received!</h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
                We&apos;ve sent your order directly to <strong className="text-neutral-800">Branch {branchId}</strong>.
                They are preparing your products now.
            </p>

            <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 mb-10 text-left space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-neutral-800 uppercase tracking-wider mb-2">Next Steps</h3>

                <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 shadow-sm flex-shrink-0">1</div>
                    <p className="text-sm text-neutral-600 mt-1">Head over to the branch location.</p>
                </div>

                <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 shadow-sm flex-shrink-0">2</div>
                    <p className="text-sm text-neutral-600 mt-1">Park in the designated express pickup zone.</p>
                </div>

                <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 shadow-sm flex-shrink-0">3</div>
                    <p className="text-sm text-neutral-600 mt-1">Our staff will find you using your car details and deliver your items to your window.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <Link
                    href={`/${branchId}/track`}
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-indigo-600 justify-center text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30"
                >
                    Track Your Order
                    <ChevronRight className="w-5 h-5" />
                </Link>

                <Link
                    href={`/${branchId}`}
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white border border-neutral-200 text-neutral-900 px-8 py-4 rounded-full font-bold hover:bg-neutral-50 transition-colors shadow-sm"
                >
                    <MapPin className="w-5 h-5" />
                    Back to Branch
                </Link>
            </div>
        </div>
    );
}

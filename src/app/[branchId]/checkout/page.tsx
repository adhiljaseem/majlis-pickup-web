"use client";

import { useState, use } from "react";
import { useCart } from "../../../context/CartContext";
import { ArrowLeft, CheckCircle2, Loader2, Car } from "lucide-react";
import Link from "next/link";
import { db, ensureAuth, auth } from "../../../lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CheckoutPage({ params }: { params: Promise<{ branchId: string }> }) {
    const { branchId } = use(params);
    const { items, cartTotal, clearCart } = useCart();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [carNumber, setCarNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !carNumber) {
            setError("Please fill out all fields.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Ensure anonymous auth before Firestore write
            await ensureAuth();

            // Get user ID after auth
            const userId = auth.currentUser?.uid || "anonymous_web";

            // Run a Firestore Transaction to safely increment the order ID and save the order
            const createdOrderId = await runTransaction(db, async (transaction) => {
                // 1. Reference to the counter document
                const counterRef = doc(db, "counters", "orders");
                const counterDoc = await transaction.get(counterRef);

                let nextOrderId = 10000; // Fallback starting point
                if (counterDoc.exists()) {
                    nextOrderId = (counterDoc.data().currentId || 10000) + 1;
                }

                // 2. Prepare the items exact schema mapping
                const orderItems = items.map(item => {
                    const finalPrice = (item.offerPrice > 0 && item.offerPrice < item.price) ? item.offerPrice : item.price;
                    return {
                        imageUrl: item.imageUrl || "",
                        name: item.name,
                        price: finalPrice,
                        productId: item.id,
                        quantity: item.quantity,
                        unit: "1 pc" // Assuming default as per example
                    };
                });

                // Calculate itemTotal (raw price of items without fees/discounts)
                const itemTotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                // 3. Prepare the exact order schema to match the mobile app
                const orderData = {
                    branchId: branchId,
                    createdAt: serverTimestamp(),
                    customerName: name, // Added customer name
                    deliveryAddress: null,
                    deliveryFee: 0,
                    discountAmount: 0, // Not explicitly calculated for guest right now unless requested
                    handlingFee: 0,
                    itemTotal: itemTotal,
                    items: orderItems,
                    languageCode: "en",
                    orderId: nextOrderId,
                    orderType: "pickup",
                    paymentMethod: "Cash On pickup",
                    pointsRedeemed: 0,
                    smallOrderFee: 0,
                    status: "confirmed",
                    totalAmount: cartTotal,
                    userEmail: "",
                    userId: userId,
                    userMobile: phone,
                    // Additional field for web pickup specifically
                    carNumber: carNumber
                };

                // 4. Update the counter
                if (counterDoc.exists()) {
                    transaction.update(counterRef, { currentId: nextOrderId });
                } else {
                    transaction.set(counterRef, { currentId: nextOrderId });
                }

                // 5. Save the order to the actual 'orders' collection with the explicit orderId
                const newOrderRef = doc(db, "orders", nextOrderId.toString());
                transaction.set(newOrderRef, orderData);

                return nextOrderId;
            });

            // 3. Clear local cart & redirect
            clearCart();
            router.push(`/${branchId}/success?orderId=${createdOrderId}&phone=${encodeURIComponent(phone)}`);

        } catch (err: unknown) {
            console.error("Error creating order:", err);
            setError("Something went wrong finalizing your order. Please try again.");
            setLoading(false);
        }
    };

    if (items.length === 0 && !loading) {
        return (
            <div className="py-20 text-center px-4">
                <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
                <Link href={`/${branchId}`} className="text-indigo-600 font-semibold hover:underline">
                    Return to shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href={`/${branchId}/cart`}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Guest Checkout</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-6">

                {/* Contact Info Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 mb-6">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                            <Car className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-neutral-900">Pickup Details</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Phone Number</label>
                            <div className="flex bg-neutral-50 border border-neutral-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all overflow-hidden items-center group">
                                <span className="pl-4 pr-3 py-4 text-neutral-500 font-bold border-r border-neutral-200/60 select-none bg-neutral-100/50 group-focus-within:text-indigo-600 transition-colors">
                                    +974
                                </span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setPhone(val);
                                    }}
                                    placeholder="33XX XXXX"
                                    maxLength={8}
                                    pattern="\d{8}"
                                    title="Enter 8 digit Qatar mobile number"
                                    className="w-full p-4 bg-transparent outline-none font-bold text-neutral-900 placeholder:text-neutral-400 placeholder:font-medium tracking-wide"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Car Plate Number / Model</label>
                            <input
                                type="text"
                                value={carNumber}
                                onChange={(e) => setCarNumber(e.target.value)}
                                placeholder="e.g. White Toyota ABC-123"
                                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
                                required
                            />
                            <p className="text-xs text-neutral-500 mt-2">We need this to locate your car when you arrive at the branch.</p>
                        </div>
                    </div>
                </div>

                {/* Order Summary & Submit */}
                <div className="bg-neutral-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                    <h3 className="font-bold mb-4">Total Amount</h3>
                    <p className="text-4xl font-black mb-8">QAR {cartTotal.toFixed(2)}</p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 text-white py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Confirm Pickup <CheckCircle2 className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Check if user has dismissed it before in this session
            const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
            if (!dismissed) {
                // Show the banner after a short delay
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        setIsVisible(false);
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem("pwa_prompt_dismissed", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
                >
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex items-center gap-4 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />

                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-sm">Install Majlis App</h3>
                            <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1">Experience faster shopping & tracking.</p>
                        </div>

                        <button
                            onClick={handleInstallClick}
                            className="bg-white text-neutral-900 px-4 py-2 rounded-xl text-xs font-black hover:bg-neutral-100 transition-colors shadow-sm"
                        >
                            INSTALL
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 text-neutral-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

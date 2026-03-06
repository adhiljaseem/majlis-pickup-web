"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "../types";

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localized storage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("pickup_wishlist");
            if (saved) {
                setWishlist(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Wishlist load error", e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Sync to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("pickup_wishlist", JSON.stringify(wishlist));
        }
    }, [wishlist, isLoaded]);

    const addToWishlist = (product: Product) => {
        setWishlist(current => {
            if (current.some(item => item.id === product.id)) return current;
            return [...current, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist(current => current.filter(item => item.id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.id === productId);
    };

    const clearWishlist = () => setWishlist([]);

    return (
        <WishlistContext.Provider value={{
            wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}

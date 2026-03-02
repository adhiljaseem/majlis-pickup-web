"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CartItem, Product } from "../types";

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    itemCount: number;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    lastAddedTimestamp: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [lastAddedTimestamp, setLastAddedTimestamp] = useState(0);

    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localized storage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("pickup_cart");
            if (saved) {
                setItems(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Cart load error", e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Sync to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("pickup_cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (product: Product) => {
        setItems(current => {
            const existing = current.find(item => item.id === product.id);
            if (existing) {
                return current.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...current, { ...product, quantity: 1 }];
        });
        setLastAddedTimestamp(Date.now());
    };

    const removeFromCart = (productId: string) => {
        setItems(current => current.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setItems(current =>
            current.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const cartTotal = items.reduce((total, item) => {
        const effectivePrice = (item.offerPrice > 0 && item.offerPrice < item.price) ? item.offerPrice : item.price;
        return total + (effectivePrice * item.quantity);
    }, 0);
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, searchQuery, setSearchQuery, lastAddedTimestamp
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

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
    mergeItems: (newItems: CartItem[]) => void;
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
                const newQuantity = Math.min(existing.quantity + 1, product.maxPurchase, product.stock);
                return current.map(item =>
                    item.id === product.id ? { ...item, quantity: newQuantity } : item
                );
            }
            // Add with minPurchase if starting fresh, capped by stock/maxPurchase just in case
            const initialAdd = Math.min(product.minPurchase, product.maxPurchase, product.stock);
            if (initialAdd <= 0) return current; // Cannot add out of stock items
            return [...current, { ...product, quantity: initialAdd }];
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
            current.map(item => {
                if (item.id === productId) {
                    const validQuantity = Math.min(quantity, item.maxPurchase, item.stock);
                    return { ...item, quantity: validQuantity };
                }
                return item;
            })
        );
    };

    const mergeItems = (newItems: CartItem[]) => {
        setItems(current => {
            const merged = [...current];
            newItems.forEach(newItem => {
                const existing = merged.find(i => i.id === newItem.id);
                if (existing) {
                    existing.quantity += newItem.quantity;
                } else {
                    merged.push(newItem);
                }
            });
            return merged;
        });
        setLastAddedTimestamp(Date.now());
    };

    const clearCart = () => setItems([]);

    const cartTotal = items.reduce((total, item) => {
        const effectivePrice = (item.offerPrice > 0 && item.offerPrice < item.price) ? item.offerPrice : item.price;
        return total + (effectivePrice * item.quantity);
    }, 0);
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, searchQuery, setSearchQuery, lastAddedTimestamp, mergeItems
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

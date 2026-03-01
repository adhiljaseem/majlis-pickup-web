"use client";

import { useState } from "react";
import { typesenseClient } from "../lib/typesense";
import { TypesenseProduct, Product } from "../types";

/**
 * Resolves a raw Typesense product into a branch-specific Product
 * by extracting the correct pricing, stock, and visibility from branchPrices.
 */
export function resolveForBranch(
    doc: TypesenseProduct,
    branchId: string
): Product | null {
    const bp = doc.branchPrices?.[branchId];

    // Skip products that are not visible for this branch or deleted
    if (!bp) return null;
    // isVisible can be boolean true or string "true" depending on the document
    const isVisible = bp.isVisible === true || bp.isVisible === "true";
    if (!isVisible) return null;
    if (doc.isDeleted === true) return null;

    const stock = parseInt(bp.stock, 10) || 0;

    return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        imageUrl: doc.imageUrl,
        category: doc.category,
        subcategory: doc.subcategory,
        brand: doc.brand,
        barcode: doc.barcode,
        price: parseFloat(bp.price) || 0,
        offerPrice: parseFloat(bp.offerPrice) || 0,
        stock,
        minPurchase: parseInt(bp.minPurchase, 10) || 1,
    };
}

export function useTypesenseSearch(branchId: string) {
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchProducts = async (query: string = "*") => {
        setLoading(true);
        setError(null);
        try {
            const searchParameters = {
                q: query || "*",
                query_by: "name,brand,category,subcategory,description",
                per_page: 100,
                page: 1,
            };

            const response = await typesenseClient
                .collections("products")
                .documents()
                .search(searchParameters);

            // Extract raw docs, then resolve branch-specific pricing
            const rawDocs =
                response.hits?.map(
                    (hit) => hit.document as unknown as TypesenseProduct
                ) || [];

            const resolved = rawDocs
                .map((doc) => resolveForBranch(doc, branchId))
                .filter((p): p is Product => p !== null);

            setResults(resolved);
        } catch (err: unknown) {
            console.error("Typesense search failed:", err);
            setError("Unable to fetch products. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return { searchProducts, results, loading, error };
}

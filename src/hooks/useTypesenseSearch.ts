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
        maxPurchase: bp.maxPurchase ? parseInt(bp.maxPurchase, 10) || 999 : 999, // default to high number if no limit
    };
}

export function useTypesenseSearch(branchId: string) {
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const searchProducts = async (query: string = "*", isNextPage: boolean = false, category?: string) => {
        setLoading(true);
        setError(null);
        try {
            const currentPage = isNextPage ? page + 1 : 1;
            const perPage = 20;

            let filterBy = "";
            if (category) {
                filterBy = `category:=[${category}]`;
            }

            const searchParameters = {
                q: query || "*",
                query_by: "name,brand,category,subcategory,subsubcategory,barcode,description",
                filter_by: filterBy || undefined,
                per_page: perPage,
                page: currentPage,
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

            if (isNextPage) {
                setResults(prev => [...prev, ...resolved]);
                setPage(currentPage);
            } else {
                setResults(resolved);
                setPage(1);
            }

            // Simple check for more pages based on response
            const foundCount = response.found || 0;
            setHasMore(foundCount > (currentPage * perPage));

        } catch (err: any) {
            console.error("Typesense search failed:", err);
            const msg = err?.message || "Unable to fetch products. Please check your connection.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return { searchProducts, results, loading, error, page, hasMore };
}

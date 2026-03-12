// ─── Typesense Raw Document Shape ───
// This matches the actual Typesense product document structure.

export interface BranchPriceInfo {
    isVisible: string | boolean;  // Can be "true"/"false" or boolean true/false
    price: string;           // e.g. "16"
    offerPrice: string;      // e.g. "10"
    stock: string;           // e.g. "24"
    minPurchase: string;     // e.g. "1"
    maxPurchase?: string;    // e.g. "10"
    updatedBy: string;
    lastUpdated: unknown;
}

export interface TypesenseProduct {
    id: string;
    name: string;
    name_ar?: string;
    name_hi?: string;
    description?: string;
    description_ar?: string;
    description_hi?: string;
    barcode?: string;
    barcodes?: string[];
    brand?: string;
    brand_ar?: string;
    brand_hi?: string;
    category?: string;
    subcategory?: string;
    subsubcategory?: string;
    imageUrl?: string;
    isDeleted?: boolean;
    visible?: boolean;
    searchKeywords?: string[];
    tags?: string[];
    branchPrices: Record<string, BranchPriceInfo>;
}

export interface Category {
    id: string;
    name: string;
    name_ar?: string;
    name_hi?: string;
    order: number;
    visible: boolean;
    visibleInBranches: string[];
    iconUrl?: string;
    assetIcon?: string;
}

// ─── Resolved Product (after extracting branch-specific data) ───

export interface Product {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    barcode?: string;
    price: number;
    offerPrice: number;
    stock: number;
    minPurchase: number;
    maxPurchase: number;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface PickupOrder {
    orderId?: string;
    branchId: string;
    customerPhone: string;
    carNumber: string;
    items: CartItem[];
    totalAmount: number;
    status: "pending" | "confirmed" | "preparing_order" | "ready" | "picked_up" | "cancelled";
    scheduledTime?: string;
    createdAt: unknown;
}

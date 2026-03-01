import { Metadata } from 'next';
import { typesenseClient } from '../../../../lib/typesense';
import { TypesenseProduct, Product } from '../../../../types';

function resolveForBranch(doc: TypesenseProduct, branchId: string): Product | null {
    const bp = doc.branchPrices?.[branchId];
    if (!bp) return null;
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

export async function generateMetadata({
    params: paramsPromise,
}: {
    params: Promise<{ branchId: string; productId: string }>;
}): Promise<Metadata> {
    const params = await paramsPromise;

    try {
        const searchRes = await typesenseClient
            .collections('products')
            .documents()
            .search({
                q: '*',
                query_by: 'name',
                filter_by: `id:=[${params.productId}]`,
                per_page: 1,
            });

        const hits = searchRes.hits || [];
        const rawDoc = hits[0]?.document as unknown as TypesenseProduct | undefined;

        if (!rawDoc) {
            return { title: 'Product Not Found' };
        }

        const product = resolveForBranch(rawDoc, params.branchId);

        if (!product) {
            return { title: 'Product Not Found' };
        }

        const price = (product.offerPrice || product.price).toFixed(2);
        const title = `${product.name} - QAR ${price} | Majlis Pickup`;
        const description = product.description
            ? (product.description.length > 150 ? product.description.substring(0, 147) + '...' : product.description)
            : `Order ${product.name} online for fast pickup at Majlis Hypermarket.`;

        const images = product.imageUrl ? [product.imageUrl] : [];

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images,
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images,
            }
        };
    } catch (error) {
        return {
            title: 'Majlis Hypermarket Product',
        };
    }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

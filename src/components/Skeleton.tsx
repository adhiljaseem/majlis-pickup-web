export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-shimmer rounded-xl bg-neutral-100 ${className}`} />
    );
}

export function ProductSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-neutral-100 flex flex-col h-full space-y-3">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="mt-auto pt-2 flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
    );
}

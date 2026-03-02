/**
 * Geo utilities for location-based branch selection.
 */

export interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Parses a "lat, lng" string into a Coordinates object.
 */
export function parseCoordinates(coordString: string): Coordinates | null {
    try {
        const parts = coordString.split(",").map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
    } catch (e) {
        console.error("Failed to parse coordinates:", coordString, e);
    }
    return null;
}

/**
 * Calculates the Haversine distance between two points in km.
 */
export function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Gets the user's current position via browser Geolocation API.
 * Returns null if denied or unavailable.
 */
export function getUserLocation(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    });
}

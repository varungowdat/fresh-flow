/**
 * Geolocation utilities for KiranaDeals
 * Browser geolocation + Haversine distance calculation
 */

/**
 * Get user's current position using browser Geolocation API
 * Returns { latitude, longitude } or null
 */
export function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000, // cache for 5 min
      }
    );
  });
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance in human-readable form
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return "nearby";
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Calculate distance from user to a shop and return formatted string
 */
export function getDistanceToShop(userLat, userLng, shopLat, shopLng) {
  if (!userLat || !userLng || !shopLat || !shopLng) return null;
  const meters = haversineDistance(userLat, userLng, shopLat, shopLng);
  return {
    meters,
    formatted: formatDistance(meters),
  };
}

/**
 * Demo coordinates for Bengaluru shops (used when real coords aren't available)
 * Centered around Indiranagar area
 */
export const DEMO_LOCATIONS = {
  center: { latitude: 12.9716, longitude: 77.6412 }, // Indiranagar
  shops: [
    { name: "Raju Kirana", latitude: 12.9730, longitude: 77.6395, distance: 180 },
    { name: "Sri Stores", latitude: 12.9745, longitude: 77.6440, distance: 340 },
    { name: "Ramesh General", latitude: 12.9700, longitude: 77.6460, distance: 520 },
    { name: "Corner Shop", latitude: 12.9690, longitude: 77.6380, distance: 700 },
    { name: "Pandey Kirana", latitude: 12.9755, longitude: 77.6350, distance: 850 },
  ],
};

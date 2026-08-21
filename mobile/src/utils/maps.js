const MAX_WAYPOINTS = 23; // Google Maps caps waypoints around 25; leave room for origin/destination

// places: ordered [{ lat, lng }]
export function buildMapsUrl(places) {
  const deduped = places.filter((p, i) => i === 0 || p.lat !== places[i - 1].lat || p.lng !== places[i - 1].lng);
  if (deduped.length === 0) return null;
  if (deduped.length === 1) {
    const p = deduped[0];
    return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  }

  const trimmed = deduped.slice(0, MAX_WAYPOINTS + 2);
  const origin = trimmed[0];
  const destination = trimmed[trimmed.length - 1];
  const waypoints = trimmed.slice(1, -1);

  const params = [
    `origin=${origin.lat},${origin.lng}`,
    `destination=${destination.lat},${destination.lng}`,
    waypoints.length ? `waypoints=${waypoints.map((p) => `${p.lat},${p.lng}`).join("|")}` : null,
    "travelmode=driving",
  ].filter(Boolean);

  return `https://www.google.com/maps/dir/?api=1&${params.join("&")}`;
}

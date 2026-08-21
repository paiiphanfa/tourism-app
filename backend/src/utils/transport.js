const EARTH_RADIUS_KM = 6371;

function haversineKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function suggestTransport(km) {
  if (km < 1) return "walk";
  if (km <= 5) return "tuk-tuk/taxi/Grab";
  return "car/van";
}

function toLatLng(place) {
  const [lng, lat] = place.location.coordinates;
  return { lat, lng };
}

// Takes a populated Trip Mongoose doc (or plain object) and returns a plain
// object with a computed `travelFromPrevious` on each item. Computed on read
// (never persisted) since edits can reorder/replace items at any time.
function attachTravelInfo(trip) {
  const plain = typeof trip.toObject === "function" ? trip.toObject() : trip;

  plain.days = (plain.days || []).map((day) => {
    const sortedItems = [...day.items].sort((a, b) => a.order - b.order);
    let previousPlace = null;

    const items = sortedItems.map((item) => {
      let travelFromPrevious = null;
      if (previousPlace && item.placeId && item.placeId.location) {
        const distanceKm = haversineKm(toLatLng(previousPlace), toLatLng(item.placeId));
        travelFromPrevious = { distanceKm: Math.round(distanceKm * 10) / 10, mode: suggestTransport(distanceKm) };
      }
      if (item.placeId && item.placeId.location) previousPlace = item.placeId;
      return { ...item, travelFromPrevious };
    });

    return { ...day, items };
  });

  return plain;
}

module.exports = { haversineKm, suggestTransport, attachTravelInfo };

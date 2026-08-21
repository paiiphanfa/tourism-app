const Place = require("../models/Place");
const Trip = require("../models/Trip");
const { generateItinerary } = require("./gemini.service");
const { ensureCoverage } = require("./places.service");

function toCandidate(place) {
  return {
    id: place._id.toString(),
    name: place.name,
    category: place.category,
    lng: place.location.coordinates[0],
    lat: place.location.coordinates[1],
    openHours: place.openHours,
    avgVisitDurationMinutes: place.avgVisitDurationMinutes,
    tags: place.tags || [],
  };
}

async function findCandidatePlaces(destination, preferences, district) {
  try {
    await ensureCoverage({ province: destination, district, preferences });
  } catch (err) {
    console.warn(`[itinerary] Google Places coverage skipped: ${err.message}`);
  }

  const query = { province: new RegExp(`^${destination}$`, "i") };
  if (preferences && preferences.length) {
    query.tags = { $in: preferences };
  }
  let places = await Place.find(query);
  if (!places.length && preferences && preferences.length) {
    // Preference filter matched nothing — fall back to all places in the province.
    places = await Place.find({ province: new RegExp(`^${destination}$`, "i") });
  }
  return places;
}

function validatePlaceIds(itinerary, validIds) {
  const invalid = [];
  for (const day of itinerary.days) {
    for (const item of day.items) {
      if (!validIds.has(item.placeId)) invalid.push(item.placeId);
    }
  }
  return invalid;
}

async function createTrip({ userId, destination, district, durationDays, preferences = [], startLocation }) {
  const places = await findCandidatePlaces(destination, preferences, district);

  if (!places.length) {
    const trip = await Trip.create({
      userId,
      destination,
      district,
      durationDays,
      preferences,
      startLocation,
      status: "failed",
      rawItineraryText: `No places found for "${destination}" yet.`,
    });
    return trip;
  }

  const candidates = places.map(toCandidate);
  const validIds = new Set(candidates.map((c) => c.id));

  let result = await generateItinerary({ destination, durationDays, preferences, candidatePlaces: candidates });
  let invalid = validatePlaceIds(result, validIds);

  if (invalid.length) {
    result = await generateItinerary({
      destination,
      durationDays,
      preferences,
      candidatePlaces: candidates,
      retryHint: `Your previous response used these invalid placeId(s): ${invalid.join(", ")}. Every placeId must be copied exactly from the provided list.`,
    });
    invalid = validatePlaceIds(result, validIds);
  }

  if (invalid.length) {
    const trip = await Trip.create({
      userId,
      destination,
      district,
      durationDays,
      preferences,
      startLocation,
      status: "failed",
      rawItineraryText: "The itinerary generator returned places that don't match our database. Please try again.",
    });
    return trip;
  }

  const days = result.days.map((day) => ({
    dayNumber: day.dayNumber,
    summary: day.summary,
    items: day.items.map((item) => ({
      placeId: item.placeId,
      order: item.order,
      startTime: item.startTime,
      endTime: item.endTime,
      note: item.note,
    })),
  }));

  const trip = await Trip.create({
    userId,
    destination,
    district,
    durationDays,
    preferences,
    startLocation,
    days,
    rawItineraryText: result.narrativeText,
    status: "ready",
  });

  return trip;
}

module.exports = { createTrip, findCandidatePlaces, toCandidate };

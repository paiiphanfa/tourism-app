const Place = require("../models/Place");
const PlaceCoverage = require("../models/PlaceCoverage");
const { googlePlacesApiKey } = require("../config/env");

const COVERAGE_TTL_DAYS = 30;
const SEARCH_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.formattedAddress",
  "places.location",
  "places.regularOpeningHours",
  "places.priceLevel",
  "places.editorialSummary",
].join(",");

const TYPE_TO_CATEGORY = {
  hindu_temple: "temple",
  buddhist_temple: "temple",
  church: "temple",
  mosque: "temple",
  synagogue: "temple",
  place_of_worship: "temple",
  cafe: "cafe",
  coffee_shop: "cafe",
  bakery: "cafe",
  park: "nature",
  national_park: "nature",
  natural_feature: "nature",
  beach: "nature",
  hiking_area: "nature",
  state_park: "nature",
  museum: "museum",
  art_gallery: "museum",
  market: "market",
  shopping_mall: "market",
  supermarket: "market",
  grocery_store: "market",
  tourist_attraction: "attraction",
  amusement_park: "attraction",
  zoo: "attraction",
  aquarium: "attraction",
  landmark: "attraction",
  monument: "attraction",
  point_of_interest: "attraction",
};

const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function mapCategory(primaryType) {
  return TYPE_TO_CATEGORY[primaryType] || "other";
}

function buildQueries({ province, district, preferences }) {
  const locationPhrase = district ? `${district}, ${province}` : province;
  if (preferences && preferences.length) {
    return preferences.map((pref) => `${pref} places to visit in ${locationPhrase}, Thailand`);
  }
  return [`tourist attractions in ${locationPhrase}, Thailand`];
}

async function searchText(textQuery) {
  if (!googlePlacesApiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set — copy .env.example to .env and fill it in");
  }
  const res = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googlePlacesApiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.places || [];
}

async function upsertGooglePlace(gPlace, { province, district }) {
  const doc = {
    name: gPlace.displayName?.text || "Unnamed place",
    province,
    district: district || undefined,
    category: mapCategory(gPlace.primaryType),
    description: gPlace.editorialSummary?.text || gPlace.formattedAddress || "",
    location: {
      type: "Point",
      coordinates: [gPlace.location.longitude, gPlace.location.latitude],
    },
    openHours: gPlace.regularOpeningHours?.weekdayDescriptions?.join("; ") || undefined,
    tags: [],
    priceLevel: PRICE_LEVEL_MAP[gPlace.priceLevel] || undefined,
    googlePlaceId: gPlace.id,
    source: "google",
    lastRefreshedAt: new Date(),
  };

  await Place.findOneAndUpdate({ googlePlaceId: gPlace.id }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function fetchAndUpsertPlaces({ province, district, preferences }) {
  const queries = buildQueries({ province, district, preferences });
  const seen = new Set();

  for (const query of queries) {
    const results = await searchText(query);
    for (const gPlace of results) {
      if (seen.has(gPlace.id)) continue;
      seen.add(gPlace.id);
      await upsertGooglePlace(gPlace, { province, district });
    }
  }

  return seen.size;
}

async function ensureCoverage({ province, district, preferences }) {
  const coverageQuery = { province, district: district || null };
  const existing = await PlaceCoverage.findOne(coverageQuery);

  const staleCutoff = new Date(Date.now() - COVERAGE_TTL_DAYS * 24 * 60 * 60 * 1000);
  if (existing && existing.lastFetchedAt > staleCutoff) {
    return { fetched: false, count: 0 };
  }

  const count = await fetchAndUpsertPlaces({ province, district, preferences });

  await PlaceCoverage.findOneAndUpdate(
    coverageQuery,
    { ...coverageQuery, lastFetchedAt: new Date() },
    { upsert: true }
  );

  return { fetched: true, count };
}

module.exports = { ensureCoverage, fetchAndUpsertPlaces };

const Trip = require("../models/Trip");
const Place = require("../models/Place");
const ChatSession = require("../models/ChatSession");
const { generateChatReply } = require("../services/gemini.service");
const { applyEdit } = require("../services/tripEdit.service");
const { attachTravelInfo } = require("../utils/transport");

async function getOrCreateSession(tripId, userId) {
  let session = await ChatSession.findOne({ tripId, userId });
  if (!session) {
    session = await ChatSession.create({ tripId, userId, messages: [] });
  }
  return session;
}

async function findNearbyUnusedPlaces(trip) {
  const usedIds = trip.days.flatMap((d) => d.items.map((i) => (i.placeId._id || i.placeId).toString()));

  let referencePoint = trip.startLocation && trip.startLocation.lat != null ? [trip.startLocation.lng, trip.startLocation.lat] : null;

  if (!referencePoint) {
    const firstItemPlace = trip.days[0] && trip.days[0].items[0] && trip.days[0].items[0].placeId;
    if (firstItemPlace && firstItemPlace.location) {
      referencePoint = firstItemPlace.location.coordinates;
    }
  }

  const baseQuery = { province: new RegExp(`^${trip.destination}$`, "i"), _id: { $nin: usedIds } };

  if (referencePoint) {
    return Place.find({
      ...baseQuery,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: referencePoint },
          $maxDistance: 20000,
        },
      },
    }).limit(6);
  }

  return Place.find(baseQuery).limit(6);
}

const OBJECT_ID_RE = /^[0-9a-f]{24}/i;

// Gemini occasionally appends stray description-like text after an id
// (e.g. "6a86a3...397Plugin place id..."). The real id is reliably a clean
// 24-char hex prefix, so recover it instead of treating the whole field as
// invalid — avoids an extra slow round-trip for a cosmetic model quirk.
function cleanObjectId(value) {
  if (!value) return value;
  const match = value.match(OBJECT_ID_RE);
  return match ? match[0] : value;
}

function validateEditFields(result, itineraryPlaces, nearbyPlaces) {
  if (!result.action || result.action === "none") return null;

  if (result.targetDayNumber == null || !result.targetPlaceId) {
    return `You set action="${result.action}" but left out targetDayNumber and/or targetPlaceId — both are required for that action.`;
  }

  const targetExists = itineraryPlaces.some(
    (p) => p.id === result.targetPlaceId && p.dayNumber === result.targetDayNumber
  );
  if (!targetExists) {
    return `targetPlaceId "${result.targetPlaceId}" on day ${result.targetDayNumber} doesn't match any real item in the current itinerary. Use an exact id + day from the itinerary list.`;
  }

  if (result.action === "replace_item") {
    if (!result.newPlaceId) {
      return `action="replace_item" requires newPlaceId, which was missing.`;
    }
    const newExists = nearbyPlaces.some((p) => p.id === result.newPlaceId);
    if (!newExists) {
      return `newPlaceId "${result.newPlaceId}" doesn't match any real id from the nearby-places list. Use an exact id from that list.`;
    }
  }

  return null;
}

async function sendMessage(req, res, next) {
  try {
    const { message, day } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId }).populate("days.items.placeId");
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const session = await getOrCreateSession(trip._id, req.userId);

    const itineraryPlaces = trip.days.flatMap((d) =>
      d.items
        .filter((i) => i.placeId)
        .map((i) => ({ id: i.placeId._id.toString(), name: i.placeId.name, dayNumber: d.dayNumber }))
    );

    const nearby = await findNearbyUnusedPlaces(trip);
    const nearbyPlaces = nearby.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      lng: p.location.coordinates[0],
      lat: p.location.coordinates[1],
      tags: p.tags || [],
    }));

    const chatHistory = session.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    const MAX_ATTEMPTS = 3;
    let result;
    let validationError;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      result = await generateChatReply({
        destination: trip.destination,
        currentDay: day || 1,
        itineraryPlaces,
        nearbyPlaces,
        chatHistory,
        userMessage: message,
        retryHint: validationError,
      });
      result.targetPlaceId = cleanObjectId(result.targetPlaceId);
      result.newPlaceId = cleanObjectId(result.newPlaceId);
      validationError = validateEditFields(result, itineraryPlaces, nearbyPlaces);
      if (!validationError) break;
    }

    if (validationError) {
      // Still invalid after all attempts — fall back to a plain reply, no edit attempt.
      result = { reply: result.reply, action: "none" };
    }

    let tripUpdated = false;
    let editSummary = null;
    let updatedTrip = null;
    let replyText = result.reply;

    if (result.action && result.action !== "none") {
      try {
        const editResult = await applyEdit(trip, {
          action: result.action,
          targetDayNumber: result.targetDayNumber,
          targetPlaceId: result.targetPlaceId,
          newPlaceId: result.newPlaceId,
        });
        tripUpdated = true;
        editSummary = editResult.editSummary;
        updatedTrip = attachTravelInfo(editResult.trip);
      } catch (err) {
        console.warn(`[chat] Could not apply itinerary edit: ${err.message}`);
        replyText = `${result.reply} (I tried to update your itinerary but couldn't — mind trying again?)`;
      }
    }

    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: replyText });
    await session.save();

    res.json({ reply: replyText, tripUpdated, trip: updatedTrip, editSummary });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const session = await ChatSession.findOne({ tripId: trip._id, userId: req.userId });
    res.json({ messages: session ? session.messages : [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendMessage, getHistory };

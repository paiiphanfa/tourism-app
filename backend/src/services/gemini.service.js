const { GoogleGenAI } = require("@google/genai");
const { geminiApiKey } = require("../config/env");

// gemini-3.7-flash's free tier has a strict 20 requests/day cap that we hit
// during development, and gemini-2.5-flash is no longer available to new API
// keys (Google's error pointed here instead). Switch back to 3.7 once
// billing is enabled or the daily quota isn't a concern.
const MODEL = "gemini-3.6-flash";

let client = null;
function getClient() {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set — copy .env.example to .env and fill it in");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: geminiApiKey });
  }
  return client;
}

const itinerarySchema = {
  type: "object",
  properties: {
    narrativeText: { type: "string", description: "Friendly 2-3 sentence overview of the whole trip" },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dayNumber: { type: "integer" },
          summary: { type: "string", description: "One sentence summary of the day's theme" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                placeId: { type: "string", description: "Must be one of the provided candidate place ids" },
                order: { type: "integer" },
                startTime: { type: "string", description: "e.g. 09:00" },
                endTime: { type: "string", description: "e.g. 10:30" },
                note: { type: "string", description: "Short personalized note about why this stop, in this order" },
              },
              required: ["placeId", "order"],
            },
          },
        },
        required: ["dayNumber", "items"],
      },
    },
  },
  required: ["narrativeText", "days"],
};

const chatReplySchema = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Conversational reply to the tourist" },
    action: {
      type: "string",
      enum: ["none", "replace_item", "remove_item"],
      description: "none = just chatting/suggesting without changing the plan. replace_item = swap an existing itinerary stop for a new real place. remove_item = drop an existing stop entirely.",
    },
    targetDayNumber: { type: "integer", description: "Day number of the item being changed" },
    targetPlaceId: { type: "string", description: "Copy exactly, id only, no other text" },
    newPlaceId: { type: "string", description: "Copy exactly, id only, no other text" },
  },
  required: ["reply", "action"],
};

async function callStructured({ input, schema }) {
  const ai = getClient();
  // Using the classic generateContent API rather than the newer Interactions
  // API — the latter (still marked experimental by the SDK) was observed
  // corrupting structured id fields with leaked reasoning text on this model.
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return JSON.parse(response.text);
}

async function generateItinerary({ destination, durationDays, preferences, candidatePlaces, retryHint }) {
  const placesBlock = candidatePlaces
    .map(
      (p) =>
        `- id: ${p.id} | name: ${p.name} | category: ${p.category} | coords: [${p.lng}, ${p.lat}] | hours: ${p.openHours || "unknown"} | avgVisitMinutes: ${p.avgVisitDurationMinutes} | tags: ${p.tags.join(", ")}`
    )
    .join("\n");

  const input = `You are a Thailand trip-planning assistant building a real, usable itinerary.

Destination: ${destination}
Trip length: ${durationDays} day(s)
Traveler preferences: ${preferences && preferences.length ? preferences.join(", ") : "none specified"}

You MUST build the itinerary ONLY from this exact list of real places (use their ids exactly as given — do not invent places or ids):
${placesBlock}

Rules:
- Every "placeId" in your output must be one of the ids listed above, copied exactly.
- Sequence each day's stops in a sensible order considering geography (nearby coordinates) and opening hours.
- Don't repeat the same place across multiple days unless it genuinely makes sense (e.g. a night market).
- Keep each day realistic in pace (roughly 3-5 stops depending on visit duration).
- Write a short, warm "note" for each stop personalizing it to the traveler's preferences.
${retryHint ? `\nIMPORTANT CORRECTION: ${retryHint}` : ""}`;

  return callStructured({ input, schema: itinerarySchema });
}

async function generateChatReply({ destination, currentDay, itineraryPlaces, nearbyPlaces, chatHistory, userMessage, retryHint }) {
  const itineraryBlock = itineraryPlaces
    .map((p) => `- id: ${p.id} | name: ${p.name} | day: ${p.dayNumber}`)
    .join("\n");
  const nearbyBlock = nearbyPlaces
    .map(
      (p) =>
        `- id: ${p.id} | name: ${p.name} | category: ${p.category} | coords: [${p.lng}, ${p.lat}] | tags: ${p.tags.join(", ")}`
    )
    .join("\n");
  const historyBlock = chatHistory.map((m) => `${m.role}: ${m.content}`).join("\n");

  const input = `You are a friendly, trip-aware travel companion chatting with a tourist currently on a trip to ${destination}. You can actually edit their itinerary when they ask you to, not just talk about it.

Their current itinerary (place ids and which day they're on — these are the ONLY valid "targetPlaceId" values):
${itineraryBlock || "(no itinerary items yet)"}

They are currently on day ${currentDay}.

Places near their current itinerary that are NOT already in their plan (these are the ONLY valid "newPlaceId" values — never invent a place or id):
${nearbyBlock || "(none available)"}

Recent conversation:
${historyBlock || "(no prior messages)"}

Tourist just said: "${userMessage}"

Reply conversationally and helpfully. Then decide on "action":
- If they express boredom, dissatisfaction, or explicitly ask to swap/change a specific stop, set action to "replace_item" with "targetDayNumber" + "targetPlaceId" (the stop being replaced) and "newPlaceId" (a real place from the nearby list).
- If they ask to remove/skip/drop a stop without wanting a replacement, set action to "remove_item" with "targetDayNumber" + "targetPlaceId".
- If they're just chatting, asking a question, or you don't have a good real alternative to offer, set action to "none" and omit the target/new fields.
Whenever action is "replace_item" or "remove_item", targetDayNumber and targetPlaceId are MANDATORY — never set one of those actions without also filling in both fields (plus newPlaceId for replace_item).
Only ever reference place ids that appear in the lists above — never invent one.
${retryHint ? `\nIMPORTANT CORRECTION: ${retryHint}` : ""}`;

  return callStructured({ input, schema: chatReplySchema });
}

module.exports = { generateItinerary, generateChatReply };

import client from "./client";

export async function sendChatMessage(tripId, message, day) {
  const { data } = await client.post(`/trips/${tripId}/chat`, { message, day });
  return data;
}

export async function getChatHistory(tripId) {
  const { data } = await client.get(`/trips/${tripId}/chat`);
  return data.messages;
}

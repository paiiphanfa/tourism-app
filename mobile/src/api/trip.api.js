import client from "./client";

export async function createTrip({ destination, district, durationDays, preferences, location }) {
  const { data } = await client.post("/trips", { destination, district, durationDays, preferences, location });
  return data.trip;
}

export async function listTrips() {
  const { data } = await client.get("/trips");
  return data.trips;
}

export async function getTrip(tripId) {
  const { data } = await client.get(`/trips/${tripId}`);
  return data.trip;
}

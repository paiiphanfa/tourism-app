const Trip = require("../models/Trip");
const { createTrip } = require("../services/itinerary.service");
const { attachTravelInfo } = require("../utils/transport");

async function create(req, res, next) {
  try {
    const { destination, district, durationDays, preferences, location } = req.body;
    if (!destination || !durationDays) {
      return res.status(400).json({ error: "destination and durationDays are required" });
    }

    const trip = await createTrip({
      userId: req.userId,
      destination,
      district,
      durationDays: Number(durationDays),
      preferences,
      startLocation: location,
    });

    const populated = await trip.populate("days.items.placeId");
    res.status(201).json({ trip: attachTravelInfo(populated) });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const trips = await Trip.find({ userId: req.userId })
      .select("destination durationDays status createdAt")
      .sort({ createdAt: -1 });
    res.json({ trips });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId }).populate("days.items.placeId");
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json({ trip: attachTravelInfo(trip) });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne };

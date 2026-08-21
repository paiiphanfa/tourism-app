const { Schema, model } = require("mongoose");

const itineraryItemSchema = new Schema(
  {
    placeId: { type: Schema.Types.ObjectId, ref: "Place", required: true },
    order: { type: Number, required: true },
    startTime: { type: String },
    endTime: { type: String },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const dayPlanSchema = new Schema(
  {
    dayNumber: { type: Number, required: true },
    summary: { type: String, trim: true },
    items: { type: [itineraryItemSchema], default: [] },
  },
  { _id: false }
);

const tripSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  destination: { type: String, required: true, trim: true },
  district: { type: String, trim: true },
  durationDays: { type: Number, required: true, min: 1, max: 30 },
  preferences: { type: [String], default: [] },
  startLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  days: { type: [dayPlanSchema], default: [] },
  rawItineraryText: { type: String },
  status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model("Trip", tripSchema);

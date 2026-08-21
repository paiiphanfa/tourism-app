const { Schema, model } = require("mongoose");

const CATEGORIES = ["temple", "cafe", "viewpoint", "nature", "museum", "market", "attraction", "other"];

const placeSchema = new Schema({
  name: { type: String, required: true, trim: true },
  province: { type: String, required: true, trim: true, index: true },
  district: { type: String, trim: true, index: true },
  category: { type: String, enum: CATEGORIES, required: true },
  description: { type: String, trim: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  openHours: { type: String, trim: true },
  avgVisitDurationMinutes: { type: Number, default: 60 },
  tags: { type: [String], default: [] },
  priceLevel: { type: Number, min: 1, max: 4 },
  googlePlaceId: { type: String, index: true, unique: true, sparse: true },
  source: { type: String, enum: ["seed", "google"], default: "seed" },
  lastRefreshedAt: { type: Date },
});

placeSchema.index({ location: "2dsphere" });

module.exports = model("Place", placeSchema);
module.exports.CATEGORIES = CATEGORIES;

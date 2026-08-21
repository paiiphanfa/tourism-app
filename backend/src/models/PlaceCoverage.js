const { Schema, model } = require("mongoose");

const placeCoverageSchema = new Schema({
  province: { type: String, required: true, trim: true },
  district: { type: String, trim: true, default: null },
  lastFetchedAt: { type: Date, required: true, default: Date.now },
});

placeCoverageSchema.index({ province: 1, district: 1 }, { unique: true });

module.exports = model("PlaceCoverage", placeCoverageSchema);

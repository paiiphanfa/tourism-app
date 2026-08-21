const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const Place = require("../models/Place");

async function seed() {
  await connectDB();

  const filePath = path.join(__dirname, "places.chiangmai.json");
  const places = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  await Place.deleteMany({ province: "Chiang Mai" });
  const inserted = await Place.insertMany(places);

  console.log(`[seed] inserted ${inserted.length} places for Chiang Mai`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});

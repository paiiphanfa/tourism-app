require("dotenv").config();

const required = ["MONGODB_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key} in .env — see .env.example`);
  }
}

module.exports = {
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  geminiApiKey: process.env.GEMINI_API_KEY,
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  port: process.env.PORT || 4000,
};

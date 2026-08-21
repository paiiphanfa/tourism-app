const dns = require("dns");
const mongoose = require("mongoose");
const { mongodbUri } = require("./env");

// Some home routers/ISP DNS resolvers don't support the SRV record lookups
// that mongodb+srv:// URIs require. Point just this process at a public
// resolver that does, without touching the machine's system-wide DNS.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is not set — copy .env.example to .env and fill it in");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongodbUri);
  console.log("[db] connected to MongoDB");
}

module.exports = connectDB;

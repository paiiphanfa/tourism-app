const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
const chatRoutes = require("./routes/chat.routes");
const referenceRoutes = require("./routes/reference.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trips/:id/chat", chatRoutes);
app.use("/api/reference", referenceRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

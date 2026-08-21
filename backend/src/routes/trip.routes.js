const { Router } = require("express");
const requireAuth = require("../middleware/auth.middleware");
const { create, list, getOne } = require("../controllers/trip.controller");

const router = Router();

router.use(requireAuth);
router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);

module.exports = router;

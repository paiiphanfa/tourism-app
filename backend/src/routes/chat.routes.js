const { Router } = require("express");
const requireAuth = require("../middleware/auth.middleware");
const { sendMessage, getHistory } = require("../controllers/chat.controller");

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.post("/", sendMessage);
router.get("/", getHistory);

module.exports = router;

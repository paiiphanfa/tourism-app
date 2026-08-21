const { Router } = require("express");
const { getProvinces } = require("../controllers/reference.controller");

const router = Router();

router.get("/provinces", getProvinces);

module.exports = router;

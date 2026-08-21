const provincesData = require("../data/thailand-provinces.json");

function getProvinces(req, res) {
  res.json(provincesData);
}

module.exports = { getProvinces };

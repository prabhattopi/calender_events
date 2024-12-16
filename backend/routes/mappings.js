const express = require("express");
const router = express.Router();
const {  mappignColumn } = require("../controllers/mapping");

router.post("/mapping-column", mappignColumn);

module.exports = router;

const express = require("express");
const router = express.Router();
const financialsController = require("../controllers/financials.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);
router.get('/candlestick-data', financialsController.getCandlestickData);
module.exports = router;

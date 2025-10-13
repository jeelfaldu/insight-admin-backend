const express = require('express');
const router = express.Router();
const offerRequestController = require('../controllers/offer-request.controller');

// Submit a new offer request
router.post('/', offerRequestController.submitOffer);

// Retrieve all offer requests
router.get('/', offerRequestController.getAllOffers);

// Delete an offer request by ID
router.delete('/:id', offerRequestController.deleteOffer);

module.exports = router;

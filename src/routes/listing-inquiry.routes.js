const express = require('express');
const router = express.Router();
const listingInquiryController = require('../controllers/listing-inquiry.controller'); // Adjust path as needed

// Submit a new inquiry
router.post('/', listingInquiryController.submitInquiry);

// Retrieve all inquiries
router.get('/', listingInquiryController.getAllInquiries);

// Delete an inquiry by ID
router.delete('/:id', listingInquiryController.deleteInquiry);

module.exports = router;

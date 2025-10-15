const OfferRequest = require('../models/offer-request.model');

// Create a new offer request entry
exports.submitOffer = async (req, res) => {
  try {
    const {
      propertyAddress,
      propertyType,
      inquirerEmail,
      inquirerPhone,
      isLegalOwner,
      leaseStatus,
      monthlyRentalIncome
    } = req.body;

    // Explicitly convert isLegalOwner to a boolean
    const parsedIsLegalOwner = String(isLegalOwner).toLowerCase() === 'true' || String(isLegalOwner) === '1';

    const newOfferRequest = await OfferRequest.create({
      propertyAddress,
      propertyType,
      inquirerEmail,
      inquirerPhone,
      isLegalOwner: parsedIsLegalOwner,
      leaseStatus,
      monthlyRentalIncome: monthlyRentalIncome || null // Ensure it's null if empty
    });

    res.status(201).json({ message: 'Offer request submitted successfully!', data: newOfferRequest });
  } catch (error) {
    console.error('Error inserting offer request:', error);
    res.status(500).json({ error: 'Could not save the offer request.' });
  }
};

// Retrieve all offer request entries
exports.getAllOffers = async (req, res) => {
  try {
    const offerRequests = await OfferRequest.findAll({
      order: [['createdAt', 'DESC']], // Order by newest first
    });
    res.status(200).json(offerRequests);
  } catch (error) {
    console.error('Error fetching offer requests:', error);
    res.status(500).json({ error: 'Could not fetch offer requests.' });
  }
};

// Delete an offer request entry by ID
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRowCount = await OfferRequest.destroy({
      where: { id: id }
    });

    if (deletedRowCount === 0) {
      return res.status(404).json({ error: 'Offer request not found.' });
    }

    res.status(200).json({ message: 'Offer request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting offer request:', error);
    res.status(500).json({ error: 'Could not delete the offer request.' });
  }
};

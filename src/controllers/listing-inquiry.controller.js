const ListingInquiry = require('../models/listing-inquiry.model'); // Adjust path as needed

exports.submitInquiry = async (req, res) => {
  try {
    const {
      propertyAddress,
      listingType,
      unitInterestedIn, // This will be an array of strings from the frontend
      name,
      phoneNumber,
      email
    } = req.body;

    // Create a new inquiry record using your Sequelize model
    const newInquiry = await ListingInquiry.create({
      propertyAddress,
      listingType,
      unitInterestedIn: unitInterestedIn || [], // Ensure it's an empty array if not provided
      name,
      phoneNumber,
      email
    });

    res.status(201).json({ message: 'Inquiry submitted successfully!', data: newInquiry });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ error: 'Could not save the inquiry.' });
  }
};

exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await ListingInquiry.findAll({
      order: [['createdAt', 'DESC']] // Order by newest first
    });
    res.status(200).json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Could not fetch inquiries.' });
  }
};

exports.deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ListingInquiry.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.status(200).json({ message: 'Inquiry deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Inquiry not found.' });
    }
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'Could not delete the inquiry.' });
  }
};

// src/controllers/data-import.controller.js
const RentRollData = require('../models/rent-roll-data.model');
const { Op } = require('sequelize');

// POST /api/data-import/rent-roll
// This endpoint uses 'upsert' to create new records or update existing ones.
exports.uploadRentRollData = async (req, res) => {
  const dataToSave = req.body; // Expects an array of { name: "YYYY-MM", value: number }
  if (!Array.isArray(dataToSave) || dataToSave.length === 0) {
    return res.status(400).json({ message: 'Invalid data format.' });
  }

  try {
    // 'upsert' is perfect here: it will UPDATE a row if the 'month' already exists,
    // or INSERT a new row if it doesn't.
    const promises = dataToSave.map(item =>
      RentRollData.upsert({
        month: item.name,
        totalReceivable: item.value
      })
    );
    
    await Promise.all(promises);
    res.status(200).json({ message: 'Data imported successfully.' });

  } catch (error) {
    res.status(500).json({ message: 'Error saving rent roll data', error: error.message });
  }
};

// GET /api/data-import/rent-roll
exports.getRentRollData = async (req, res) => {
    try {
        const data = await RentRollData.findAll({
            order: [['month', 'ASC']] // Always return in chronological order
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rent roll data', error: error.message });
    }
};
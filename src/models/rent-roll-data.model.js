// src/models/rent-roll-data.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RentRollData = sequelize.define('RentRollData', {
  // `id` is created automatically
  month: { // e.g., "2024-05"
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // We only want one entry per month
  },
  totalReceivable: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = RentRollData;
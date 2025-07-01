// src/models/tenant-status-history.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantStatusHistory = sequelize.define('TenantStatusHistory', {
  // `id` is created automatically
  tenantId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changedByUserId: { // Track WHICH admin made the change
    type: DataTypes.STRING,
    allowNull: true // Optional for now
  },
  changeDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  previousState: {
    type: DataTypes.STRING, // e.g., 'Current'
    allowNull: false
  },
  newState: {
    type: DataTypes.STRING, // e.g., 'Default'
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // We can store a snapshot of the detailed state at the time of the change
  details: {
    type: DataTypes.JSONB,
    allowNull: true
  }
});

module.exports = TenantStatusHistory;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomReminder = sequelize.define('CustomReminder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  color: { type: DataTypes.STRING, allowNull: false, defaultValue: 'purple' },
  notes: { type: DataTypes.TEXT },
  // 👇 The recurrence rule object is stored in a single JSONB column
  recurrence: {
    type: DataTypes.JSONB,
    allowNull: true // This is null for non-repeating reminders
  }
});

module.exports = CustomReminder;
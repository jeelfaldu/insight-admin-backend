const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CalendarEvent = sequelize.define("CalendarEvent", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  allDay: { type: DataTypes.BOOLEAN, defaultValue: true },
  color: { type: DataTypes.JSONB }, // Store the { primary, secondary } color object
  // Link back to the source for navigation
  sourceId: { type: DataTypes.STRING, allowNull: false },
  sourceType: { type: DataTypes.STRING, allowNull: false }, // 'property', 'project', 'tenant_checklist'
  url: { type: DataTypes.STRING },
  sourceSignature: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // This database constraint makes it impossible to have duplicates
  },
  isDone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = CalendarEvent;

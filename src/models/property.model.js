// src/models/property.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Property = sequelize.define("Property", {
  // === Primary / System Fields ===
  // 'id', 'createdAt', 'updatedAt' are handled automatically by Sequelize

  // === Summary Tab: Main Details ===
  entityName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  propertyId: { type: DataTypes.STRING, allowNull: false, unique: true },
  alternateId: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  imageUrls: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },

  // === Summary Tab: Location Details ===
  address: { type: DataTypes.JSONB, allowNull: false }, // Storing as JSONB for simplicity (street, city, state, zip)
  county: { type: DataTypes.STRING, allowNull: false },
  countyUrls: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // Changed to support multiple URLs
  city: { type: DataTypes.STRING }, // The optional city field
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  cityParcelId: { type: DataTypes.STRING, allowNull: true },
  // === Summary Tab: Classification ===
  type: {
    type: DataTypes.ENUM(
      "Residential",
      "Commercial",
      "Land",
      "Mixed Use"
    ),
    allowNull: false,
  },
  subType: { type: DataTypes.STRING },
  zoning: { type: DataTypes.STRING },

  // === Key Metrics Tab ===
  totalSqft: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  usableSqft: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  occupancyRate: { type: DataTypes.FLOAT },
  noi: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  noiFrequency: {
    type: DataTypes.ENUM("Monthly", "Annual"),
    allowNull: true,
  },

  // For simplicity, we will store these arrays of objects as JSONB.
  // In a large-scale enterprise app, these would be their own separate SQL tables with relationships.
  units: { type: DataTypes.JSONB, defaultValue: [] }, // From the 'Key Metrics' tab unit form
  taxDetails: { type: DataTypes.JSONB, allowNull: true },
  valueHistory: { type: DataTypes.JSONB, defaultValue: [] }, // From the 'Value History' tab form
  insurance: { type: DataTypes.JSONB, allowNull: true },

  // === Tenants and Documents (placeholders for now) ===
  // In a full relational model, these would be handled by separate Lease and Document tables.
  assignedTenantIds: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // documents: { type: DataTypes.JSONB, defaultValue: [] }
});

module.exports = Property;

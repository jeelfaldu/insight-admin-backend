// src/models/rent-roll-import.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RentRollImport = sequelize.define("RentRollImport", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // The reconciled IDs from our database
  propertyId: { type: DataTypes.STRING, allowNull: false },
  unitId: { type: DataTypes.STRING, allowNull: false },
  tenantId: { type: DataTypes.STRING, allowNull: true }, // Allow null for vacant units

  // Data directly from the CSV
  description: { type: DataTypes.STRING, allowNull: true },
  amountReceivable: { type: DataTypes.FLOAT, allowNull: false },
  lastPaymentDate: { type: DataTypes.DATEONLY, allowNull: true },
  tenantStatus: { type: DataTypes.STRING },

  // For auditing
  importDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  sourceFile: { type: DataTypes.STRING },

  month: {
    type: DataTypes.STRING, // Format: "YYYY-MM"
    allowNull: false,
  },
});

module.exports = RentRollImport;

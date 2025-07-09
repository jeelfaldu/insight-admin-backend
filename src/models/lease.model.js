// src/models/lease.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Lease = sequelize.define(
  "Lease",
  {
    // `id` is created automatically by Sequelize
    propertyId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unitId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // We store the complex schedules as JSONB for simplicity and flexibility
    rentSchedule: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    camitSchedule: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: "manual", // Can be 'manual' or 'csv_import'
    },
    securityDisputeAmount: {
      type: DataTypes.FLOAT,
      allowNull: true, // It's optional
    },
  },
  {
    timestamps: true,
  }
);

// In a more advanced setup, you would define explicit relationships here:
// Lease.belongsTo(Property, { foreignKey: 'propertyId' });
// Lease.belongsTo(Tenant, { foreignKey: 'tenantId' });

module.exports = Lease;

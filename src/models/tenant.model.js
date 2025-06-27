// src/models/tenant.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tenant = sequelize.define(
  "Tenant",
  {
    // `id` is created automatically
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive", "Pending"),
      allowNull: false,
      defaultValue: "Pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    currentState: {
      type: DataTypes.ENUM("Current", "Default"),
      allowNull: false,
      defaultValue: "Current",
    },

    defaultState: {
      type: DataTypes.JSONB,
      allowNull: true, // This entire object can be null if tenant is 'Current'
    },
    // The link to properties/units is now managed by the 'Lease' model,
    // so we don't need to store assignedPropertyId directly on the tenant anymore.
  },
  {
    timestamps: true,
  }
);

module.exports = Tenant;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust path to your Sequelize instance

const ListingInquiry = sequelize.define('ListingInquiry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Use UUIDV4 for auto-generated UUIDs
    primaryKey: true,
    allowNull: false
  },
  propertyAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  listingType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unitInterestedIn: {
    type: DataTypes.JSONB, // Use JSONB for array of strings
    allowNull: true // It's optional
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'listingInquiries', // IMPORTANT: Ensure this matches your Supabase table name
  timestamps: true // Sequelize will manage createdAt and updatedAt
});

module.exports = ListingInquiry;

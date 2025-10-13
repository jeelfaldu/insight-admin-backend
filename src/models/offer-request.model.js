const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OfferRequest = sequelize.define("OfferRequest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  propertyAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  inquirerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  isLegalOwner: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  leaseStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  monthlyRentalIncome: {
    type: DataTypes.DECIMAL(10, 2), // Assuming currency, 10 total digits, 2 after decimal
    allowNull: true,
  },
});

module.exports = OfferRequest;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GetInTouch = sequelize.define("GetInTouch", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    trim: true,
  },
});

module.exports = GetInTouch;

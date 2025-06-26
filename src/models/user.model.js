// src/models/user.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"), // Defines the possible roles
      defaultValue: "user", // All new users will be 'user' by default
      allowNull: false,
    },
  },
  {
    // Use "hooks" to automatically perform an action before saving
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Add a prototype method to compare passwords
User.prototype.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;

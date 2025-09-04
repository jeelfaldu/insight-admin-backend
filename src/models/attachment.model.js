// src/models/attachment.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attachment = sequelize.define("Attachment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  parentId: { type: DataTypes.STRING, allowNull: false },
  parentType: {
    type: DataTypes.ENUM("property", "tenant", "project"),
    allowNull: false,
  },
  fileName: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false }, // URL from S3/Supabase
  folderPath: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING, allowNull: false },
  fileSize: { type: DataTypes.STRING },
});

module.exports = Attachment;

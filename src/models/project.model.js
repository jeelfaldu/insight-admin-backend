// src/models/project.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  // `id` is created automatically by Sequelize
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  linkedPropertyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Planning', 'In Progress', 'On Hold', 'Completed'),
    allowNull: false,
    defaultValue: 'Planning'
  },
  completionDate: {
    type: DataTypes.DATEONLY, // Stores date as 'YYYY-MM-DD' without time
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    // Stores an array of attachment objects directly in the database
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  // Optional: Sequelize will automatically add `createdAt` and `updatedAt` fields
  timestamps: true
});

module.exports = Project;
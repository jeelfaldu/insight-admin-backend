// src/controllers/property.controller.js
const Property = require("../models/property.model");
// You might need your Unit model if you manage them here too
// const Unit = require('../models/unit.model');
const { getCoordsFromAddress } = require("../services/geocoding.service"); // 👈 Import our new service function

// --- GET ALL PROPERTIES ---
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(properties);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching properties", error: error.message });
  }
};

// --- GET ONE PROPERTY BY ID ---
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (property) {
      res.status(200).json(property);
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching property", error: error.message });
  }
};

// --- CREATE NEW PROPERTY ---
exports.createProperty = async (req, res) => {
  try {
    const { summary } = req.body;
    const propertyData = {
      entityName: summary.entityName,
      name: summary.name,
      propertyId: summary.propertyId,
      alternateId: summary.alternateId,
      address: summary.address,
      county: summary.county,
      acres: req.body.metrics?.acres,
      countyUrl: summary.countyUrl,
      city: summary.city,
      cityParcelId: summary?.cityParcelId,
      type: summary.type,
      subType: summary.subType,
      zoning: summary.zoning,
      description: summary.description,
      imageUrls: summary.imageUrls,
    };
    if (propertyData.address) {
      const coords = await getCoordsFromAddress(propertyData.address);
      if (coords && coords?.latitude && coords.longitude) {
        propertyData.latitude = parseFloat(coords.latitude);
        propertyData.longitude = parseFloat(coords.longitude);
      }
    }
    const newProperty = await Property.create(propertyData);
    res.status(201).json(newProperty);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating property", error: error.message });
  }
};

// --- UPDATE A PROPERTY ---
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const updateData = {};
    if (req.body.summary) Object.assign(updateData, req.body.summary);
    if (req.body.metrics) Object.assign(updateData, req.body.metrics);
    if (req.body.tenants) Object.assign(updateData, req.body.tenants);
    if (req.body.history) {
      Object.assign(updateData, { taxDetails: req.body.history.taxDetails }); // Handle arrays directly
      Object.assign(updateData, { valueHistory: req.body.history.entries }); // Handle arrays directly
    }

    await property.update(updateData);
    res.status(200).json(property);
  } catch (error) {
    console.error("Error updating property:", error);
    res
      .status(500)
      .json({ message: "Error updating property", error: error.message });
  }
};

// --- DELETE A PROPERTY ---
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (property) {
      await property.destroy();
      res.status(204).send(); // 204 No Content is standard for a successful delete
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting property", error: error.message });
  }
};

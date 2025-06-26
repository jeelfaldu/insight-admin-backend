// src/controllers/property.controller.js
const Property = require("../models/property.model");
// You might need your Unit model if you manage them here too
// const Unit = require('../models/unit.model');

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
    // Reshape the incoming form data to match the "flat" Property model
    // const propertyData = {
    //   // From summary group
    //   name: req.body.summary.name,
    //   propertyId: req.body.summary.propertyId,
    //   alternateId: req.body.summary.alternateId,
    //   address: req.body.summary.address,
    //   county: req.body.summary.county,
    //   countyUrl: req.body.summary.countyUrl,
    //   type: req.body.summary.type,
    //   subType: req.body.summary.subType,
    //   zoning: req.body.summary.zoning,
    //   description: req.body.summary.description,
    //   imageUrls: req.body.summary.imageUrls,

    //   // From metrics group
    //   totalSqft: req.body.metrics.totalSqft,
    //   usableSqft: req.body.metrics.usableSqft,
    //   occupancyRate: req.body.metrics.occupancyRate,
    //   noi: req.body.metrics.noi,
    //   noiFrequency: req.body.metrics.noiFrequency,

    //   // From other groups (assuming models for these exist and are linked)
    //   units: req.body.metrics.units || [], // This would be more complex, likely its own table
    //   assignedTenantIds: req.body.tenants.assignedTenantIds,
    //   // documents: req.body.documents,
    // };
    const propertyData = {
      entityName: summary.entityName, // 👈 Ensure this line exists
      name: summary.name,
      propertyId: summary.propertyId,
      alternateId: summary.alternateId,
      address: summary.address,
      county: summary.county,
      acres: req.body.metrics?.acres,
      countyUrl: summary.countyUrl,
      city: summary.city,
      type: summary.type,
      subType: summary.subType,
      zoning: summary.zoning,
      // insurance: req.body?.metrics?.insurance,
      // taxDetails: req.body.history?.taxDetails,
      description: summary.description,
      imageUrls: summary.imageUrls,
      // Metrics and other fields will be null/default initially
    };

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

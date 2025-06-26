// src/controllers/project.controller.js
const Project = require('../models/project.model');

// GET /api/projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({ order: [['completionDate', 'ASC']] });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const newProject = await Project.create(req.body);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.update(req.body);
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.destroy();
    res.status(204).send(); // Success, no content to return
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};
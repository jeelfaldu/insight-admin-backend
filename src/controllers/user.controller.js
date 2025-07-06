// src/controllers/user.controller.js
const User = require('../models/user.model');
const { Op } = require('sequelize');

// A helper to format user data for responses, excluding the password
const formatUserResponse = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};

// GET /api/users - Admin Only
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ order: [['username', 'ASC']] });
        res.status(200).json(users.map(formatUserResponse));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// GET /api/users/:id - Admin Only
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// POST /api/users - Admin Only
exports.createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Note: Password will be automatically hashed by the hook in user.model.js
        const newUser = await User.create({ username, password, role });
        res.status(201).json(formatUserResponse(newUser));
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: `Username "${req.body.username}" already exists.` });
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// PUT /api/users/:id - Admin Only
exports.updateUser = async (req, res) => {
    try {
        const { role, username } = req.body; // Can only update role and username
        if (!role && !username) {
            return res.status(400).json({ message: 'A new role or username must be provided.' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (role) user.role = role;
        if (username) user.username = username;
        
        await user.save();
        res.status(200).json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// DELETE /api/users/:id - Admin Only
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add a safety check to prevent an admin from deleting themselves
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'Admins cannot delete their own account.' });
        }

        await user.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};
const GetInTouch = require('../models/get-in-touch.model');

// Create a new get in touch entry
exports.create = async (req, res) => {
    try {
        const newEntry = await GetInTouch.create(req.body);
        res.status(201).send(newEntry);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Retrieve all get in touch entries
exports.findAll = async (req, res) => {
    try {
        const entries = await GetInTouch.findAll();
        res.status(200).send(entries);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Retrieve a single get in touch entry by ID
exports.findOne = async (req, res) => {
    try {
        const entry = await GetInTouch.findByPk(req.params.id);
        if (!entry) {
            return res.status(404).send();
        }
        res.status(200).send(entry);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Update a get in touch entry by ID
exports.update = async (req, res) => {
    try {
        const [updatedRows] = await GetInTouch.update(req.body, {
            where: { id: req.params.id },
            returning: true, // This option is for PostgreSQL, might not work on other DBs
        });
        if (updatedRows === 0) {
            return res.status(404).send();
        }
        const entry = await GetInTouch.findByPk(req.params.id); // Fetch the updated entry
        if (!entry) {
            return res.status(404).send();
        }
        res.status(200).send(entry);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Delete a get in touch entry by ID
exports.delete = async (req, res) => {
    try {
        const deletedRowCount = await GetInTouch.destroy({
            where: { id: req.params.id }
        });
        if (deletedRowCount === 0) {
            return res.status(404).send();
        }
        res.status(200).send({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
};

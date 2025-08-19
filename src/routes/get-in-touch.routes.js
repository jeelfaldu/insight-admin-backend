const express = require('express');
const router = express.Router();
const getInTouchController = require('../controllers/get-in-touch.controller');

// Create a new get in touch entry
router.post('/', getInTouchController.create);

// Retrieve all get in touch entries
router.get('/', getInTouchController.findAll);

// Retrieve a single get in touch entry by ID
router.get('/:id', getInTouchController.findOne);

// Update a get in touch entry by ID
router.put('/:id', getInTouchController.update);

// Delete a get in touch entry by ID
router.delete('/:id', getInTouchController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const boxController = require('../controllers/box.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ==============================================================
// ===             Box API Proxy Routes                       ===
// ==============================================================

// Apply authentication middleware to ALL routes defined in this file.
// This ensures that no unauthenticated user can attempt to access your Box account.
router.use(authMiddleware);


/**
 * @route   GET /api/box/folders/:id/items
 * @desc    Fetches the contents (files and folders) of a specific Box folder.
 *          The ID '0' represents the root folder.
 * @access  Private (Requires valid JWT)
 */
router.get('/folders/:id/items', boxController.getFolderItems);


/**
 * @route   POST /api/box/transfer-to-s3
 * @desc    A two-step process:
 *          1. Downloads a file from Box using the provided fileId.
 *          2. Streams the downloaded content and uploads it to your S3 bucket.
 *          Returns the new S3 URL.
 * @access  Private (Requires valid JWT)
 * @body    { fileId: string, fileName: string }
 */
router.post('/transfer-to-s3', boxController.transferToS3);

/**
 * @route   GET /api/box/search
 * @desc    Searches for files/folders in Box. Requires a ?query= parameter.
 * @access  Private
 */
router.get('/search', boxController.searchFiles);


module.exports = router;
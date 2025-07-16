// src/routes/upload.routes.js
const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../middleware/s3.middleware");
const authMiddleware = require("../middleware/auth.middleware");

// Define the file upload route
// This expects an array of files under the field name 'images'
// POST /api/upload/images
router.post(
  "/images",
  authMiddleware, // Ensure user is authenticated
  uploadMiddleware.upload.array("images", 5), // 'images' is the field name, 5 is the max count
  (req, res) => {
    // If the upload is successful, req.files will be an array of file objects from S3
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }
    // `multer-s3` provides the 'location' key which is the public URL of the uploaded file
    // https://hamfvokuwdzthgkgisxb.supabase.co/storage/v1/object/public/insight.admin.dev/properties/image-1751279312381-388872947.jpeg
    const fileUrls = req.files.map(
      (file) =>
        `https://hamfvokuwdzthgkgisxb.supabase.co/storage/v1/object/public/insight.admin.dev/${file.key}`
    );

    res.status(201).json({
      message: "Files uploaded successfully",
      urls: fileUrls,
    });
  }
);

// delete /api/upload/images/:filename
router.delete(
  "/images",
  authMiddleware, // Ensure user is authenticated
  async (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: "Filename is required." });
      }
      await uploadMiddleware.deleteSingleFile(
        process.env.AWS_S3_BUCKET_NAME,
        filename
      );

      res.status(200).json({
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({ error: "Failed to delete file." });
    }
  }
);

module.exports = router;

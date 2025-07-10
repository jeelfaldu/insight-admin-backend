const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3"); // Import the S3 Client
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();

// --- 1. Create and configure the S3 client instance for V3 ---
// The client will automatically use the credentials from your .env file
const client = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION || "ap-south-1", // Default to 'ap-south-1' if not set
  endpoint: process.env.AWS_S3_ENDPOINT || "https://s3.amazonaws.com", // Optional, set if you have a custom endpoint
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "your_access_key_id",
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY || "your_secret_access_key",
  },
});

// --- 2. Configure multer-s3 with the new V3 client ---
const upload = multer({
  storage: multerS3({
    s3: client, // Pass the new S3Client instance
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: "public-read", // Make the file publicly accessible

    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },

    key: function (req, file, cb) {
      // Create a unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = file.originalname.substring(
        file.originalname.lastIndexOf(".")
      );
      cb(null, `properties/image-${uniqueSuffix}${extension}`);
    },
  }),
});

async function deleteSingleFile(bucketName, fileKey) {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await client.send(command);
    console.log(
      `File '${fileKey}' deleted successfully from bucket '${bucketName}'.`
    );
  } catch (err) {
    console.error("Error deleting file:", err);
  }
}

module.exports = { upload, deleteSingleFile, s3Client: client };

// src/controllers/box.controller.js
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../middleware/s3.middleware");
// Assuming you have your S3 upload middleware configured
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

const BOX_API_URL = "https://api.box.com/2.0";
const BOX_AUTH_HEADER = {
  Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`,
};

// GET /api/box/folders/:id/items
exports.getFolderItems = async (req, res) => {
  const folderId = req.params.id || "0"; // Default to root folder
  try {
    const response = await axios.get(
      `${BOX_API_URL}/folders/${folderId}/items`,
      {
        headers: BOX_AUTH_HEADER,
        params: { fields: "id,type,name,size" }, // Request only the fields we need
      }
    );
    res.status(200).json(response.data.entries);
  } catch (error) {
    console.error("Box API error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch items from Box" });
  }
};

// POST /api/box/transfer-to-s3
exports.transferToS3 = async (req, res) => {
  const { fileId, fileName } = req.body;
  if (!fileId || !fileName)
    return res
      .status(400)
      .json({ message: "fileId and fileName are required" });

  try {
    const fileUrl = `${BOX_API_URL}/files/${fileId}?fields=shared_link`;
    // 1. Download file content from Box
    const fileContentResponse = await axios.put(
      fileUrl,
      {
        shared_link: {
          access: "open",
          password: null,
          unshared_at: getFormattedTimeAfter5Min(),
          permissions: {
            can_download: true,
            can_edit: false,
          },
        },
      },
      {
        headers: BOX_AUTH_HEADER,
      }
    );
    const downloadedFileLink =
      fileContentResponse.data.shared_link.download_url;

    const fileContentResponse2 = await axios.get(downloadedFileLink, {
      headers: BOX_AUTH_HEADER,
      responseType: "arraybuffer", // Get the raw file data
    });

    // 2. Upload that content to S3
    const s3Key = `properties/from-box-${Date.now()}-${fileName}`;
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContentResponse2.data,
      ContentType: fileContentResponse2.headers["content-type"],
    };

    await s3Client.send(new PutObjectCommand(s3Params));

    // Construct the public URL for the newly uploaded S3 object
    const fileUrls = req.files.map(
      (file) =>
        `https://hamfvokuwdzthgkgisxb.supabase.co/storage/v1/object/public/insight.admin.dev/${s3Key}`
    );
    res.status(200).json({
      message: "File transferred successfully",
      url: fileUrls,
      name: fileName,
      size: fileContentResponse.data.length,
    });
  } catch (error) {
    console.error(
      "Box S3 transfer error:",
      error.response?.data || error.message
    );
    console.debug(" fileContentResponse:", error.response?.data.context_info);

    res.status(500).json({ message: "Failed to transfer file to S3" });
  }
};

/**
 * GET /api/box/search?query=some_term
 * Searches for files and folders across the user's entire Box account.
 */
exports.searchFiles = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res
      .status(400)
      .json({ message: "A search query parameter is required." });
  }

  try {
    const response = await axios.get(`${BOX_API_URL}/search`, {
      headers: BOX_AUTH_HEADER,
      params: {
        query: query,
        // We can add more search filters here if needed later
        // e.g., limit, type, file_extensions
        fields: "id,type,name,size,parent", // Request specific fields for a lean response
      },
    });

    res.status(200).json(response.data.entries);
  } catch (error) {
    console.error(
      "Box API search error:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Failed to perform search on Box" });
  }
};
function getFormattedTimeAfter5Min() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);

  const pad = (n) => String(n).padStart(2, "0");

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  // Timezone offset in minutes
  const offsetMin = now.getTimezoneOffset();
  const offsetSign = offsetMin > 0 ? "-" : "+";
  const offsetAbs = Math.abs(offsetMin);
  const offsetHours = pad(Math.floor(offsetAbs / 60));
  const offsetMinutes = pad(offsetAbs % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

console.log(getFormattedTimeAfter5Min());

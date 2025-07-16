const axios = require("axios");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../middleware/s3.middleware");

const BOX_API_URL = "https://api.box.com/2.0";
const BOX_AUTH_HEADER = (token) => ({
  Authorization: `Bearer ${token}`,
});

// GET /api/box/folders/:id/items
exports.getFolderItems = async (req, res) => {
  const folderId = req.params.id || "0"; // Default to root folder
  const boxToken = req.header("boxToken");

  try {
    const response = await axios.get(
      `${BOX_API_URL}/folders/${folderId}/items`,
      {
        headers: BOX_AUTH_HEADER(boxToken),
        params: { fields: "id,type,name,size" }, // Request only the fields we need
      }
    );
    res.status(200).json(response.data.entries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch items from Box",
      unauthorized: error.response.statusText === "Unauthorized",
    });
  }
};

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};

// POST /api/box/transfer-to-s3
exports.transferToS3 = async (req, res) => {
  const { fileId, fileName } = req.body;
  const boxToken = req.header("boxToken");

  if (!fileId || !fileName) {
    return res
      .status(400)
      .json({ message: "fileId and fileName are required" });
  }

  try {
    const findfile = `${BOX_API_URL}/files/${fileId}/content`;
    const findfileUrlRes = await axios.get(findfile, {
      headers: BOX_AUTH_HEADER(boxToken),
      responseType: "stream",
    });

    // Convert stream to buffer
    const buffer = await streamToBuffer(findfileUrlRes.data);

    // Prepare S3 upload
    const newfileName = `from-box-${Date.now()}-${fileName}`;
    const s3Key = `properties/from-box-${newfileName}`;

    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType:
        findfileUrlRes.headers["content-type"] || "application/octet-stream",
      ContentLength: buffer.length,
    };

    await s3Client.send(new PutObjectCommand(s3Params));

    const fileUrl = `https://hamfvokuwdzthgkgisxb.supabase.co/storage/v1/object/public/insight.admin.dev/${s3Key}`;

    res.status(200).json({
      message: "File transferred successfully",
      url: fileUrl,
      name: newfileName,
      size: buffer.length,
    });
  } catch (error) {
    console.error(
      "Box S3 transfer error:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Failed to transfer file to S3" });
  }
};

/**
 * GET /api/box/search?query=some_term
 * Searches for files and folders across the user's entire Box account.
 */
exports.searchFiles = async (req, res) => {
  const { query } = req.query;
  const boxToken = req.header("boxToken");

  if (!query) {
    return res
      .status(400)
      .json({ message: "A search query parameter is required." });
  }

  try {
    const response = await axios.get(`${BOX_API_URL}/search`, {
      headers: BOX_AUTH_HEADER(boxToken),
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

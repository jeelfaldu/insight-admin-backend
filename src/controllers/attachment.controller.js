const Attachment = require("../models/attachment.model");

// GET /api/attachments?parentType=property&parentId=prop1
exports.getAttachments = async (req, res) => {
  try {
    const { parentType, parentId } = req.query;
    const whereClause = {};
    if (parentType) whereClause.parentType = parentType;
    if (parentId) whereClause.parentId = parentId;

    const attachments = await Attachment.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(attachments);
  } catch (error) {
    console.debug(" exports.getAttachments= ~ error:", error);
    res.status(500).json({ message: "Error fetching attachments" });
  }
};

// POST /api/attachments
exports.createAttachment = async (req, res) => {
  try {
    const newAttachment = await Attachment.create(req.body);
    res.status(201).json(newAttachment);
  } catch (error) {
    res.status(500).json({ message: "Error creating attachment record" });
  }
};

// DELETE /api/attachments/:id
exports.deleteAttachment = async (req, res) => {
  // Note: This only deletes the DB record. Your separate S3 route handles file deletion.
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment)
      return res.status(404).json({ message: "Attachment not found" });
    await attachment.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting attachment" });
  }
};

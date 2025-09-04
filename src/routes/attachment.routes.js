const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { attachmentValidationRules, validate } = require('../validators/attachment.validator');

router.use(authMiddleware);

router.get('/', attachmentController.getAttachments);
router.post('/', attachmentValidationRules(), validate, attachmentController.createAttachment);
router.put('/:id', attachmentValidationRules(), validate, attachmentController.updateAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;
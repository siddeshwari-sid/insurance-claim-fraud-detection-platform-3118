const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/upload');

const router = express.Router();

// Memory storage keeps the implementation simple (no local filesystem writes).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * @swagger
 * /upload_csv:
 *   post:
 *     summary: Upload and ingest claims CSV
 *     description: Uploads a CSV file (multipart/form-data, field name "file") and ingests/scored claims into in-memory store.
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Ingest result
 *       400:
 *         description: Invalid request/CSV
 */
router.post('/', upload.single('file'), uploadController.ingestCsv.bind(uploadController));

module.exports = router;

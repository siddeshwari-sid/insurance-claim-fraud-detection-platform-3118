const express = require("express");
const multer = require("multer");
const { claimsStore } = require("../store/claimsStore");
const { parseClaimsCsv } = require("../services/csvIngestService");
const { scoreClaim } = require("../services/fraudEngine");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * @openapi
 * /upload_csv:
 *   post:
 *     tags: [Upload]
 *     summary: Upload claims CSV
 *     description: Upload a CSV file, ingest claims, score them, and return created records.
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
 *         description: Upload summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 imported: { type: number }
 *                 claims:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Claim'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/upload_csv", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file field 'file' (multipart/form-data)" });
  }

  let parsed;
  try {
    parsed = parseClaimsCsv(req.file.buffer);
  } catch (e) {
    return res.status(400).json({ error: "Failed to parse CSV", details: e.message });
  }

  const createdClaims = [];
  for (const partial of parsed) {
    const created = claimsStore.create(partial);
    const { fraud_score, signals } = scoreClaim(created);
    const stored = claimsStore.upsert(created.id, { ...created, fraud_score, signals });
    createdClaims.push(stored);
  }

  return res.json({
    ok: true,
    imported: createdClaims.length,
    claims: createdClaims
  });
});

module.exports = router;

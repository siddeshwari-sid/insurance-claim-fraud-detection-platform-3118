const express = require("express");
const { claimsStore } = require("../store/claimsStore");
const { scoreClaim } = require("../services/fraudEngine");

const router = express.Router();

/**
 * @openapi
 * /claims:
 *   get:
 *     tags: [Claims]
 *     summary: List claims
 *     description: Returns all claims currently stored (in-memory).
 *     responses:
 *       200:
 *         description: List of claims
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Claim'
 */
router.get("/", (req, res) => {
  res.json(claimsStore.list());
});

/**
 * @openapi
 * /claims:
 *   post:
 *     tags: [Claims]
 *     summary: Create claim
 *     description: Creates a claim, applies fraud scoring rules, and returns the stored claim.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClaimRequest'
 *     responses:
 *       201:
 *         description: Created claim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", (req, res) => {
  const body = req.body || {};
  const amount = Number(body.claim_amount);

  if (!Number.isFinite(amount)) {
    return res.status(400).json({ error: "claim_amount must be a number" });
  }

  const created = claimsStore.create(body);
  const { fraud_score, signals } = scoreClaim(created);
  const stored = claimsStore.upsert(created.id, { ...created, fraud_score, signals });

  return res.status(201).json(stored);
});

/**
 * @openapi
 * /claims/{id}:
 *   get:
 *     tags: [Claims]
 *     summary: Get claim by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Claim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       404:
 *         description: Claim not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", (req, res) => {
  const claim = claimsStore.get(req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  return res.json(claim);
});

/**
 * @openapi
 * /claims/{id}:
 *   put:
 *     tags: [Claims]
 *     summary: Update claim
 *     description: Updates a claim and re-applies fraud scoring rules.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClaimRequest'
 *     responses:
 *       200:
 *         description: Updated claim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       404:
 *         description: Claim not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", (req, res) => {
  const existing = claimsStore.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Claim not found" });

  const updates = req.body || {};
  const merged = { ...existing, ...updates };

  const { fraud_score, signals } = scoreClaim(merged);
  const updated = claimsStore.update(req.params.id, { ...updates, fraud_score, signals });

  return res.json(updated);
});

/**
 * @openapi
 * /claims/{id}:
 *   delete:
 *     tags: [Claims]
 *     summary: Delete claim
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deletion status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *       404:
 *         description: Claim not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", (req, res) => {
  const existing = claimsStore.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Claim not found" });

  claimsStore.delete(req.params.id);
  return res.json({ ok: true });
});

module.exports = router;

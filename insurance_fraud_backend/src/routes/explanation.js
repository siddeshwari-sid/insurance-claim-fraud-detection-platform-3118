const express = require("express");
const { claimsStore } = require("../store/claimsStore");
const { scoreClaim } = require("../services/fraudEngine");
const { generateExplanation } = require("../services/explanationService");

const router = express.Router();

/**
 * @openapi
 * /explanation/{claim_id}:
 *   get:
 *     tags: [Explanations]
 *     summary: Get claim explanation
 *     description: Returns a rule-based explanation for a specific claim, including current fraud score and signals.
 *     parameters:
 *       - in: path
 *         name: claim_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Explanation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExplanationResponse'
 *       404:
 *         description: Claim not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/explanation/:claim_id", (req, res) => {
  const id = req.params.claim_id;
  const claim = claimsStore.get(id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  // Ensure claim is scored (in case legacy/seed data changed)
  const { fraud_score, signals } = scoreClaim(claim);
  const stored = claimsStore.upsert(id, { ...claim, fraud_score, signals });

  const explanation = generateExplanation(stored);

  return res.json({
    claim_id: id,
    fraud_score: stored.fraud_score,
    signals: stored.signals,
    explanation
  });
});

module.exports = router;

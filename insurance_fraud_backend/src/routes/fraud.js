const express = require("express");
const { claimsStore } = require("../store/claimsStore");
const { aggregateFraudSignals } = require("../services/fraudEngine");

const router = express.Router();

/**
 * @openapi
 * /fraud_signals:
 *   get:
 *     tags: [Fraud]
 *     summary: Get aggregated fraud signals
 *     description: Returns aggregated fraud signals across all claims (counts per signal and high-risk totals).
 *     responses:
 *       200:
 *         description: Fraud signals aggregation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FraudSignalsResponse'
 */
router.get("/fraud_signals", (req, res) => {
  const claims = claimsStore.list();
  const agg = aggregateFraudSignals(claims);
  res.json(agg);
});

module.exports = router;

const express = require('express');
const fraudSignalsController = require('../controllers/fraudSignals');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FraudSignal:
 *       type: object
 *       description: Fraud signal emitted by the scoring engine for a claim.
 *       properties:
 *         code:
 *           type: string
 *           example: HIGH_AMOUNT
 *         severity:
 *           type: string
 *           description: Severity band of the signal.
 *           example: high
 *           enum: [low, medium, high]
 *         points:
 *           type: number
 *           description: Points contribution when the signal triggers for a claim (if applicable).
 *           example: 35
 *         message:
 *           type: string
 *           description: Human-friendly message shown to users.
 *           example: Claim amount is unusually high.
 *         meta:
 *           type: object
 *           additionalProperties: true
 *           description: Optional metadata attached when a signal triggers on a claim.
 *     FraudSignalCatalogItem:
 *       allOf:
 *         - $ref: '#/components/schemas/FraudSignal'
 *       description: >
 *         Catalog entry describing a possible fraud signal. Catalog entries may omit meta since
 *         meta is typically claim-specific.
 *
 * @swagger
 * /fraud_signals:
 *   get:
 *     summary: List available fraud signals
 *     description: >
 *       Returns the catalog of fraud signals that the backend may emit for a claim.
 *       This is intended for UI display/labeling without exposing internal rule logic.
 *     tags:
 *       - Fraud Signals
 *     responses:
 *       200:
 *         description: Fraud signals catalog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FraudSignalCatalogItem'
 */
router.get('/', fraudSignalsController.list.bind(fraudSignalsController));

module.exports = router;

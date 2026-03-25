const express = require('express');
const claimsController = require('../controllers/claims');

const router = express.Router();

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: List claims
 *     description: Returns a list of claims as JSON (currently in-memory seed data).
 *     tags:
 *       - Claims
 *     responses:
 *       200:
 *         description: Claims list
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: CLM-0001
 *                       policyNumber:
 *                         type: string
 *                         example: POL-10001
 *                       claimantName:
 *                         type: string
 *                         example: John Doe
 *                       lossDate:
 *                         type: string
 *                         example: 2026-01-14
 *                       claimAmount:
 *                         type: number
 *                         example: 12500
 *                       status:
 *                         type: string
 *                         example: open
 *                       riskScore:
 *                         type: number
 *                         example: 0.18
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/', claimsController.list.bind(claimsController));

module.exports = router;

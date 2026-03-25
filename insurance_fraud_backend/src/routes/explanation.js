const express = require('express');
const claimsController = require('../controllers/claims');

const router = express.Router();

/**
 * @swagger
 * /explanation/{claimId}:
 *   get:
 *     summary: Get claim explanation
 *     description: Returns an explanation payload for a claim (generated on-demand, in-memory).
 *     tags:
 *       - Explanation
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Explanation payload
 *       404:
 *         description: Claim not found
 */
router.get('/:claimId', claimsController.getExplanationById.bind(claimsController));

module.exports = router;

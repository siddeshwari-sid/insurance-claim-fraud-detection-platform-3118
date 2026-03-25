const express = require('express');
const claimsController = require('../controllers/claims');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Claim:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: CLM-0001
 *         policy_id:
 *           type: string
 *           example: POL-10001
 *         claimant_name:
 *           type: string
 *           example: John Doe
 *         date_of_loss:
 *           type: string
 *           example: 2026-01-14
 *         claim_amount:
 *           type: number
 *           example: 12500
 *         status:
 *           type: string
 *           example: REVIEW
 *         fraud_score:
 *           type: number
 *           example: 82
 *         fraud_signals:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: List claims
 *     description: Returns a list of claims as JSON (in-memory).
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by workflow status (case-insensitive)
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *         description: Filter by minimum fraud score (0-100)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Substring search across id/policy/claimant fields
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
 *                     $ref: '#/components/schemas/Claim'
 */
router.get('/', claimsController.list.bind(claimsController));

/**
 * @swagger
 * /claims:
 *   post:
 *     summary: Create claim
 *     description: Creates a claim and computes fraud score and signals.
 *     tags:
 *       - Claims
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Claim fields (flexible schema)
 *     responses:
 *       201:
 *         description: Created claim
 */
router.post('/', claimsController.create.bind(claimsController));

/**
 * @swagger
 * /claims/{claimId}:
 *   get:
 *     summary: Get claim by id
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Claim object
 *       404:
 *         description: Claim not found
 */
router.get('/:claimId', claimsController.getById.bind(claimsController));

/**
 * @swagger
 * /claims/{claimId}:
 *   put:
 *     summary: Replace claim
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated claim
 *       404:
 *         description: Claim not found
 */
router.put('/:claimId', claimsController.replace.bind(claimsController));

/**
 * @swagger
 * /claims/{claimId}:
 *   patch:
 *     summary: Patch claim
 *     description: Patches a claim; commonly used to update status.
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: REVIEW
 *     responses:
 *       200:
 *         description: Updated claim
 *       404:
 *         description: Claim not found
 */
router.patch('/:claimId', claimsController.patch.bind(claimsController));

/**
 * @swagger
 * /claims/{claimId}:
 *   delete:
 *     summary: Delete claim
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Claim not found
 */
router.delete('/:claimId', claimsController.remove.bind(claimsController));

module.exports = router;

const express = require('express');
const healthController = require('../controllers/health');
const claimsRouter = require('./claims');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Service health endpoints
 *   - name: Claims
 *     description: Claims CRUD endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

router.use('/claims', claimsRouter);

/**
 * JSON 404 for any non-matched routes mounted under "/".
 * This prevents the default Express HTML error page from being returned.
 */
router.use((req, res) => {
  return res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.originalUrl,
  });
});

module.exports = router;

const express = require('express');
const healthController = require('../controllers/health');
const claimsRouter = require('./claims');
const uploadRouter = require('./upload');
const explanationRouter = require('./explanation');
const fraudSignalsRouter = require('./fraudSignals');
const swaggerSpec = require('../../swagger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Service health endpoints
 *   - name: Claims
 *     description: Claims CRUD endpoints
 *   - name: Upload
 *     description: CSV ingest endpoints
 *   - name: Explanation
 *     description: Explanation endpoints
 *   - name: Fraud Signals
 *     description: Fraud signal catalog endpoints
 */

/**
 * @swagger
 * /openapi.json:
 *   get:
 *     summary: Get OpenAPI spec (JSON)
 *     description: Returns the generated OpenAPI/Swagger specification document as JSON.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: OpenAPI specification JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// PUBLIC_INTERFACE
router.get('/openapi.json', (req, res) => {
  /**
   * Serve OpenAPI/Swagger spec JSON.
   *
   * This mirrors the behavior of the /docs setup in src/app.js by dynamically
   * setting the `servers` URL based on the incoming request.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {import('express').Response} OpenAPI JSON
   */
  const host = req.get('host'); // may or may not include port
  let protocol = req.protocol; // http or https

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
      (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`,
      },
    ],
  };

  return res.status(200).json(dynamicSpec);
});

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
router.use('/fraud_signals', fraudSignalsRouter);
router.use('/upload_csv', uploadRouter);
router.use('/explanation', explanationRouter);

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

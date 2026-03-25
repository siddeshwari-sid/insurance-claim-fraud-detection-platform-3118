/**
 * Fraud signals controller.
 * Exposes the catalog of available fraud signals (codes, severity, and descriptions)
 * without re-exposing internal scoring logic.
 */

const scoringService = require('../services/scoring');

class FraudSignalsController {
  // PUBLIC_INTERFACE
  list(req, res) {
    /**
     * List available fraud signals (catalog).
     *
     * Response shape is consistent with other endpoints: { status: 'ok', data: [...] }.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON payload containing fraud signals catalog
     */
    const data = scoringService.getFraudSignalsCatalog();

    return res.status(200).json({
      status: 'ok',
      data,
    });
  }
}

module.exports = new FraudSignalsController();

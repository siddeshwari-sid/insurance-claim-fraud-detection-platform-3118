/**
 * Claims controller.
 * For now this returns an in-memory list so the frontend can load data without
 * hitting the default Express HTML 404 page.
 */

class ClaimsController {
  constructor() {
    /**
     * In-memory seed claims (placeholder for a DB integration).
     * Keep the shape reasonably generic for frontend consumption.
     * @type {Array<object>}
     */
    this._claims = [
      {
        id: 'CLM-0001',
        policyNumber: 'POL-10001',
        claimantName: 'John Doe',
        lossDate: '2026-01-14',
        claimAmount: 12500,
        status: 'open',
        riskScore: 0.18,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CLM-0002',
        policyNumber: 'POL-10002',
        claimantName: 'Jane Smith',
        lossDate: '2026-02-03',
        claimAmount: 48000,
        status: 'investigate',
        riskScore: 0.82,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // PUBLIC_INTERFACE
  list(req, res) {
    /**
     * List claims.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON list of claims
     */
    return res.status(200).json({
      status: 'ok',
      data: this._claims,
    });
  }
}

module.exports = new ClaimsController();

/**
 * Claims controller.
 * In-memory implementation to support frontend end-to-end without a DB.
 *
 * Response shape notes (frontend expectations):
 * - GET /claims returns either {data:[...]} or [...]. Frontend uses the raw response.
 *   We return {status:'ok', data:[...]}.
 * - GET /claims/:id expects object in {claim|data|<root>}. We return {status:'ok', claim:{...}}.
 * - PATCH /claims/:id expects updated object in {claim|data|<root>}. We return {status:'ok', claim:{...}}.
 */

const { randomUUID } = require('crypto');
const scoringService = require('../services/scoring');
const explanationService = require('../services/explanation');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStatus(s) {
  if (!s) return 'NEW';
  return String(s).toUpperCase();
}

class ClaimsController {
  constructor() {
    /**
     * In-memory claims.
     * @type {Array<object>}
     */
    this._claims = [
      {
        id: 'CLM-0001',
        policy_id: 'POL-10001',
        claimant_name: 'John Doe',
        date_of_loss: '2026-01-14',
        claim_amount: 12500,
        status: 'REVIEW',
        fraud_score: 18,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CLM-0002',
        policy_id: 'POL-10002',
        claimant_name: 'Jane Smith',
        date_of_loss: '2026-02-03',
        claim_amount: 48000,
        status: 'ESCALATED',
        fraud_score: 82,
        createdAt: new Date().toISOString(),
      },
    ];

    /**
     * Cache explanations by claim id (in-memory).
     * @type {Map<string, object>}
     */
    this._explanations = new Map();
  }

  /**
   * Internal helper to find claim index by id.
   * @param {string} id
   * @returns {number}
   */
  _indexOf(id) {
    return this._claims.findIndex((c) => String(c.id) === String(id));
  }

  /**
   * Internal helper to attach explanation caching.
   * @param {object} claim
   * @param {object} scoreResult
   */
  _ensureExplanation(claim, scoreResult) {
    if (!claim?.id) return;
    if (this._explanations.has(claim.id)) return;

    const explanation = explanationService.buildExplanation(claim, scoreResult);
    this._explanations.set(claim.id, explanation);
  }

  // PUBLIC_INTERFACE
  list(req, res) {
    /**
     * List claims with optional filters.
     *
     * Query params:
     * - status: filter by workflow status (case-insensitive)
     * - minScore: minimum fraud score (0-100)
     * - q: substring match across id, policy_id/policyNumber, claimant fields
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON list of claims
     */
    const { status, minScore, q } = req.query || {};
    const statusNorm = status ? normalizeStatus(status) : null;
    const min = minScore !== undefined ? toNumber(minScore, 0) : null;
    const qNorm = q ? String(q).trim().toLowerCase() : null;

    let data = [...this._claims];

    if (statusNorm) {
      data = data.filter((c) => normalizeStatus(c.status) === statusNorm);
    }

    if (min !== null) {
      data = data.filter((c) => toNumber(c.fraud_score ?? c.score ?? c.riskScore ?? c.risk_score, 0) >= min);
    }

    if (qNorm) {
      data = data.filter((c) => {
        const hay = [
          c.id,
          c.policy_id,
          c.policyNumber,
          c.policy,
          c.claimant_name,
          c.claimantName,
          c.claimant,
          c.insured_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(qNorm);
      });
    }

    // Queue expectation: highest fraud_score first.
    // Use stable numeric coercion and deterministic tie-breakers for consistent UI ordering.
    data.sort((a, b) => {
      const as = toNumber(a?.fraud_score ?? a?.score ?? a?.riskScore ?? a?.risk_score, 0);
      const bs = toNumber(b?.fraud_score ?? b?.score ?? b?.riskScore ?? b?.risk_score, 0);
      if (bs !== as) return bs - as;

      const at = Date.parse(a?.createdAt || a?.updatedAt || '') || 0;
      const bt = Date.parse(b?.createdAt || b?.updatedAt || '') || 0;
      if (bt !== at) return bt - at;

      // Final deterministic tie-breaker
      return String(b?.id || '').localeCompare(String(a?.id || ''));
    });

    return res.status(200).json({
      status: 'ok',
      data,
    });
  }

  // PUBLIC_INTERFACE
  getById(req, res) {
    /**
     * Get a single claim by ID.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON claim object
     */
    const { claimId } = req.params;
    const idx = this._indexOf(claimId);
    if (idx < 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    return res.status(200).json({
      status: 'ok',
      claim: this._claims[idx],
    });
  }

  // PUBLIC_INTERFACE
  create(req, res) {
    /**
     * Create a new claim.
     *
     * Body: arbitrary claim-like fields; we will normalize core fields and score it.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON created claim
     */
    const payload = req.body || {};
    const id = payload.id || `CLM-${String(randomUUID()).slice(0, 8).toUpperCase()}`;

    if (this._indexOf(id) >= 0) {
      return res.status(409).json({ status: 'error', message: 'Claim id already exists' });
    }

    const claim = {
      ...payload,
      id,
      policy_id: payload.policy_id || payload.policyNumber || payload.policy || null,
      claimant_name: payload.claimant_name || payload.claimantName || payload.claimant || payload.insured_name || null,
      date_of_loss: payload.date_of_loss || payload.lossDate || payload.loss_date || payload.date || null,
      claim_amount: toNumber(payload.claim_amount ?? payload.claimAmount ?? payload.amount ?? payload.total_amount, 0),
      status: normalizeStatus(payload.status || 'NEW'),
      createdAt: new Date().toISOString(),
    };

    const scoreResult = scoringService.scoreClaim(claim);
    claim.fraud_score = scoreResult.fraud_score;
    claim.fraud_signals = scoreResult.fraud_signals;

    this._claims.unshift(claim);
    this._ensureExplanation(claim, scoreResult);

    return res.status(201).json({
      status: 'ok',
      claim,
    });
  }

  // PUBLIC_INTERFACE
  replace(req, res) {
    /**
     * Replace an existing claim by ID (PUT semantics).
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON updated claim
     */
    const { claimId } = req.params;
    const idx = this._indexOf(claimId);
    if (idx < 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    const payload = req.body || {};
    const claim = {
      ...payload,
      id: claimId,
      policy_id: payload.policy_id || payload.policyNumber || payload.policy || null,
      claimant_name: payload.claimant_name || payload.claimantName || payload.claimant || payload.insured_name || null,
      date_of_loss: payload.date_of_loss || payload.lossDate || payload.loss_date || payload.date || null,
      claim_amount: toNumber(payload.claim_amount ?? payload.claimAmount ?? payload.amount ?? payload.total_amount, 0),
      status: normalizeStatus(payload.status || this._claims[idx]?.status || 'NEW'),
      createdAt: this._claims[idx]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const scoreResult = scoringService.scoreClaim(claim);
    claim.fraud_score = scoreResult.fraud_score;
    claim.fraud_signals = scoreResult.fraud_signals;

    this._claims[idx] = claim;
    this._explanations.delete(claimId);
    this._ensureExplanation(claim, scoreResult);

    return res.status(200).json({
      status: 'ok',
      claim,
    });
  }

  // PUBLIC_INTERFACE
  patch(req, res) {
    /**
     * Patch an existing claim by ID (PATCH semantics).
     * Used by frontend to update status.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON updated claim
     */
    const { claimId } = req.params;
    const idx = this._indexOf(claimId);
    if (idx < 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    const payload = req.body || {};
    const prev = this._claims[idx];

    const next = {
      ...prev,
      ...payload,
      id: prev.id,
      status: payload.status ? normalizeStatus(payload.status) : prev.status,
      updatedAt: new Date().toISOString(),
    };

    // Re-score if any non-status fields changed.
    const shouldRescore = Object.keys(payload).some((k) => k !== 'status');
    if (shouldRescore) {
      const scoreResult = scoringService.scoreClaim(next);
      next.fraud_score = scoreResult.fraud_score;
      next.fraud_signals = scoreResult.fraud_signals;
      this._explanations.delete(claimId);
      this._ensureExplanation(next, scoreResult);
    }

    this._claims[idx] = next;

    return res.status(200).json({
      status: 'ok',
      claim: next,
    });
  }

  // PUBLIC_INTERFACE
  remove(req, res) {
    /**
     * Delete a claim by ID.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response} JSON delete confirmation
     */
    const { claimId } = req.params;
    const idx = this._indexOf(claimId);
    if (idx < 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    const [deleted] = this._claims.splice(idx, 1);
    this._explanations.delete(claimId);

    return res.status(200).json({
      status: 'ok',
      deletedId: deleted.id,
    });
  }

  // PUBLIC_INTERFACE
  listExplanations(req, res) {
    /**
     * Convenience endpoint (internal) to get explanation cache state.
     * Not mounted publicly by default; used by ExplanationController via composition.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response}
     */
    return res.status(200).json({
      status: 'ok',
      data: Array.from(this._explanations.values()),
    });
  }

  // PUBLIC_INTERFACE
  getExplanationById(req, res) {
    /**
     * Fetch explanation for claim id.
     * Will generate on-demand if missing.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response}
     */
    const { claimId } = req.params;
    const idx = this._indexOf(claimId);
    if (idx < 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    const claim = this._claims[idx];
    if (!this._explanations.has(claimId)) {
      const scoreResult = scoringService.scoreClaim(claim);
      this._ensureExplanation(claim, scoreResult);
    }

    return res.status(200).json({
      status: 'ok',
      claimId,
      explanation: this._explanations.get(claimId),
    });
  }

  /**
   * Internal helper used by CSV upload to bulk insert.
   * @param {Array<object>} newClaims
   */
  bulkUpsert(newClaims) {
    const created = [];
    const updated = [];

    for (const raw of newClaims) {
      const id = raw.id || `CLM-${String(randomUUID()).slice(0, 8).toUpperCase()}`;
      const payload = { ...raw, id };

      const claim = {
        ...payload,
        id,
        policy_id: payload.policy_id || payload.policyNumber || payload.policy || null,
        claimant_name: payload.claimant_name || payload.claimantName || payload.claimant || payload.insured_name || null,
        date_of_loss: payload.date_of_loss || payload.lossDate || payload.loss_date || payload.date || null,
        claim_amount: toNumber(payload.claim_amount ?? payload.claimAmount ?? payload.amount ?? payload.total_amount, 0),
        status: normalizeStatus(payload.status || 'NEW'),
      };

      const scoreResult = scoringService.scoreClaim(claim);
      claim.fraud_score = scoreResult.fraud_score;
      claim.fraud_signals = scoreResult.fraud_signals;

      const idx = this._indexOf(id);
      if (idx >= 0) {
        claim.createdAt = this._claims[idx].createdAt || new Date().toISOString();
        claim.updatedAt = new Date().toISOString();
        this._claims[idx] = { ...this._claims[idx], ...claim };
        updated.push(id);
      } else {
        claim.createdAt = new Date().toISOString();
        this._claims.unshift(claim);
        created.push(id);
      }

      this._explanations.delete(id);
      this._ensureExplanation(claim, scoreResult);
    }

    return { created, updated };
  }
}

module.exports = new ClaimsController();

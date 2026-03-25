/**
 * Rule-based scoring engine.
 * Produces:
 * - fraud_score: 0..100 (higher is more suspicious)
 * - fraud_signals: array of rule hits with severity and rationale
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asLower(s) {
  return String(s || '').toLowerCase();
}

function maybeDate(s) {
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

class ScoringService {
  // PUBLIC_INTERFACE
  getFraudSignalsCatalog() {
    /**
     * Return a stable catalog of fraud signals that may be emitted by scoreClaim().
     * This intentionally does not include detailed rule logic, thresholds, or implementation details.
     *
     * @returns {Array<{code:string, severity:'low'|'medium'|'high', points?:number, message:string}>}
     */
    return [
      {
        code: 'HIGH_AMOUNT',
        severity: 'high',
        points: 35,
        message: 'Claim amount is unusually high.',
      },
      {
        code: 'ELEVATED_AMOUNT',
        severity: 'medium',
        points: 18,
        message: 'Claim amount is elevated.',
      },
      {
        code: 'SUSPICIOUS_KEYWORDS',
        severity: 'medium',
        // points vary based on keyword count; omit or keep as a representative max/min could confuse UI
        message: 'Narrative contains suspicious keywords.',
      },
      {
        code: 'RECENT_LOSS_DATE',
        severity: 'low',
        points: 10,
        message: 'Loss date is very recent.',
      },
      {
        code: 'MISSING_FIELDS',
        severity: 'low',
        // points vary based on number of missing fields
        message: 'Claim is missing key fields.',
      },
      {
        code: 'ESCALATED_STATUS',
        severity: 'low',
        points: 8,
        message: 'Claim is already escalated in workflow.',
      },
    ];
  }

  // PUBLIC_INTERFACE
  scoreClaim(claim) {
    /**
     * Score a claim and return fraud_score and fraud_signals.
     *
     * @param {object} claim
     * @returns {{fraud_score:number, fraud_signals:Array<object>}}
     */
    const signals = [];
    let score = 0;

    const amount = toNumber(claim?.claim_amount ?? claim?.claimAmount ?? claim?.amount ?? claim?.total_amount, 0);
    const claimant = claim?.claimant_name || claim?.claimantName || claim?.claimant || claim?.insured_name || '';
    const status = claim?.status || 'NEW';

    // Rule: high amount
    if (amount >= 50000) {
      score += 35;
      signals.push({
        code: 'HIGH_AMOUNT',
        severity: 'high',
        points: 35,
        message: 'Claim amount is unusually high.',
        meta: { amount },
      });
    } else if (amount >= 20000) {
      score += 18;
      signals.push({
        code: 'ELEVATED_AMOUNT',
        severity: 'medium',
        points: 18,
        message: 'Claim amount is elevated.',
        meta: { amount },
      });
    }

    // Rule: suspicious keywords in free-text fields (if present)
    const narrative = asLower(claim?.description || claim?.narrative || claim?.notes || '');
    const keywordHits = ['stolen', 'totaled', 'cash', 'fire', 'arson', 'fraud', 'lawsuit'].filter((k) => narrative.includes(k));
    if (keywordHits.length) {
      const pts = clamp(10 + keywordHits.length * 3, 10, 22);
      score += pts;
      signals.push({
        code: 'SUSPICIOUS_KEYWORDS',
        severity: 'medium',
        points: pts,
        message: 'Narrative contains suspicious keywords.',
        meta: { keywords: keywordHits },
      });
    }

    // Rule: recent loss date (potential rush)
    const lossDateStr = claim?.date_of_loss || claim?.lossDate || claim?.loss_date || claim?.date;
    const lossDate = maybeDate(lossDateStr);
    if (lossDate) {
      const daysAgo = (Date.now() - lossDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo >= 0 && daysAgo <= 7) {
        score += 10;
        signals.push({
          code: 'RECENT_LOSS_DATE',
          severity: 'low',
          points: 10,
          message: 'Loss date is very recent.',
          meta: { lossDate: lossDate.toISOString().slice(0, 10), daysAgo: Math.round(daysAgo) },
        });
      }
    }

    // Rule: missing key fields
    const missing = [];
    if (!claim?.policy_id && !claim?.policyNumber && !claim?.policy) missing.push('policy');
    if (!claimant) missing.push('claimant');
    if (!lossDateStr) missing.push('date_of_loss');
    if (!amount) missing.push('claim_amount');

    if (missing.length) {
      const pts = clamp(missing.length * 6, 6, 20);
      score += pts;
      signals.push({
        code: 'MISSING_FIELDS',
        severity: 'low',
        points: pts,
        message: 'Claim is missing key fields.',
        meta: { missing },
      });
    }

    // Rule: workflow status can slightly bias score
    if (String(status).toUpperCase() === 'ESCALATED') {
      score += 8;
      signals.push({
        code: 'ESCALATED_STATUS',
        severity: 'low',
        points: 8,
        message: 'Claim is already escalated in workflow.',
      });
    }

    // Normalize score
    score = clamp(Math.round(score), 0, 100);

    return { fraud_score: score, fraud_signals: signals };
  }
}

module.exports = new ScoringService();

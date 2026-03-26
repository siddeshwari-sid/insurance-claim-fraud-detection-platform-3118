/**
 * Basic rule-based scoring engine.
 * Rules are intentionally transparent to support "explainable" outputs in the UI.
 */

function daysBetween(iso1, iso2) {
  if (!iso1 || !iso2) return null;
  const d1 = new Date(iso1);
  const d2 = new Date(iso2);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  return Math.round((d2.getTime() - d1.getTime()) / (24 * 3600 * 1000));
}

/**
 * PUBLIC_INTERFACE
 * Scores a claim and returns fraud_score and signals.
 * @param {any} claim Claim object.
 * @returns {{fraud_score:number, signals:string[]}} Risk score and human-readable signals.
 */
function scoreClaim(claim) {
  const signals = [];
  let score = 0;

  const amount = Number(claim.claim_amount || 0);
  const raw = claim.raw && typeof claim.raw === "object" ? claim.raw : {};

  // Rule: very high amount
  if (amount >= 20000) {
    score += 30;
    signals.push("High claim amount (>= $20,000)");
  } else if (amount >= 10000) {
    score += 18;
    signals.push("Elevated claim amount (>= $10,000)");
  }

  // Rule: policy age (if provided in raw)
  const policyAgeDays = raw.policy_age_days !== undefined ? Number(raw.policy_age_days) : null;
  if (policyAgeDays !== null && Number.isFinite(policyAgeDays)) {
    if (policyAgeDays < 30) {
      score += 22;
      signals.push("Policy opened recently (< 30 days)");
    } else if (policyAgeDays < 90) {
      score += 10;
      signals.push("Policy relatively new (< 90 days)");
    }
  }

  // Rule: prior claims count (if provided in raw)
  const priorClaims = raw.prior_claims_12mo !== undefined ? Number(raw.prior_claims_12mo) : null;
  if (priorClaims !== null && Number.isFinite(priorClaims)) {
    if (priorClaims >= 3) {
      score += 20;
      signals.push("Multiple prior claims in last 12 months (>= 3)");
    } else if (priorClaims === 2) {
      score += 12;
      signals.push("Two prior claims in last 12 months");
    }
  }

  // Rule: late-night incident flag
  if (raw.late_night_incident === true || raw.late_night_incident === "true") {
    score += 8;
    signals.push("Incident reported as late-night occurrence");
  }

  // Rule: long delay between incident and submission
  const delayDays = daysBetween(claim.incident_date, claim.submission_date);
  if (delayDays !== null) {
    if (delayDays >= 30) {
      score += 12;
      signals.push("Long delay between incident and submission (>= 30 days)");
    } else if (delayDays >= 14) {
      score += 6;
      signals.push("Moderate delay between incident and submission (>= 14 days)");
    }
  }

  // Clamp to [0, 100]
  score = Math.max(0, Math.min(100, score));

  if (signals.length === 0) {
    signals.push("No significant fraud signals detected by rules");
  }

  return { fraud_score: score, signals };
}

/**
 * PUBLIC_INTERFACE
 * Aggregates fraud signals across claims for dashboard usage.
 * @param {any[]} claims List of claims.
 * @returns {{total_claims:number, high_risk_count:number, by_signal:Array<{signal:string,count:number}>}}
 */
function aggregateFraudSignals(claims) {
  const bySignalMap = new Map();
  let highRiskCount = 0;

  for (const c of claims) {
    if (Number(c.fraud_score || 0) >= 60) highRiskCount += 1;
    const signals = Array.isArray(c.signals) ? c.signals : [];
    for (const s of signals) {
      bySignalMap.set(s, (bySignalMap.get(s) || 0) + 1);
    }
  }

  const by_signal = Array.from(bySignalMap.entries())
    .map(([signal, count]) => ({ signal, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_claims: claims.length,
    high_risk_count: highRiskCount,
    by_signal
  };
}

module.exports = { scoreClaim, aggregateFraudSignals };

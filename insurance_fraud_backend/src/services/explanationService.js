/**
 * PUBLIC_INTERFACE
 * Builds an explanation string for a claim using its signals and fraud score.
 * @param {any} claim Claim object (should already include fraud_score and signals).
 * @returns {string} Human-readable explanation.
 */
function generateExplanation(claim) {
  const score = Number(claim.fraud_score || 0);
  const signals = Array.isArray(claim.signals) ? claim.signals : [];

  const riskLabel = score >= 75 ? "high" : score >= 60 ? "elevated" : score >= 30 ? "moderate" : "low";

  const bullets = signals
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join("\n");

  return (
    `This claim is assessed as ${riskLabel} risk with a fraud score of ${score}/100.\n\n` +
    `Key signals considered:\n${bullets}\n\n` +
    `Note: This is a rule-based assessment intended to help prioritize review; it is not a final determination of fraud.`
  );
}

module.exports = { generateExplanation };

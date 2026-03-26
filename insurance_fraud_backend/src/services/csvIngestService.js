const { parse } = require("csv-parse/sync");

/**
 * Attempts to normalize known header variants into our internal claim shape.
 */
function normalizeRow(row) {
  const get = (keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") return row[k];
    }
    return undefined;
  };

  const claimant_name = get(["claimant_name", "claimant", "name", "claimantName"]);
  const claim_amount = get(["claim_amount", "amount", "claimAmount"]);
  const claim_type = get(["claim_type", "type", "claimType"]);
  const incident_date = get(["incident_date", "incidentDate", "date_of_incident"]);
  const submission_date = get(["submission_date", "submitted_at", "submissionDate", "date_submitted"]);
  const status = get(["status", "claim_status"]);

  // Optional fraud-relevant raw fields if present
  const policy_age_days = get(["policy_age_days", "policyAgeDays"]);
  const prior_claims_12mo = get(["prior_claims_12mo", "priorClaims12mo", "prior_claims"]);
  const late_night_incident = get(["late_night_incident", "lateNightIncident"]);

  const raw = { ...row };
  if (policy_age_days !== undefined) raw.policy_age_days = Number(policy_age_days);
  if (prior_claims_12mo !== undefined) raw.prior_claims_12mo = Number(prior_claims_12mo);
  if (late_night_incident !== undefined)
    raw.late_night_incident = late_night_incident === true || String(late_night_incident).toLowerCase() === "true";

  return {
    claimant_name: claimant_name ? String(claimant_name) : "",
    claim_amount: claim_amount !== undefined ? Number(claim_amount) : 0,
    claim_type: claim_type ? String(claim_type) : "Unknown",
    incident_date: incident_date ? new Date(String(incident_date)).toISOString() : null,
    submission_date: submission_date ? new Date(String(submission_date)).toISOString() : new Date().toISOString(),
    status: status ? String(status) : "Open",
    raw
  };
}

/**
 * PUBLIC_INTERFACE
 * Parses CSV file content into a list of claim objects (without ids).
 * @param {Buffer|string} csvContent CSV bytes or string.
 * @returns {Array<any>} Array of normalized claim objects.
 */
function parseClaimsCsv(csvContent) {
  const contentStr = Buffer.isBuffer(csvContent) ? csvContent.toString("utf-8") : String(csvContent);

  const records = parse(contentStr, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!Array.isArray(records)) return [];

  return records.map(normalizeRow);
}

module.exports = { parseClaimsCsv };

const { v4: uuidv4 } = require("uuid");

/**
 * Simple in-memory store for claims.
 * In a production build, this would be replaced with a persistent DB (e.g., Supabase/Postgres).
 */
class ClaimsStore {
  constructor() {
    /** @type {Map<string, any>} */
    this._claims = new Map();

    // Seed a couple of claims for the UI to render immediately.
    const seed1 = this.create({
      claimant_name: "Alex Johnson",
      claim_amount: 18500,
      claim_type: "Auto",
      incident_date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      submission_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: "In Review",
      raw: { policy_age_days: 25, prior_claims_12mo: 2, late_night_incident: true }
    });

    const seed2 = this.create({
      claimant_name: "Morgan Lee",
      claim_amount: 1200,
      claim_type: "Property",
      incident_date: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
      submission_date: new Date(Date.now() - 49 * 24 * 3600 * 1000).toISOString(),
      status: "Open",
      raw: { policy_age_days: 400, prior_claims_12mo: 0, late_night_incident: false }
    });

    // Ensure seeded claims are scored
    this.upsert(seed1.id, seed1);
    this.upsert(seed2.id, seed2);
  }

  /**
   * PUBLIC_INTERFACE
   * Lists all claims.
   * @returns {any[]} Array of claims.
   */
  list() {
    return Array.from(this._claims.values());
  }

  /**
   * PUBLIC_INTERFACE
   * Retrieves a claim by id.
   * @param {string} id Claim id.
   * @returns {any|null} Claim or null.
   */
  get(id) {
    return this._claims.get(id) || null;
  }

  /**
   * PUBLIC_INTERFACE
   * Creates a new claim with generated id.
   * @param {any} partial Claim fields.
   * @returns {any} Newly created claim object (unscored; scoring typically applied by service).
   */
  create(partial) {
    const nowIso = new Date().toISOString();
    return {
      id: uuidv4(),
      claimant_name: partial.claimant_name || "",
      claim_amount: Number(partial.claim_amount || 0),
      claim_type: partial.claim_type || "Unknown",
      incident_date: partial.incident_date || null,
      submission_date: partial.submission_date || nowIso,
      status: partial.status || "Open",
      fraud_score: Number(partial.fraud_score || 0),
      signals: Array.isArray(partial.signals) ? partial.signals : [],
      raw: partial.raw && typeof partial.raw === "object" ? partial.raw : {}
    };
  }

  /**
   * PUBLIC_INTERFACE
   * Inserts or updates a claim by id.
   * @param {string} id Claim id.
   * @param {any} claim Claim object.
   * @returns {any} Stored claim.
   */
  upsert(id, claim) {
    const stored = { ...claim, id };
    this._claims.set(id, stored);
    return stored;
  }

  /**
   * PUBLIC_INTERFACE
   * Updates an existing claim (partial patch). Returns updated claim or null if not found.
   * @param {string} id Claim id.
   * @param {any} updates Partial updates.
   * @returns {any|null} Updated claim or null.
   */
  update(id, updates) {
    const existing = this.get(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      // Preserve arrays/objects sensibly
      signals: updates.signals !== undefined ? updates.signals : existing.signals,
      raw: updates.raw !== undefined ? updates.raw : existing.raw
    };

    this._claims.set(id, merged);
    return merged;
  }

  /**
   * PUBLIC_INTERFACE
   * Deletes a claim by id.
   * @param {string} id Claim id.
   * @returns {boolean} True if deleted, false if missing.
   */
  delete(id) {
    return this._claims.delete(id);
  }
}

const claimsStore = new ClaimsStore();

module.exports = { claimsStore };

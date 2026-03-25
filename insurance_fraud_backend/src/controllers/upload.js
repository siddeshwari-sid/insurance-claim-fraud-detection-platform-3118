/**
 * CSV upload controller.
 * Accepts multipart/form-data with field "file".
 */

const Papa = require('papaparse');
const claimsController = require('./claims');

function parseCsv(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors && result.errors.length) {
    const first = result.errors[0];
    const msg = first?.message || 'CSV parse error';
    const err = new Error(msg);
    err.details = result.errors;
    throw err;
  }

  return {
    rows: result.data || [],
    fields: result.meta?.fields || [],
  };
}

class UploadController {
  // PUBLIC_INTERFACE
  ingestCsv(req, res) {
    /**
     * Ingest claims from CSV upload.
     * Expects req.file from multer memory storage.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {import('express').Response}
     */
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Missing CSV file (field name: file)' });
    }

    const csvText = req.file.buffer.toString('utf8');
    let parsed;
    try {
      parsed = parseCsv(csvText);
    } catch (e) {
      return res.status(400).json({
        status: 'error',
        message: e?.message || 'Invalid CSV',
        errors: e?.details || undefined,
      });
    }

    // Basic normalization: convert column names to canonical fields when possible.
    const normalized = (parsed.rows || []).map((r) => ({
      id: r.id || r.claim_id || r.claimId,
      policy_id: r.policy_id || r.policy || r.policyNumber || r.policy_number,
      claimant_name: r.claimant_name || r.claimant || r.claimantName || r.insured_name,
      date_of_loss: r.date_of_loss || r.loss_date || r.lossDate || r.date,
      claim_amount: r.claim_amount || r.claimAmount || r.amount || r.total_amount,
      status: r.status,
      description: r.description || r.narrative || r.notes,
      raw: r,
    }));

    const { created, updated } = claimsController.bulkUpsert(normalized);

    return res.status(200).json({
      status: 'ok',
      ingested: normalized.length,
      createdCount: created.length,
      updatedCount: updated.length,
      created,
      updated,
      fields: parsed.fields,
    });
  }
}

module.exports = new UploadController();

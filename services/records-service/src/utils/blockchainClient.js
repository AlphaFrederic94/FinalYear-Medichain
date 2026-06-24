const env = require('../config/env');
const logger = require('./logger');

const BLOCKCHAIN_URL = env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3005';

/**
 * Sends a POST request to the blockchain service.
 */
async function post(path, body, token) {
  try {
    const res = await fetch(`${BLOCKCHAIN_URL}/blockchain${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data.data;
  } catch (err) {
    logger.error('Blockchain client POST error', { path, err: err.message });
    throw err;
  }
}

/**
 * Sends a GET request to the blockchain service.
 */
async function get(path, token) {
  try {
    const res = await fetch(`${BLOCKCHAIN_URL}/blockchain${path}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data.data;
  } catch (err) {
    logger.error('Blockchain client GET error', { path, err: err.message });
    throw err;
  }
}

/**
 * Anchors a record hash on the blockchain.
 */
async function anchorRecord(token, patientDid, recordId, recordType, recordPayload) {
  return post('/anchor', { patientDid, recordId, recordType, recordPayload }, token);
}

/**
 * Verifies a record hash against the blockchain.
 */
async function verifyRecord(token, recordId, currentPayload) {
  return post(`/verify/${recordId}`, { currentPayload }, token);
}

/**
 * Checks consent status on the blockchain.
 */
async function checkConsent(token, patientDid, providerDid) {
  return get(`/consents/check?patientDid=${encodeURIComponent(patientDid)}&providerDid=${encodeURIComponent(providerDid)}`, token);
}

/**
 * Logs a record read/access audit trail on the blockchain.
 */
async function logAccess(token, patientDid, recordId, action) {
  return post('/access/log', { patientDid, recordId, action }, token);
}

/**
 * Retrieves the audit trail for a patient.
 */
async function getAuditTrail(token, patientDid) {
  return get(`/audit/${patientDid}`, token);
}

/**
 * Retrieves the consent history for a patient.
 */
async function getConsentHistory(token, patientDid) {
  return get(`/consents/history/${patientDid}`, token);
}

module.exports = {
  anchorRecord,
  verifyRecord,
  checkConsent,
  logAccess,
  getAuditTrail,
  getConsentHistory,
};

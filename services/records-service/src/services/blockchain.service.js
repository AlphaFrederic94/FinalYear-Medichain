const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DIFFICULTY = 2; // PoW difficulty (number of leading zeros)
const TARGET_PREFIX = '0'.repeat(DIFFICULTY);

/**
 * Calculates the SHA-256 hash of a block.
 */
function calculateBlockHash(index, timestamp, data, previousHash, nonce) {
  const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
  const rawString = `${index}-${timestamp}-${serializedData}-${previousHash}-${nonce}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Proof of Work: Finds a nonce that yields a hash starting with TARGET_PREFIX.
 */
function mine(index, timestamp, data, previousHash) {
  let nonce = 0;
  let hash = '';
  while (true) {
    hash = calculateBlockHash(index, timestamp, data, previousHash, nonce);
    if (hash.startsWith(TARGET_PREFIX)) {
      break;
    }
    nonce++;
  }
  return { nonce, hash };
}

/**
 * Ensures a Genesis block exists in the database.
 */
async function ensureGenesisBlock() {
  const count = await prisma.block.count();
  if (count === 0) {
    const index = 0;
    const timestamp = new Date();
    const data = { message: 'Genesis Block - AfriHealth Chain Initialized' };
    const previousHash = '0'.repeat(64);
    const { nonce, hash } = mine(index, timestamp.toISOString(), data, previousHash);

    await prisma.block.create({
      data: {
        index,
        timestamp,
        previousHash,
        hash,
        data,
        nonce,
      },
    });
    console.log('Genesis block created.');
  }
}

/**
 * Appends a new block to the blockchain after mining it.
 */
async function appendBlock(data) {
  await ensureGenesisBlock();

  // Retrieve the latest block to link to
  const latestBlock = await prisma.block.findFirst({
    orderBy: { index: 'desc' },
  });

  const nextIndex = latestBlock.index + 1;
  const timestamp = new Date();
  const previousHash = latestBlock.hash;

  // Mine the block
  const { nonce, hash } = mine(nextIndex, timestamp.toISOString(), data, previousHash);

  // Store in database
  const createdBlock = await prisma.block.create({
    data: {
      index: nextIndex,
      timestamp,
      previousHash,
      hash,
      data,
      nonce,
    },
  });

  return createdBlock;
}

/**
 * Validates the cryptographic integrity of the entire blockchain.
 */
async function validateChain() {
  const blocks = await prisma.block.findMany({
    orderBy: { index: 'asc' },
  });

  if (blocks.length === 0) return { isValid: true, message: 'Chain is empty' };

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];

    // 1. Recalculate and verify hash matching
    const recalculatedHash = calculateBlockHash(
      current.index,
      current.timestamp.toISOString(),
      current.data,
      current.previousHash,
      current.nonce
    );

    if (current.hash !== recalculatedHash) {
      return {
        isValid: false,
        error: `Invalid hash at index ${current.index}`,
        recalculated: recalculatedHash,
        stored: current.hash,
      };
    }

    // 2. Verify links
    if (i > 0) {
      const previous = blocks[i - 1];
      if (current.previousHash !== previous.hash) {
        return {
          isValid: false,
          error: `Broken link at index ${current.index}: previousHash doesn't match hash of index ${previous.index}`,
        };
      }
    } else {
      // Index 0: previousHash should be genesis format
      if (current.previousHash !== '0'.repeat(64)) {
        return {
          isValid: false,
          error: 'Genesis block previous hash is invalid',
        };
      }
    }
  }

  return { isValid: true, message: 'Blockchain is cryptographically secure' };
}

/**
 * Computes SHA-256 hash of any record payload.
 */
function hashRecord(payload) {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Anchors a medical record hash on the blockchain.
 */
async function anchorRecord(patientDid, recordId, recordType, providerDid, recordPayload) {
  const recordHash = hashRecord(recordPayload);

  const blockData = {
    type: 'RECORD_ANCHOR',
    recordId,
    recordType,
    patientDid,
    providerDid,
    recordHash,
  };

  const block = await appendBlock(blockData);
  return { txId: block.hash, recordHash };
}

/**
 * Verifies if a record's current content matches the blockchain anchor.
 */
async function verifyRecord(recordId, currentPayload) {
  const currentHash = hashRecord(currentPayload);

  // Search the blockchain for an anchor matching this recordId
  const blocks = await prisma.block.findMany({
    where: {
      data: {
        path: ['recordId'],
        equals: recordId,
      },
    },
  });

  const anchorBlock = blocks.find((b) => b.data && b.data.type === 'RECORD_ANCHOR');

  if (!anchorBlock) {
    return { verified: false, error: 'Record not anchored on blockchain' };
  }

  const matches = anchorBlock.data.recordHash === currentHash;
  return {
    verified: matches,
    originalHash: anchorBlock.data.recordHash,
    currentHash,
    anchoredAt: anchorBlock.timestamp,
    txId: anchorBlock.hash,
  };
}

/**
 * Registers a patient consent grant on the blockchain.
 */
async function grantConsent(patientDid, providerDid, scopes, expiresAt, purpose) {
  const blockData = {
    type: 'CONSENT_GRANT',
    patientDid,
    providerDid,
    scopes: Array.isArray(scopes) ? scopes : [scopes],
    expiresAt: new Date(expiresAt).toISOString(),
    purpose: purpose || 'Medical Access',
  };

  const block = await appendBlock(blockData);
  return { txId: block.hash, block };
}

/**
 * Registers a patient consent revocation on the blockchain.
 */
async function revokeConsent(patientDid, providerDid) {
  const blockData = {
    type: 'CONSENT_REVOKE',
    patientDid,
    providerDid,
  };

  const block = await appendBlock(blockData);
  return { txId: block.hash, block };
}

/**
 * Checks consent status between a patient and a provider from blockchain history.
 * A patient always has access to their own records.
 */
async function checkConsent(patientDid, providerDid) {
  if (patientDid === providerDid) return true;

  // Retrieve all blocks involving the patient and provider
  const blocks = await prisma.block.findMany({
    orderBy: { index: 'desc' },
  });

  // Filter and find the latest consent action
  const latestConsent = blocks.map(b => b.data).find(
    (data) =>
      data &&
      (data.type === 'CONSENT_GRANT' || data.type === 'CONSENT_REVOKE') &&
      data.patientDid === patientDid &&
      data.providerDid === providerDid
  );

  if (!latestConsent) {
    return false;
  }

  if (latestConsent.type === 'CONSENT_REVOKE') {
    return false;
  }

  // Check expiration
  if (latestConsent.type === 'CONSENT_GRANT') {
    const expiry = new Date(latestConsent.expiresAt);
    if (expiry < new Date()) {
      return false; // Consent has expired
    }
    return true; // Consent is active
  }

  return false;
}

/**
 * Logs a record access event to the blockchain (Immutable Audit Trail).
 */
async function logAccess(providerDid, patientDid, recordId, action) {
  const blockData = {
    type: 'ACCESS_AUDIT',
    providerDid,
    patientDid,
    recordId,
    action,
    timestamp: new Date().toISOString(),
  };

  const block = await appendBlock(blockData);
  return block.hash;
}

/**
 * Retrieves the audit trail for a patient's records.
 */
async function getAuditTrail(patientDid) {
  const blocks = await prisma.block.findMany({
    orderBy: { index: 'desc' },
  });

  return blocks
    .filter((b) => b.data && b.data.patientDid === patientDid)
    .map((b) => ({
      index: b.index,
      txId: b.hash,
      timestamp: b.timestamp,
      ...b.data,
    }));
}

/**
 * Retrieves the consent history for a patient.
 */
async function getConsentHistory(patientDid) {
  const blocks = await prisma.block.findMany({
    orderBy: { index: 'desc' },
  });

  return blocks
    .filter(
      (b) =>
        b.data &&
        (b.data.type === 'CONSENT_GRANT' || b.data.type === 'CONSENT_REVOKE') &&
        b.data.patientDid === patientDid
    )
    .map((b) => ({
      index: b.index,
      txId: b.hash,
      timestamp: b.timestamp,
      ...b.data,
    }));
}

module.exports = {
  appendBlock,
  validateChain,
  anchorRecord,
  verifyRecord,
  grantConsent,
  revokeConsent,
  checkConsent,
  logAccess,
  getAuditTrail,
  getConsentHistory,
  hashRecord,
};

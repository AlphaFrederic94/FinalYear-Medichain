const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user.id, did: user.did, email: user.email, role: user.role, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' }
  );
};

const generateRefreshToken = () => uuidv4();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);

module.exports = { generateAccessToken, generateRefreshToken, hashToken, verifyAccessToken };

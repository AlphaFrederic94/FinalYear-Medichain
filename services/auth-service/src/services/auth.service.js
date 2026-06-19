const userRepository = require('../repositories/user.repository');
const tokenRepository = require('../repositories/token.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/jwt');
const { generateDID } = require('../utils/did');
const { AppError } = require('../middleware/errorHandler');

const PROVIDER_ROLES = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN'];

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshHash = hashToken(refreshToken);
  await tokenRepository.storeRefreshToken(user.id, refreshHash);
  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
  const { password, deletedAt, ...safe } = user;
  return safe;
};

const registerPatient = async (data) => {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

  const hashed = await hashPassword(data.password);
  const did = generateDID(data.countryCode);

  const user = await userRepository.create({
    ...data,
    password: hashed,
    did,
    role: 'PATIENT',
  });

  const tokens = await issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
};

const registerProvider = async (data) => {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

  if (!PROVIDER_ROLES.includes(data.role)) {
    throw new AppError('Invalid provider role', 400, 'INVALID_ROLE');
  }

  const hashed = await hashPassword(data.password);
  const did = generateDID(data.countryCode);

  const user = await userRepository.create({
    ...data,
    password: hashed,
    did,
  });

  const tokens = await issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
};

const login = async (email, password, ipAddress, userAgent) => {
  const user = await userRepository.findByEmail(email);

  if (!user || !user.isActive) {
    await userRepository.recordLogin(user?.id, ipAddress, userAgent, false).catch(() => {});
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) {
    await userRepository.recordLogin(user.id, ipAddress, userAgent, false);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  await userRepository.recordLogin(user.id, ipAddress, userAgent, true);

  const tokens = await issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
};

const refreshToken = async (token) => {
  const tokenHash = hashToken(token);
  const userId = await tokenRepository.getRefreshToken(tokenHash);

  if (!userId) throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');

  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');

  await tokenRepository.deleteRefreshToken(tokenHash);

  const tokens = await issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
};

const logout = async (refreshTokenValue) => {
  const tokenHash = hashToken(refreshTokenValue);
  await tokenRepository.deleteRefreshToken(tokenHash);
};

const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return sanitizeUser(user);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');

  const hashed = await hashPassword(newPassword);
  await userRepository.update(userId, { password: hashed });
};

module.exports = {
  registerPatient,
  registerProvider,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
};

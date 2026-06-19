const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');
const tokenRepository = require('../../src/repositories/token.repository');
const { comparePassword } = require('../../src/utils/password');

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/token.repository');
jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  hashToken: jest.fn().mockReturnValue('mock-hash'),
}));
jest.mock('../../src/utils/did', () => ({
  generateDID: jest.fn().mockReturnValue('did:afrihealth:CMR-TESTXXXX'),
}));

const mockUser = {
  id: 'user-uuid-1',
  did: 'did:afrihealth:CMR-TESTXXXX',
  email: 'patient@test.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'PATIENT',
  isActive: true,
  countryCode: 'CMR',
  password: 'hashed-password',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  tokenRepository.storeRefreshToken.mockResolvedValue(undefined);
  tokenRepository.deleteRefreshToken.mockResolvedValue(undefined);
  tokenRepository.getRefreshToken.mockResolvedValue(undefined);
  userRepository.recordLogin.mockResolvedValue(undefined);
});

describe('authService.registerPatient', () => {
  test('registers a new patient and returns tokens', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(mockUser);

    const result = await authService.registerPatient({
      firstName: 'John',
      lastName: 'Doe',
      email: 'patient@test.com',
      password: 'password123',
      countryCode: 'CMR',
    });

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.user.password).toBeUndefined();
  });

  test('throws 409 if email already exists', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(
      authService.registerPatient({ email: 'patient@test.com', password: 'pass12345' })
    ).rejects.toMatchObject({ code: 'EMAIL_EXISTS', statusCode: 409 });
  });
});

describe('authService.login', () => {
  test('returns tokens on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(true);

    const result = await authService.login('patient@test.com', 'password123', '127.0.0.1', 'jest');

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.user.password).toBeUndefined();
  });

  test('throws 401 if user not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login('no@one.com', 'pass', '127.0.0.1', 'jest')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  test('throws 401 if password is wrong', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(false);

    await expect(authService.login('patient@test.com', 'wrong', '127.0.0.1', 'jest')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });
});

describe('authService.refreshToken', () => {
  test('returns new tokens for valid refresh token', async () => {
    tokenRepository.getRefreshToken.mockResolvedValue(mockUser.id);
    userRepository.findById.mockResolvedValue(mockUser);

    const result = await authService.refreshToken('valid-refresh-token');

    expect(result.accessToken).toBe('mock-access-token');
    expect(tokenRepository.deleteRefreshToken).toHaveBeenCalled();
  });

  test('throws 401 for invalid refresh token', async () => {
    tokenRepository.getRefreshToken.mockResolvedValue(null);

    await expect(authService.refreshToken('bad-token')).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
      statusCode: 401,
    });
  });
});

describe('authService.changePassword', () => {
  test('changes password successfully', async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(true);
    userRepository.update.mockResolvedValue(mockUser);

    await expect(
      authService.changePassword(mockUser.id, 'current-pass', 'new-password-123')
    ).resolves.toBeUndefined();
  });

  test('throws 400 if current password is wrong', async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(false);

    await expect(
      authService.changePassword(mockUser.id, 'wrong', 'new-password-123')
    ).rejects.toMatchObject({ code: 'WRONG_PASSWORD', statusCode: 400 });
  });
});

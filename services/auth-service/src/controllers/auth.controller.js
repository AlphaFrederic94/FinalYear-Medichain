const authService = require('../services/auth.service');

const registerPatient = async (req, res, next) => {
  try {
    const result = await authService.registerPatient(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const registerProvider = async (req, res, next) => {
  try {
    const result = await authService.registerProvider(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(email, password, ipAddress, userAgent);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.sub);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.sub, currentPassword, newPassword);
    res.status(200).json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
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

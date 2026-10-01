const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.COOKIE_DOMAIN = 'example.com';

const AuthController = require('../src/controllers/auth.controller');
const AuthService = require('../src/services/auth.service');

function createResponse() {
  const response = {
    cookies: [],
    clearedCookies: [],
    statusCode: null,
    body: null,
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies.push({ name, options });
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return response;
}

test('login and refresh issue secure cross-site cookies; logout clears matching scope', async () => {
  const originalLogin = AuthService.login;
  const originalRefresh = AuthService.refreshToken;
  const originalLogout = AuthService.logout;

  try {
    AuthService.login = async () => ({
      user: { user_id: 7 },
      accessToken: 'access',
      refreshToken: 'refresh-one',
    });
    AuthService.refreshToken = async () => ({
      accessToken: 'access-two',
      refreshToken: 'refresh-two',
    });
    AuthService.logout = async () => ({ message: 'Logout successful' });

    const loginResponse = createResponse();
    await AuthController.login({
      body: { email: 'user@example.com', password: 'Strong@123' },
    }, loginResponse);

    const refreshResponse = createResponse();
    await AuthController.refreshToken({
      cookies: { refreshToken: 'refresh-one' },
    }, refreshResponse);

    const logoutResponse = createResponse();
    await AuthController.logout({
      user: { user_id: 7 },
    }, logoutResponse);

    const issuedCookie = loginResponse.cookies[0];
    const rotatedCookie = refreshResponse.cookies[0];
    const clearedCookie = logoutResponse.clearedCookies[0];
    for (const cookie of [issuedCookie, rotatedCookie]) {
      assert.equal(cookie.name, 'refreshToken');
      assert.equal(cookie.options.httpOnly, true);
      assert.equal(cookie.options.secure, true);
      assert.equal(cookie.options.sameSite, 'none');
      assert.equal(cookie.options.path, '/api/auth/refresh-token');
      assert.equal(cookie.options.domain, 'example.com');
    }
    assert.equal(rotatedCookie.value, 'refresh-two');
    assert.equal(clearedCookie.name, 'refreshToken');
    assert.equal(clearedCookie.options.path, issuedCookie.options.path);
    assert.equal(clearedCookie.options.domain, issuedCookie.options.domain);
    assert.equal(clearedCookie.options.secure, issuedCookie.options.secure);
    assert.equal(clearedCookie.options.sameSite, issuedCookie.options.sameSite);
  } finally {
    AuthService.login = originalLogin;
    AuthService.refreshToken = originalRefresh;
    AuthService.logout = originalLogout;
  }
});

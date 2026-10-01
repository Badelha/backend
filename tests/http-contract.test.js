const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const frontendOrigin = 'https://frontend-git-feature-landin-page-badelha.vercel.app';
process.env.CORS_ORIGINS = `${frontendOrigin},http://localhost:3001`;
process.env.CLIENT_URL = frontendOrigin;

const app = require('../src/app');

describe('HTTP API contract and origin policy', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  });

  test('sends credentialed preflight headers for frontend and local development origins', async () => {
    for (const origin of [frontendOrigin, 'http://localhost:3001']) {
      const response = await fetch(`${baseUrl}/api/auth/refresh-token`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      });

      assert.equal(response.status, 204);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
      assert.match(response.headers.get('access-control-allow-headers'), /authorization/i);
      assert.match(response.headers.get('access-control-allow-headers'), /content-type/i);
    }
  });

  test('rejects untrusted origins and preserves the standard error envelope', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        Origin: 'https://untrusted.example',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(Object.keys(body).sort(), ['errors', 'message', 'statusCode', 'success', 'timestamp']);
    assert.equal(body.success, false);
  });

  test('requires an allowed origin for cookie-based refresh requests', async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, 'Refresh requests require an allowed browser origin');
  });

  test('returns envelope errors for unauthenticated protected routes', async () => {
    const response = await fetch(`${baseUrl}/api/auth/profile`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(Object.keys(body).sort(), ['errors', 'message', 'statusCode', 'success', 'timestamp']);
    assert.equal(body.success, false);
  });

  test('does not expose an unwrapped API 404', async () => {
    const response = await fetch(`${baseUrl}/api/not-a-real-route`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(Object.keys(body).sort(), ['errors', 'message', 'statusCode', 'success', 'timestamp']);
  });
});

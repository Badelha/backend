const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { resolveEmailConfig, getTransportOptions } = require('../src/config/email');

describe('SMTP environment configuration', () => {
  test('accepts canonical Render variable names and configures Gmail ports', () => {
    const port465 = resolveEmailConfig({
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '465',
      EMAIL_USER: 'sender@example.com',
      EMAIL_PASS: 'app-password',
    });
    const port587 = resolveEmailConfig({
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      EMAIL_USER: 'sender@example.com',
      EMAIL_PASS: 'app-password',
    });

    assert.equal(port465.configured, true);
    assert.equal(port465.port, 465);
    assert.equal(port465.from, 'sender@example.com');
    assert.deepEqual(port465.missing, []);
    assert.deepEqual(port465.invalid, []);
    assert.deepEqual(getTransportOptions(port465), {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      requireTLS: false,
      auth: { user: 'sender@example.com', pass: 'app-password' },
    });
    assert.equal(port587.configured, true);
    assert.equal(port587.port, 587);
    assert.deepEqual(getTransportOptions(port587), {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'sender@example.com', pass: 'app-password' },
    });
  });

  test('accepts legacy password and SMTP/Mail aliases and reports their source names', () => {
    const config = resolveEmailConfig({
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      MAIL_USER: 'sender@example.com',
      EMAIL_PASSWORD: 'app-password',
    });

    assert.equal(config.configured, true);
    assert.deepEqual(config.aliases, [
      { setting: 'EMAIL_HOST', source: 'SMTP_HOST' },
      { setting: 'EMAIL_PORT', source: 'SMTP_PORT' },
      { setting: 'EMAIL_USER', source: 'MAIL_USER' },
      { setting: 'EMAIL_PASS', source: 'EMAIL_PASSWORD' },
    ]);
  });

  test('reports missing canonical settings without including their values', () => {
    const config = resolveEmailConfig({
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PASSWORD: 'legacy-app-password',
    });

    assert.equal(config.configured, false);
    assert.deepEqual(config.missing, ['EMAIL_USER']);
    assert.deepEqual(config.invalid, []);
    assert.equal(JSON.stringify({
      missing: config.missing,
      invalid: config.invalid,
      aliases: config.aliases,
      sources: config.sources,
    }).includes('legacy-app-password'), false);
  });

  test('rejects invalid SMTP ports', () => {
    const config = resolveEmailConfig({
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_USER: 'sender@example.com',
      EMAIL_PASS: 'app-password',
      EMAIL_PORT: 'not-a-port',
    });

    assert.equal(config.configured, false);
    assert.deepEqual(config.invalid, ['EMAIL_PORT']);
  });
});

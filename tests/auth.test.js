const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');
const {
  GAZA_CITIES,
  isAllowedGazaCity,
  normalizeCityName,
} = require('../src/constants/gazaRegions');
const { serializeUser } = require('../src/utils/userProfile');
const { registerValidator, updateProfileValidator } = require('../src/validators/auth.validator');

async function runValidators(validators, body) {
  const req = { body, cookies: {}, query: {}, params: {}, headers: {} };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
}

describe('Gaza city constants', () => {
  test('includes main Gaza regions for the dropdown', () => {
    assert.ok(GAZA_CITIES.includes('Gaza'));
    assert.ok(GAZA_CITIES.includes('Khan Yunis'));
    assert.ok(GAZA_CITIES.includes('Rafah'));
    assert.ok(GAZA_CITIES.includes('North Gaza'));
    assert.ok(GAZA_CITIES.includes('Deir al-Balah'));
  });

  test('normalizes aliases to canonical dropdown values', () => {
    assert.equal(normalizeCityName('gaza city'), 'Gaza');
    assert.equal(normalizeCityName('Khan Younis'), 'Khan Yunis');
    assert.equal(isAllowedGazaCity('Ramallah'), false);
  });
});

describe('user serializer', () => {
  test('returns city as a dropdown string and keeps address', () => {
    const serialized = serializeUser({
      user_id: 1,
      full_name: 'Test User',
      address: 'Al Remal Street',
      city_id: 5,
      password_hash: 'secret',
      refresh_token: 'tok',
      city: {
        city_id: 5,
        city_name: 'Gaza',
        region: 'Gaza Strip',
        country: 'Palestine',
      },
    });

    assert.equal(serialized.city, 'Gaza');
    assert.equal(serialized.address, 'Al Remal Street');
    assert.equal(serialized.city_id, 5);
    assert.equal(serialized.password_hash, undefined);
    assert.equal(serialized.refresh_token, undefined);
  });
});

describe('register and profile validation', () => {
  test('accepts optional city and address on create', async () => {
    const result = await runValidators(registerValidator, {
      fullName: 'Test User',
      phoneNumber: '0599123456',
      email: 'test.user@example.com',
      password: 'Secret@123',
      city: 'Gaza',
      address: 'Al Remal Street',
    });
    assert.equal(result.isEmpty(), true);
  });

  test('rejects a city that is not a Gaza region', async () => {
    const result = await runValidators(registerValidator, {
      fullName: 'Test User',
      phoneNumber: '0599123456',
      email: 'test.user@example.com',
      password: 'Secret@123',
      city: 'Ramallah',
    });
    assert.equal(result.isEmpty(), false);
    assert.ok(result.array().some((err) => err.path === 'city'));
  });

  test('rejects an address longer than 500 characters', async () => {
    const result = await runValidators(updateProfileValidator, {
      address: 'a'.repeat(501),
    });
    assert.equal(result.isEmpty(), false);
    assert.ok(result.array().some((err) => err.path === 'address'));
  });

  test('accepts profile updates for city and address', async () => {
    const result = await runValidators(updateProfileValidator, {
      city: 'Gaza',
      address: 'Al Remal Street',
    });
    assert.equal(result.isEmpty(), true);
  });
});

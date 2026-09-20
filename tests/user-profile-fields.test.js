require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const canUseDatabase = Boolean(process.env.DATABASE_URL);

describe('city and address persistence', { skip: !canUseDatabase }, () => {
  let prisma;
  let AuthService;
  let UserService;
  let CityService;
  let createdUserId;

  before(async () => {
    prisma = require('../src/config/prisma');
    AuthService = require('../src/services/auth.service');
    UserService = require('../src/services/user.service');
    CityService = require('../src/services/city.service');
    await CityService.ensureGazaCitiesSeeded();
  });

  after(async () => {
    if (prisma && createdUserId) {
      await prisma.user.deleteMany({ where: { user_id: createdUserId } }).catch(() => {});
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  test('creates, updates, and retrieves city and address in PostgreSQL', async () => {
    const suffix = crypto.randomBytes(4).toString('hex');
    const phoneDigits = String(parseInt(suffix, 16) % 1000000).padStart(6, '0');
    const registered = await AuthService.register({
      fullName: 'Profile Fields User',
      phoneNumber: `0599${phoneDigits}`,
      email: `city-address-${suffix}@example.com`,
      password: 'Secret@123',
      city: 'Gaza',
      address: 'Al Remal Street',
    });

    createdUserId = registered.user.user_id;
    assert.equal(registered.user.city, 'Gaza');
    assert.equal(registered.user.address, 'Al Remal Street');

    const stored = await prisma.user.findUnique({
      where: { user_id: createdUserId },
      include: { city: true },
    });
    assert.equal(stored.address, 'Al Remal Street');
    assert.equal(stored.city.city_name, 'Gaza');

    const updated = await UserService.updateProfile(createdUserId, {
      city: 'Rafah',
      address: 'Al Janina neighborhood, next to the market',
    });
    assert.equal(updated.city, 'Rafah');
    assert.equal(updated.address, 'Al Janina neighborhood, next to the market');

    const profile = await AuthService.getProfile(createdUserId);
    assert.equal(profile.city, 'Rafah');
    assert.equal(profile.address, 'Al Janina neighborhood, next to the market');

    const byId = await UserService.getUserById(createdUserId);
    assert.equal(byId.city, 'Rafah');
    assert.equal(byId.address, 'Al Janina neighborhood, next to the market');

    await assert.rejects(
      () => UserService.updateProfile(createdUserId, { city: 'Ramallah' }),
      { message: 'INVALID_CITY' }
    );
  });
});

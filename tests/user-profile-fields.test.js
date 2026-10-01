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
  let ProductService;
  let createdUserId;
  let verificationTokenSent;
  let resetTokenSent;

  const cleanupTestUsers = async () => {
    const users = await prisma.user.findMany({
      where: {
        email: { startsWith: 'city-address-' },
        full_name: 'Profile Fields User',
      },
      select: { user_id: true },
    });
    const userIds = users.map(({ user_id }) => user_id);
    if (userIds.length === 0) return;

    await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { user_id: { in: userIds } },
        select: { product_id: true },
      });
      const productIds = products.map(({ product_id }) => product_id);
      await tx.productTag.deleteMany({ where: { product_id: { in: productIds } } });
      await tx.image.deleteMany({ where: { product_id: { in: productIds } } });
      await tx.product.deleteMany({ where: { product_id: { in: productIds } } });
      await tx.emailVerification.deleteMany({ where: { user_id: { in: userIds } } });
      await tx.passwordReset.deleteMany({ where: { user_id: { in: userIds } } });
      await tx.userRole.deleteMany({ where: { user_id: { in: userIds } } });
      await tx.user.deleteMany({ where: { user_id: { in: userIds } } });
    });
  };

  before(async () => {
    prisma = require('../src/config/prisma');
    const emailService = require('../src/utils/email');
    emailService.sendVerificationEmail = async (email, token) => {
      verificationTokenSent = token;
      return { messageId: 'test-verification' };
    };
    emailService.sendPasswordResetEmail = async (email, token) => {
      resetTokenSent = token;
      return { messageId: 'test-reset' };
    };
    AuthService = require('../src/services/auth.service');
    UserService = require('../src/services/user.service');
    CityService = require('../src/services/city.service');
    ProductService = require('../src/services/product.service');
    await cleanupTestUsers();
    await CityService.ensureGazaCitiesSeeded();
  });

  after(async () => {
    if (prisma) {
      await cleanupTestUsers();
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
    assert.ok(verificationTokenSent);
    const storedVerification = await prisma.emailVerification.findFirst({
      where: { user_id: createdUserId, is_used: false },
    });
    assert.equal(storedVerification.token, verificationTokenSent);
    await assert.rejects(
      () => AuthService.login(registered.user.email, 'Secret@123'),
      { message: 'ACCOUNT_NOT_VERIFIED' }
    );

    await AuthService.verifyEmail(verificationTokenSent);
    await assert.rejects(
      () => AuthService.verifyEmail(verificationTokenSent),
      { message: 'INVALID_TOKEN' }
    );
    const login = await AuthService.login(registered.user.email, 'Secret@123');
    const refreshed = await AuthService.refreshToken(login.refreshToken);
    assert.notEqual(refreshed.refreshToken, login.refreshToken);

    await AuthService.forgotPassword(registered.user.email);
    assert.ok(resetTokenSent);
    await AuthService.resetPassword(resetTokenSent, 'NewSecret@123');
    await assert.rejects(
      () => AuthService.resetPassword(resetTokenSent, 'AnotherSecret@123'),
      { message: 'INVALID_TOKEN' }
    );
    await assert.rejects(
      () => AuthService.login(registered.user.email, 'Secret@123'),
      { message: 'INVALID_CREDENTIALS' }
    );
    const relogin = await AuthService.login(registered.user.email, 'NewSecret@123');
    await AuthService.logout(createdUserId);
    await assert.rejects(
      () => AuthService.refreshToken(relogin.refreshToken),
      { message: 'INVALID_TOKEN' }
    );

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
    assert.equal(updated.average_rating, 0);

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

  test('filters and enforces ownership for product update and deletion', async (t) => {
    const [category, city] = await Promise.all([
      prisma.category.findFirst({
        where: { deleted_at: null },
        select: { category_id: true },
      }),
      CityService.listCities().then((cities) => cities[0]),
    ]);
    if (!category) {
      t.skip('No real category records are available in the test database');
      return;
    }
    assert.ok(city);

    const suffix = crypto.randomBytes(4).toString('hex');
    const phoneDigits = String(parseInt(suffix, 16) % 1000000).padStart(6, '0');
    const otherUser = await AuthService.register({
      fullName: 'Profile Fields User',
      phoneNumber: `0598${phoneDigits}`,
      email: `city-address-${suffix}@example.com`,
      password: 'Secret@123',
      city: 'Gaza',
    });

    const product = await ProductService.createProduct({
      userId: createdUserId,
      categoryId: category.category_id,
      cityId: city.city_id,
      title: 'Integration test product',
      description: 'A valid product for integration testing.',
      condition: 'GOOD',
      price: 0,
      exchangePreference: 'BOTH',
    });

    assert.equal(Number(product.price), 0);
    const listing = await ProductService.getAllProducts({ userId: createdUserId });
    assert.ok(listing.products.some(({ product_id }) => product_id === product.product_id));

    await assert.rejects(
      () => ProductService.updateProduct(product.product_id, otherUser.user.user_id, { title: 'Not owned' }),
      { message: 'NOT_OWNER' }
    );
    await assert.rejects(
      () => ProductService.deleteProduct(product.product_id, otherUser.user.user_id),
      { message: 'NOT_OWNER' }
    );

    await ProductService.updateProduct(product.product_id, createdUserId, {
      title: 'Updated integration product',
    });
    await ProductService.deleteProduct(product.product_id, createdUserId);
  });
});

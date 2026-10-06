/**
 * Additional Seed — Requests, Transactions, Products
 * ---------------------------------------------------
 * Adds NEW demo data on top of the existing seed.js.
 *
 * ✅ Reads (never creates): users, roles, categories, cities, tags
 * ✅ Creates (idempotent): products, images, product_tags,
 *                          exchange_requests, purchase_requests,
 *                          transaction_history, ratings,
 *                          notifications, ads
 *
 * Usage:  node prisma/additional-seed.js
 * Safe to run multiple times.
 */

const prisma = require('../src/config/prisma');

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

const SEED_PREFIX = 'seed:extra'; // used in `notes`/`additional_info` for dedupe

/* ----------------------------------------------------------------
   Idempotent find-or-create
------------------------------------------------------------------*/
async function ensure(model, where, data) {
  const existing = await prisma[model].findFirst({ where });
  if (existing) return existing;
  return prisma[model].create({ data });
}

/* ----------------------------------------------------------------
   1. Load REFERENCES only (never create users/categories/etc.)
------------------------------------------------------------------*/
async function loadReferences() {
  const [
    admin,
    layla,
    omar,
    sara,
    noor,
    reem,
    adam,
    categories,
    cities,
    tags,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'admin@badelha.com' } }),
    prisma.user.findUnique({ where: { email: 'layla.hassan@seed.badelha.com' } }),
    prisma.user.findUnique({ where: { email: 'omar.khalil@seed.badelha.com' } }),
    prisma.user.findUnique({ where: { email: 'sara.nasser@seed.badelha.com' } }),
    prisma.user.findUnique({ where: { email: 'noor.abusamra@seed.badelha.com' } }),
    prisma.user.findUnique({ where: { email: 'reem.eid@seed.badelha.com' } }),
    prisma.user.findUnique({ where: { email: 'adam.shurrab@seed.badelha.com' } }),
    prisma.category.findMany({ where: { deleted_at: null } }),
    prisma.city.findMany(),
    prisma.tag.findMany({ where: { deleted_at: null } }),
  ]);

  // Hard-fail if the base seed didn't run
  const missing = [];
  if (!admin) missing.push('admin@badelha.com');
  if (!layla) missing.push('layla.hassan@seed.badelha.com');
  if (!omar) missing.push('omar.khalil@seed.badelha.com');
  if (!sara) missing.push('sara.nasser@seed.badelha.com');
  if (!noor) missing.push('noor.abusamra@seed.badelha.com');
  if (!reem) missing.push('reem.eid@seed.badelha.com');
  if (!adam) missing.push('adam.shurrab@seed.badelha.com');
  if (missing.length) {
    throw new Error(
      `Missing users: ${missing.join(', ')}\n` +
        `Run the main seed first:  npx prisma db seed`
    );
  }
  if (!categories.length) throw new Error('No categories found. Run main seed first.');
  if (!cities.length) throw new Error('No cities found. Run main seed first.');
  if (!tags.length) throw new Error('No tags found. Run main seed first.');

  // Index by name for quick lookup
  const catByName = Object.fromEntries(categories.map((c) => [c.category_name, c]));
  const cityByName = Object.fromEntries(cities.map((c) => [c.city_name, c]));
  const tagByName = Object.fromEntries(tags.map((t) => [t.tag_name, t]));

  return {
    admin,
    users: { layla, omar, sara, noor, reem, adam },
    catByName,
    cityByName,
    tagByName,
  };
}

/* ----------------------------------------------------------------
   2. Seed 6 new products owned by existing users
------------------------------------------------------------------*/
async function seedProducts(refs) {
  const { users, catByName, cityByName, tagByName } = refs;

  const definitions = [
    {
      key: 'monitor',
      owner: users.layla,
      categoryName: 'إلكترونيات',
      cityName: 'غزة',
      title: 'شاشة كمبيوتر مستعملة 24 إنش',
      description:
        'شاشة سليمة بحالة جيدة، تُستخدم للعمل والدراسة. متاحة للمبادلة أو البيع. المعاينة في مدينة غزة.',
      condition: 'GOOD',
      preference: 'BOTH',
      status: 'AVAILABLE',
      price: '180.00',
      days: 5,
      tags: ['بحالة جيدة', 'استلام من غزة'],
      images: ['seed-extra-monitor-front', 'seed-extra-monitor-back'],
    },
    {
      key: 'desk',
      owner: users.omar,
      categoryName: 'أثاث منزلي',
      cityName: 'خان يونس',
      title: 'مكتب دراسة خشبي بحالة ممتازة',
      description:
        'مكتب خشبي واسع مناسب للطلاب، مع رفّين جانبيين. متاح للمبادلة فقط. الاستلام من خان يونس.',
      condition: 'LIKE_NEW',
      preference: 'EXCHANGE_ONLY',
      status: 'RESERVED',
      price: null,
      days: 12,
      tags: ['مناسب للطلاب'],
      images: ['seed-extra-desk'],
    },
    {
      key: 'rice-cooker',
      owner: users.sara,
      categoryName: 'المنزل والمطبخ',
      cityName: 'دير البلح',
      title: 'قدر طهي أرز كهربائي',
      description:
        'قدر أرز سعة 1.8 لتر يعمل بكفاءة، مع كتيّب الاستخدام الأصلي. متاح للبيع فقط. الاستلام من دير البلح.',
      condition: 'GOOD',
      preference: 'PURCHASE_ONLY',
      status: 'AVAILABLE',
      price: '95.00',
      days: 3,
      tags: ['تمت تجربته'],
      images: ['seed-extra-rice-cooker'],
    },
    {
      key: 'kids-bike',
      owner: users.noor,
      categoryName: 'رياضة وأنشطة خارجية',
      cityName: 'البريج',
      title: 'دراجة أطفال مقاس 16',
      description:
        'دراجة أطفال بحالة جيدة مع العجلات الإضافية. متاحة للمبادلة أو البيع. الاستلام من البريج.',
      condition: 'GOOD',
      preference: 'BOTH',
      status: 'AVAILABLE',
      price: '140.00',
      days: 8,
      tags: ['بحالة جيدة'],
      images: ['seed-extra-kids-bike'],
    },
    {
      key: 'office-chair',
      owner: users.reem,
      categoryName: 'أثاث منزلي',
      cityName: 'رفح',
      title: 'كرسي مكتب قابل للتعديل',
      description:
        'كرسي مكتب بعجلات ومسند ظهر قابل للتعديل. بحالة جيدة. الاستلام من رفح.',
      condition: 'GOOD',
      preference: 'BOTH',
      status: 'AVAILABLE',
      price: '210.00',
      days: 2,
      tags: ['مناسب للطلاب', 'السعر قابل للتفاوض'],
      images: ['seed-extra-office-chair'],
    },
    {
      key: 'sewing-machine',
      owner: users.adam,
      categoryName: 'المنزل والمطبخ',
      cityName: 'بيت لاهيا',
      title: 'ماكينة خياطة منزلية',
      description:
        'ماكينة خياطة تعمل بشكل جيد مع جميع الملحقات. متاحة للبيع. الاستلام من بيت لاهيا.',
      condition: 'FAIR',
      preference: 'PURCHASE_ONLY',
      status: 'AVAILABLE',
      price: '260.00',
      days: 20,
      tags: ['تمت تجربته'],
      images: ['seed-extra-sewing-machine'],
    },
  ];

  const products = {};

  for (const def of definitions) {
    const category = catByName[def.categoryName];
    const city = cityByName[def.cityName];

    if (!category || !city) {
      console.warn(`⚠️  Skipping product "${def.key}": category or city not found.`);
      continue;
    }

    // Dedupe by unique seed marker in additional_info
    const seedMarker = `${SEED_PREFIX}:product:${def.key}`;

    const product = await ensure(
      'product',
      { additional_info: { contains: seedMarker } },
      {
        user_id: def.owner.user_id,
        category_id: category.category_id,
        city_id: city.city_id,
        title: def.title,
        description: def.description,
        condition: def.condition,
        price: def.price,
        exchange_preference: def.preference,
        availability_status: def.status,
        views_count: 30 + Math.floor(Math.random() * 50),
        is_featured: false,
        created_at: daysAgo(def.days),
        updated_at: daysAgo(Math.max(0, def.days - 1)),
        additional_info: `${seedMarker} — الاستلام بالتنسيق في ${def.cityName}، قطاع غزة.`,
      }
    );
    products[def.key] = product;

    // Images
    for (let i = 0; i < def.images.length; i += 1) {
      await ensure(
        'image',
        { product_id: product.product_id, image_order: i },
        {
          product_id: product.product_id,
          image_url: `https://images.example.test/badelha/${def.images[i]}.jpg`,
          image_order: i,
          uploaded_at: daysAgo(Math.max(0, def.days - 1)),
        }
      );
    }

    // Tags
    for (const tagName of def.tags) {
      const tag = tagByName[tagName];
      if (!tag) continue;
      await ensure(
        'productTag',
        { product_id: product.product_id, tag_id: tag.tag_id },
        { product_id: product.product_id, tag_id: tag.tag_id }
      );
    }
  }

  return products;
}

/* ----------------------------------------------------------------
   3. Seed 4 exchange requests (covering all statuses)
------------------------------------------------------------------*/
async function seedExchanges(products, refs) {
  const { users } = refs;

  const scenarios = [
    {
      key: 'pending',
      initiator: users.omar,   // owns 'desk'
      target: users.layla,     // owns 'monitor'
      offered: products.desk,
      requested: products.monitor,
      status: 'PENDING',
      days: 0,
    },
    {
      key: 'accepted',
      initiator: users.sara,   // owns 'rice-cooker'
      target: users.noor,      // owns 'kids-bike'
      offered: products['rice-cooker'],
      requested: products['kids-bike'],
      status: 'ACCEPTED',
      days: 4,
    },
    {
      key: 'completed',
      initiator: users.reem,   // owns 'office-chair'
      target: users.adam,      // owns 'sewing-machine'
      offered: products['office-chair'],
      requested: products['sewing-machine'],
      status: 'COMPLETED',
      days: 30,
    },
    {
      key: 'cancelled',
      initiator: users.noor,   // owns 'kids-bike'
      target: users.layla,     // owns 'monitor'
      offered: products['kids-bike'],
      requested: products.monitor,
      status: 'CANCELLED',
      days: 15,
    },
  ];

  const out = {};
  for (const s of scenarios) {
    if (!s.initiator || !s.target || !s.offered || !s.requested) {
      console.warn(`⚠️  Skipping exchange "${s.key}" — missing refs.`);
      continue;
    }

    const seedMarker = `${SEED_PREFIX}:exchange:${s.key}`;
    const requestedAt = daysAgo(s.days);
    const respondedAt =
      s.status === 'PENDING' ? null : new Date(requestedAt.getTime() + DAY);
    const acceptedAt = ['ACCEPTED', 'COMPLETED'].includes(s.status)
      ? respondedAt
      : null;
    const completedAt =
      s.status === 'COMPLETED'
        ? new Date(requestedAt.getTime() + 3 * DAY)
        : null;
    const cancelledAt = s.status === 'CANCELLED' ? respondedAt : null;

    const ex = await ensure(
      'exchangeRequest',
      { notes: { contains: seedMarker } },
      {
        initiator_user_id: s.initiator.user_id,
        target_user_id: s.target.user_id,
        initiator_product_id: s.offered.product_id,
        target_product_id: s.requested.product_id,
        request_status: s.status,
        initiator_message:
          'مرحبًا، أرى أن منتجاتنا قابلة للمبادلة. هل يناسبك اقتراحي؟',
        target_response_notes:
          s.status === 'PENDING'
            ? null
            : `ردّ تجريبي: حالة الطلب ${s.status}.`,
        requested_at: requestedAt,
        responded_at: respondedAt,
        accepted_at: acceptedAt,
        completed_at: completedAt,
        cancelled_at: cancelledAt,
        notes: `${seedMarker}`,
      }
    );
    out[s.key] = ex;
  }
  return out;
}

/* ----------------------------------------------------------------
   4. Seed 4 purchase requests
------------------------------------------------------------------*/
async function seedPurchases(products, refs) {
  const { users } = refs;

  const scenarios = [
    {
      key: 'pending',
      buyer: users.layla,
      seller: users.sara,     // owns rice-cooker
      product: products['rice-cooker'],
      offeredPrice: '90.00',
      status: 'PENDING',
      days: 1,
    },
    {
      key: 'accepted',
      buyer: users.omar,
      seller: users.adam,     // owns sewing-machine
      product: products['sewing-machine'],
      offeredPrice: '240.00',
      status: 'ACCEPTED',
      days: 3,
    },
    {
      key: 'completed',
      buyer: users.noor,
      seller: users.reem,     // owns office-chair
      product: products['office-chair'],
      offeredPrice: '200.00',
      status: 'COMPLETED',
      days: 22,
    },
    {
      key: 'rejected',
      buyer: users.sara,
      seller: users.layla,    // owns monitor
      product: products.monitor,
      offeredPrice: '120.00',
      status: 'REJECTED',
      days: 10,
    },
  ];

  const out = {};
  for (const s of scenarios) {
    if (!s.buyer || !s.seller || !s.product) {
      console.warn(`⚠️  Skipping purchase "${s.key}" — missing refs.`);
      continue;
    }

    const seedMarker = `${SEED_PREFIX}:purchase:${s.key}`;
    const requestedAt = daysAgo(s.days);
    const respondedAt =
      s.status === 'PENDING' ? null : new Date(requestedAt.getTime() + DAY);
    const acceptedAt = ['ACCEPTED', 'COMPLETED'].includes(s.status)
      ? respondedAt
      : null;
    const completedAt =
      s.status === 'COMPLETED'
        ? new Date(requestedAt.getTime() + 3 * DAY)
        : null;
    const rejectedAt = s.status === 'REJECTED' ? respondedAt : null;

    const pr = await ensure(
      'purchaseRequest',
      { notes: { contains: seedMarker } },
      {
        initiator_user_id: s.buyer.user_id,
        target_user_id: s.seller.user_id,
        product_id: s.product.product_id,
        offered_price: s.offeredPrice,
        request_status: s.status,
        buyer_message:
          'مرحبًا، أنا مهتم بالشراء. هل السعر نهائي؟ وأين يمكن المعاينة؟',
        seller_response_notes:
          s.status === 'PENDING'
            ? null
            : `ردّ تجريبي: حالة الطلب ${s.status}.`,
        requested_at: requestedAt,
        responded_at: respondedAt,
        accepted_at: acceptedAt,
        completed_at: completedAt,
        rejected_at: rejectedAt,
        notes: `${seedMarker}`,
      }
    );
    out[s.key] = pr;
  }
  return out;
}

/* ----------------------------------------------------------------
   5. Seed transaction history for the new requests
------------------------------------------------------------------*/
async function seedHistory(exchanges, purchases) {
  const rows = [];

  const push = (type, id, before, after, actorId, at, note) => {
    rows.push({
      transaction_type: type,
      entity_id: id,
      status_before: before,
      status_after: after,
      changed_by: actorId,
      changed_at: at,
      notes: note,
    });
  };

  for (const [key, ex] of Object.entries(exchanges)) {
    const seedMarker = `${SEED_PREFIX}:history:exchange:${key}`;
    push('EXCHANGE', ex.exchange_request_id, null, 'PENDING',
      ex.initiator_user_id, ex.requested_at,
      `${seedMarker}:created`);

    if (ex.request_status !== 'PENDING') {
      push('EXCHANGE', ex.exchange_request_id, 'PENDING',
        ex.request_status, ex.target_user_id,
        ex.responded_at || ex.requested_at,
        `${seedMarker}:${ex.request_status.toLowerCase()}`);
    }
    if (ex.request_status === 'COMPLETED') {
      push('EXCHANGE', ex.exchange_request_id, 'ACCEPTED', 'COMPLETED',
        ex.target_user_id, ex.completed_at || ex.requested_at,
        `${seedMarker}:completed`);
    }
  }

  for (const [key, pr] of Object.entries(purchases)) {
    const seedMarker = `${SEED_PREFIX}:history:purchase:${key}`;
    push('PURCHASE', pr.purchase_request_id, null, 'PENDING',
      pr.initiator_user_id, pr.requested_at,
      `${seedMarker}:created`);

    if (pr.request_status !== 'PENDING') {
      push('PURCHASE', pr.purchase_request_id, 'PENDING',
        pr.request_status, pr.target_user_id,
        pr.responded_at || pr.requested_at,
        `${seedMarker}:${pr.request_status.toLowerCase()}`);
    }
    if (pr.request_status === 'COMPLETED') {
      push('PURCHASE', pr.purchase_request_id, 'ACCEPTED', 'COMPLETED',
        pr.target_user_id, pr.completed_at || pr.requested_at,
        `${seedMarker}:completed`);
    }
  }

  for (const r of rows) {
    await ensure(
      'transactionHistory',
      {
        transaction_type: r.transaction_type,
        entity_id: r.entity_id,
        notes: r.notes,
      },
      r
    );
  }
}

/* ----------------------------------------------------------------
   6. Ratings for completed transactions
------------------------------------------------------------------*/
async function seedRatings(exchanges, purchases) {
  const ex = exchanges.completed;
  const pr = purchases.completed;

  const ratings = [];

  if (ex) {
    ratings.push(
      {
        rated_entity_type: 'EXCHANGE',
        entity_id: ex.exchange_request_id,
        rater_user_id: ex.initiator_user_id,
        rated_user_id: ex.target_user_id,
        rating_score: 5,
        review: 'تجربة ممتازة، الطرف الآخر متعاون والتسليم في الوقت المحدد.',
      },
      {
        rated_entity_type: 'EXCHANGE',
        entity_id: ex.exchange_request_id,
        rater_user_id: ex.target_user_id,
        rated_user_id: ex.initiator_user_id,
        rating_score: 4,
        review: 'الغرض مطابق للوصف، والتنسيق كان جيدًا.',
      }
    );
  }

  if (pr) {
    ratings.push(
      {
        rated_entity_type: 'PURCHASE',
        entity_id: pr.purchase_request_id,
        rater_user_id: pr.initiator_user_id,
        rated_user_id: pr.target_user_id,
        rating_score: 5,
        review: 'البائع محترم والسعر عادل. تجربة شراء سلسة.',
      },
      {
        rated_entity_type: 'PURCHASE',
        entity_id: pr.purchase_request_id,
        rater_user_id: pr.target_user_id,
        rated_user_id: pr.initiator_user_id,
        rating_score: 5,
        review: 'مشترٍ ملتزم، والدفع كان في الوقت المحدد.',
      }
    );
  }

  for (const r of ratings) {
    await ensure(
      'rating',
      {
        rated_entity_type: r.rated_entity_type,
        entity_id: r.entity_id,
        rater_user_id: r.rater_user_id,
        rated_user_id: r.rated_user_id,
      },
      { ...r, created_at: daysAgo(1) }
    );
  }
}

/* ----------------------------------------------------------------
   7. Notifications tied to the new requests
------------------------------------------------------------------*/
async function seedNotifications(exchanges, purchases) {
  const pendEx = exchanges.pending;
  const pendPr = purchases.pending;
  const accEx = exchanges.accepted;
  const compPr = purchases.completed;

  const rows = [];

  if (pendEx) {
    rows.push({
      user_id: pendEx.target_user_id,
      notification_type: 'EXCHANGE_REQUEST',
      related_entity_type: 'EXCHANGE_REQUEST',
      related_entity_id: pendEx.exchange_request_id,
      message: 'وصلك طلب مبادلة جديد. راجع التفاصيل وقرّر.',
      is_read: false,
    });
  }
  if (pendPr) {
    rows.push({
      user_id: pendPr.target_user_id,
      notification_type: 'PURCHASE_REQUEST',
      related_entity_type: 'PURCHASE_REQUEST',
      related_entity_id: pendPr.purchase_request_id,
      message: 'وصلك عرض شراء جديد على أحد إعلاناتك.',
      is_read: false,
    });
  }
  if (accEx) {
    rows.push({
      user_id: accEx.initiator_user_id,
      notification_type: 'REQUEST_RESPONSE',
      related_entity_type: 'EXCHANGE_REQUEST',
      related_entity_id: accEx.exchange_request_id,
      message: 'تم قبول طلب المبادلة. يمكنك تنسيق الاستلام الآن.',
      is_read: true,
    });
  }
  if (compPr) {
    rows.push({
      user_id: compPr.initiator_user_id,
      notification_type: 'REQUEST_RESPONSE',
      related_entity_type: 'PURCHASE_REQUEST',
      related_entity_id: compPr.purchase_request_id,
      message: 'اكتملت عملية الشراء. شكرًا لاستخدامك بدّلها.',
      is_read: true,
    });
  }

  for (const r of rows) {
    await ensure(
      'notification',
      {
        user_id: r.user_id,
        notification_type: r.notification_type,
        related_entity_id: r.related_entity_id,
      },
      {
        ...r,
        created_at: daysAgo(0),
        read_at: r.is_read ? new Date() : null,
      }
    );
  }
}

/* ----------------------------------------------------------------
   8. Ads for the new products
------------------------------------------------------------------*/
async function seedAds(products, refs) {
  const { admin } = refs;
  if (!admin) return;

  const rows = [
    {
      product: products.monitor,
      position: 'BANNER',
      start: daysAgo(1),
      end: daysFromNow(6),
      order: 1,
    },
    {
      product: products['office-chair'],
      position: 'DASHBOARD',
      start: daysAgo(1),
      end: daysFromNow(10),
      order: 2,
    },
    {
      product: products['kids-bike'],
      position: 'SIDEBAR',
      start: daysAgo(2),
      end: daysFromNow(3),
      order: 3,
    },
  ];

  for (const r of rows) {
    if (!r.product) continue;
    await ensure(
      'ad',
      { product_id: r.product.product_id, ad_position: r.position },
      {
        product_id: r.product.product_id,
        admin_user_id: admin.user_id,
        start_date: r.start,
        end_date: r.end,
        ad_position: r.position,
        display_order: r.order,
        is_active: true,
      }
    );
  }
}

/* ----------------------------------------------------------------
   MAIN
------------------------------------------------------------------*/
async function main() {
  console.log('⏳ Loading references (users, categories, cities, tags)...');
  const refs = await loadReferences();

  console.log('📦 Seeding 6 new products...');
  const products = await seedProducts(refs);

  console.log('🔄 Seeding 4 exchange requests...');
  const exchanges = await seedExchanges(products, refs);

  console.log('💰 Seeding 4 purchase requests...');
  const purchases = await seedPurchases(products, refs);

  console.log('📜 Seeding transaction history...');
  await seedHistory(exchanges, purchases);

  console.log('⭐ Seeding ratings...');
  await seedRatings(exchanges, purchases);

  console.log('🔔 Seeding notifications...');
  await seedNotifications(exchanges, purchases);

  console.log('📢 Seeding ads...');
  await seedAds(products, refs);

  console.log('\n✅ Additional seed completed.');
  console.log('   Users/categories/cities/tags were READ-ONLY (not modified).');
  console.log('   Safe to run again — data is deduplicated by seed markers.');
}

main()
  .catch((err) => {
    console.error('❌ Additional seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
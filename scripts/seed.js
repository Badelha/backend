
const prisma = require('../src/config/prisma');
const { GAZA_CITY_NAMES_ARABIC } = require('../src/constants/gazaRegions');
const CityService = require('../src/services/city.service');
const { hashPassword } = require('../src/utils/bcrypt');

const ADMIN_EMAIL = 'admin@badelha.com';
const ADMIN_PASSWORD = 'Admin@123456';
const DEMO_PASSWORD = 'Demo@123456';
const DAY = 24 * 60 * 60 * 1000;
const EXCHANGE_STATUS_AR = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'مقبولة',
  REJECTED: 'مرفوضة',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
};
const PURCHASE_STATUS_AR = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

function daysAgo(days) {
  return new Date(Date.now() - days * DAY);
}

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY);
}

async function ensureRecord(modelName, where, data) {
  const model = prisma[modelName];
  const existing = await model.findFirst({ where });
  if (existing) {
    return existing;
  }
  return model.create({ data });
}

async function seedReferenceData() {
  const roleDescriptions = {
    USER: 'عضو في سوق بدّلها المجتمعي.',
    ADMIN: 'مسؤول يدير المنصة ومستخدميها.',
    MODERATOR: 'مشرف يتابع البلاغات ومحتوى السوق.',
  };

  const roles = {};
  for (const [role_name, description] of Object.entries(roleDescriptions)) {
    roles[role_name] = await ensureRecord('role', { role_name }, { role_name, description });
  }

  const categoryDefinitions = [
    { key: 'Electronics', legacyName: 'Electronics', name: 'إلكترونيات', description: 'هواتف وحواسيب وأجهزة منزلية متاحة للتبادل أو البيع في غزة.', icon: 'devices', order: 1 },
    { key: 'Mobile Phones', legacyName: 'Mobile Phones', name: 'هواتف محمولة', description: 'هواتف ذكية وملحقاتها.', icon: 'phone', order: 2, parent: 'Electronics' },
    { key: 'Home & Kitchen', legacyName: 'Home & Kitchen', name: 'المنزل والمطبخ', description: 'أدوات منزلية ومستلزمات مطبخ للاستخدام اليومي.', icon: 'home', order: 3 },
    { key: 'Books', legacyName: 'Books', name: 'كتب وقرطاسية', description: 'كتب دراسية ومواد تعليمية وقرطاسية.', icon: 'book', order: 4 },
    { key: 'Sports & Outdoors', legacyName: 'Sports & Outdoors', name: 'رياضة وأنشطة خارجية', description: 'معدات رياضية وأدوات للأنشطة الخارجية.', icon: 'sports', order: 5 },
    { key: 'Furniture', legacyName: 'Furniture', name: 'أثاث منزلي', description: 'أثاث وتجهيزات منزلية.', icon: 'chair', order: 6 },
  ];
  const categories = {};

  for (const definition of categoryDefinitions) {
    const parent = definition.parent ? categories[definition.parent] : null;
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { category_name: definition.name },
          { category_name: definition.legacyName },
        ],
      },
    });
    if (existing) {
      categories[definition.key] = existing;
    } else {
      categories[definition.key] = await prisma.category.create({
        data: {
          category_name: definition.name,
          description: definition.description,
          icon: definition.icon,
          display_order: definition.order,
          parent_category_id: parent ? parent.category_id : null,
        },
      });
    }
  }

  const tagDefinitions = [
    { key: 'good-condition', name: 'بحالة جيدة' },
    { key: 'pickup-gaza', name: 'استلام من غزة' },
    { key: 'exchange', name: 'مبادلة' },
    { key: 'negotiable', name: 'السعر قابل للتفاوض' },
    { key: 'student-friendly', name: 'مناسب للطلاب' },
    { key: 'tested', name: 'تمت تجربته' },
  ];
  const tags = {};
  for (const definition of tagDefinitions) {
    const existing = await prisma.tag.findFirst({
      where: {
        OR: [
          { tag_name: definition.name },
          { tag_name: definition.key },
        ],
      },
    });
    if (existing) {
      tags[definition.key] = existing;
    } else {
      tags[definition.key] = await prisma.tag.create({
        data: { tag_name: definition.name },
      });
    }
  }

  return { roles, categories, tags };
}

async function seedUsers(roles, cities) {
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);
  
  const admin = await ensureRecord('user', { email: ADMIN_EMAIL }, {
    full_name: 'مدير النظام',
    phone_number: '+970599000001',
    address: 'مدينة غزة، قطاع غزة، فلسطين',
    email: ADMIN_EMAIL,
    password_hash: adminPasswordHash,
    account_status: 'ACTIVE',
    last_login: daysAgo(0),
    is_verified: true,
    is_active: true,
    city_id: cities.Gaza.city_id,
  });

  const availableRoles = await prisma.role.findMany({ where: { deleted_at: null } });
  for (const role of availableRoles) {
    const existingUserRole = await prisma.userRole.findFirst({
      where: { user_id: admin.user_id, role_id: role.role_id },
    });
    if (!existingUserRole) {
      await prisma.userRole.create({
        data: { user_id: admin.user_id, role_id: role.role_id, assigned_at: daysAgo(0) },
      });
    }
  }

  const definitions = [
    { key: 'layla', name: 'ليلى حسن', email: 'layla.hassan@seed.badelha.com', phone: '+970599100001', city: 'Gaza', status: 'ACTIVE', verified: true, active: true, role: 'USER', days: 180 },
    { key: 'omar', name: 'عمر خليل', email: 'omar.khalil@seed.badelha.com', phone: '+970599100002', city: 'Khan Yunis', status: 'ACTIVE', verified: true, active: true, role: 'USER', days: 120 },
    { key: 'sara', name: 'سارة ناصر', email: 'sara.nasser@seed.badelha.com', phone: '+970599100003', city: 'Deir al-Balah', status: 'ACTIVE', verified: true, active: true, role: 'MODERATOR', days: 90 },
    { key: 'yousef', name: 'يوسف بركات', email: 'yousef.barakat@seed.badelha.com', phone: '+970599100004', city: 'Rafah', status: 'PENDING_VERIFICATION', verified: false, active: true, role: 'USER', days: 2 },
    { key: 'maha', name: 'مها سليم', email: 'maha.salim@seed.badelha.com', phone: '+970599100005', city: 'Jabalia', status: 'SUSPENDED', verified: true, active: true, role: 'USER', days: 60 },
    { key: 'tariq', name: 'طارق عوض', email: 'tariq.awad@seed.badelha.com', phone: '+970599100006', city: 'Nuseirat', status: 'BANNED', verified: true, active: false, role: 'USER', days: 240 },
    { key: 'noor', name: 'نور أبو سمرة', email: 'noor.abusamra@seed.badelha.com', phone: '+970599100007', city: 'Al-Bureij', status: 'ACTIVE', verified: true, active: true, role: 'USER', days: 14 },
    { key: 'adam', name: 'آدم شُرّاب', email: 'adam.shurrab@seed.badelha.com', phone: '+970599100008', city: 'Beit Lahia', status: 'ACTIVE', verified: true, active: true, role: 'ADMIN', days: 45 },
    { key: 'reem', name: 'ريم عيد', email: 'reem.eid@seed.badelha.com', phone: '+970599100009', city: 'Rafah', status: 'ACTIVE', verified: true, active: true, role: 'USER', days: 1 },
  ];
  const users = { admin };

  for (const definition of definitions) {
    const user = await ensureRecord('user', { email: definition.email }, {
      full_name: definition.name,
      phone_number: definition.phone,
      address: `${GAZA_CITY_NAMES_ARABIC[definition.city]}، قطاع غزة، فلسطين`,
      email: definition.email,
      password_hash: demoPasswordHash,
      account_status: definition.status,
      registration_date: daysAgo(definition.days),
      last_login: definition.verified ? daysAgo(Math.min(definition.days, 3)) : null,
      is_verified: definition.verified,
      is_active: definition.active,
      city_id: cities[definition.city].city_id,
    });
    users[definition.key] = user;

    const role = roles[definition.role];
    const existingUserRole = await prisma.userRole.findFirst({
      where: { user_id: user.user_id, role_id: role.role_id },
    });
    if (!existingUserRole) {
      await prisma.userRole.create({
        data: { user_id: user.user_id, role_id: role.role_id },
      });
    }
  }

  return users;
}

async function seedVerificationWorkflows(users, admin) {
  const verificationScenarios = [
    { user: users.layla, status: 'APPROVED', days: 170, path: 'seed/identity/layla-approved.jpg' },
    { user: users.yousef, status: 'PENDING', days: 1, path: 'seed/identity/yousef-pending.jpg' },
    { user: users.maha, status: 'REJECTED', days: 45, path: 'seed/identity/maha-rejected.jpg' },
  ];

  for (const scenario of verificationScenarios) {
    const approved = scenario.status === 'APPROVED';
    const rejected = scenario.status === 'REJECTED';
    await ensureRecord('userVerification', {
      user_id: scenario.user.user_id,
      id_document_path: scenario.path,
    }, {
      id_document_path: scenario.path,
      verification_status: scenario.status,
      submitted_at: daysAgo(scenario.days),
      verified_at: approved ? daysAgo(scenario.days - 2) : null,
      rejected_at: rejected ? daysAgo(scenario.days - 2) : null,
      rejection_reason: rejected ? 'صورة الهوية غير واضحة؛ يرجى رفع صورة أوضح للتحقق من الحساب.' : null,
      // ✅ FIXED: Use 'verifier' relation instead of 'verified_by'
      verifier: (approved || rejected) ? { connect: { user_id: admin.user_id } } : undefined,
      user: { connect: { user_id: scenario.user.user_id } },
    });
  }

  const emailScenarios = [
    { user: users.yousef, token: 'seed-email-pending-token', expires: daysFromNow(1), verified: null, used: false, days: 1 },
    { user: users.maha, token: 'seed-email-expired-token', expires: daysAgo(40), verified: null, used: false, days: 42 },
    { user: users.layla, token: 'seed-email-used-token', expires: daysAgo(160), verified: daysAgo(170), used: true, days: 170 },
  ];

  for (const scenario of emailScenarios) {
    await ensureRecord('emailVerification', {
      user_id: scenario.user.user_id,
      token: scenario.token,
    }, {
      expires_at: scenario.expires,
      verified_at: scenario.verified,
      is_used: scenario.used,
      created_at: daysAgo(scenario.days),
    });
  }

  const resetScenarios = [
    { user: users.reem, token: 'seed-reset-open-token', expires: daysFromNow(1), used: false, reset: null, days: 0 },
    { user: users.maha, token: 'seed-reset-expired-token', expires: daysAgo(3), used: false, reset: null, days: 5 },
    { user: users.layla, token: 'seed-reset-completed-token', expires: daysAgo(30), used: true, reset: daysAgo(31), days: 32 },
  ];
  for (const scenario of resetScenarios) {
    await ensureRecord('passwordReset', {
      user_id: scenario.user.user_id,
      token: scenario.token,
    }, {
      expires_at: scenario.expires,
      is_used: scenario.used,
      requested_at: daysAgo(scenario.days),
      reset_at: scenario.reset,
    });
  }
}

async function seedProduct({
  key, owner, category, city, title, description, condition, preference,
  status, price, days, views = 0, featured = false, featuredUntil = null,
  archived = false, tags = [], images = [],
}, categories, cities, tagRecords) {
  
  const product = await ensureRecord('product', {
    user_id: owner.user_id,
    OR: [
      { additional_info: { contains: key } },
      { title },
    ],
  }, {
    category_id: categories[category].category_id,
    city_id: cities[city].city_id,
    description,
    condition,
    price,
    exchange_preference: preference,
    availability_status: status,
    views_count: views,
    is_featured: featured,
    featured_until: featuredUntil,
    created_at: daysAgo(days),
    updated_at: daysAgo(Math.max(0, days - 1)),
    additional_info: `المعاينة والاستلام بالتنسيق المسبق في ${GAZA_CITY_NAMES_ARABIC[city]}، قطاع غزة.`,
    deleted_at: archived ? daysAgo(2) : null,
  });

  for (let index = 0; index < images.length; index += 1) {
    await ensureRecord('image', {
      product_id: product.product_id,
      image_order: index,
    }, {
      image_url: `https://images.example.test/badelha/${images[index]}.jpg`,
      uploaded_at: daysAgo(Math.max(0, days - 1)),
    });
  }

  for (const tagName of tags) {
    const existingProductTag = await prisma.productTag.findFirst({
      where: {
        product_id: product.product_id,
        tag_id: tagRecords[tagName].tag_id,
      },
    });
    if (!existingProductTag) {
      await prisma.productTag.create({
        data: {
          product_id: product.product_id,
          tag_id: tagRecords[tagName].tag_id,
        },
      });
    }
  }

  return product;
}

async function seedProducts(users, categories, cities, tags) {
  const products = {};
  const showcase = [
    { key: 'smartphone-available', owner: users.layla, category: 'Mobile Phones', city: 'Gaza', title: 'هاتف سامسونج Galaxy A54 بحالة جيدة', description: 'هاتف مفتوح الشبكة بسعة 128 غيغابايت، مع الشاحن الأصلي وشاشة سليمة. متاح للمبادلة أو للبيع بسعر مناسب، والتسليم داخل مدينة غزة.', condition: 'GOOD', preference: 'BOTH', status: 'AVAILABLE', price: '185.00', days: 8, views: 128, featured: true, featuredUntil: daysFromNow(5), tags: ['good-condition', 'pickup-gaza', 'negotiable'], images: ['galaxy-a54-front', 'galaxy-a54-back'] },
    { key: 'laptop-reserved', owner: users.omar, category: 'Electronics', city: 'Khan Yunis', title: 'حاسوب محمول Lenovo ThinkPad T480', description: 'حاسوب عملي بذاكرة 16 غيغابايت وقرص SSD بسعة 512 غيغابايت. البطارية تعمل ولوحة المفاتيح مجرّبة. المعاينة والاستلام في خان يونس.', condition: 'GOOD', preference: 'BOTH', status: 'RESERVED', price: '320.00', days: 32, views: 94, tags: ['tested', 'good-condition'], images: ['thinkpad-t480'] },
    { key: 'books-exchanged', owner: users.sara, category: 'Books', city: 'Deir al-Balah', title: 'مجموعة كتب لطلاب الهندسة سنة أولى', description: 'كتب نظيفة في أساسيات الهندسة والرياضيات، مناسبة لطلاب الجامعات في قطاع غزة ومتاحة للمبادلة.', condition: 'LIKE_NEW', preference: 'EXCHANGE_ONLY', status: 'EXCHANGED', price: null, days: 110, views: 56, tags: ['student-friendly', 'pickup-gaza'], images: ['engineering-books'] },
    { key: 'kettle-sold', owner: users.noor, category: 'Home & Kitchen', city: 'Al-Bureij', title: 'غلاية كهربائية من الستانلس ستيل', description: 'غلاية سعة 1.7 لتر مع فصل تلقائي، تعمل بشكل جيد وبها آثار استخدام بسيطة موضحة في الصور. الاستلام من البريج.', condition: 'FAIR', preference: 'PURCHASE_ONLY', status: 'SOLD', price: '18.50', days: 75, views: 41, images: ['steel-kettle'] },
    { key: 'chair-removed', owner: users.maha, category: 'Furniture', city: 'Jabalia', title: 'كرسي خشبي للدراسة بحاجة إلى تصليح', description: 'كرسي مستعمل يمكن إصلاحه أو الاستفادة من قطعه؛ إحدى الأرجل تحتاج إلى تثبيت. أُزيل الإعلان بعد ورود بلاغ، للتدريب على مراجعة المحتوى.', condition: 'POOR', preference: 'EXCHANGE_ONLY', status: 'REMOVED', price: null, days: 150, views: 12, archived: true },
    { key: 'football-new', owner: users.reem, category: 'Sports & Outdoors', city: 'Rafah', title: 'كرة قدم جديدة مقاس خمسة', description: 'كرة قدم غير مستعملة، مناسبة للمدرسة واللعب في الحي. الاستلام من رفح.', condition: 'NEW', preference: 'PURCHASE_ONLY', status: 'AVAILABLE', price: '22.00', days: 0, views: 0, images: ['size-five-football'] },
    { key: 'free-desk-lamp', owner: users.layla, category: 'Home & Kitchen', city: 'Gaza', title: 'مصباح مكتب LED مجانًا', description: 'مصباح مكتب يعمل جيدًا ومتاح لمن يحتاجه دون مقابل. الاستلام من مدينة غزة، ويُرجى التنسيق مسبقًا.', condition: 'GOOD', preference: 'EXCHANGE_ONLY', status: 'AVAILABLE', price: null, days: 1, views: 3 },
    { key: 'old-camera', owner: users.adam, category: 'Electronics', city: 'Beit Lahia', title: 'كاميرا رقمية مستعملة مع حقيبتها', description: 'كاميرا صغيرة مجرّبة مع حقيبة حفظ. انتهت مدة الترويج لهذا الإعلان؛ يمكن المعاينة في بيت لاهيا.', condition: 'FAIR', preference: 'BOTH', status: 'AVAILABLE', price: '45.00', days: 365, views: 1200, featured: true, featuredUntil: daysAgo(200), tags: ['tested'], images: ['compact-camera'] },
    { key: 'draft-like-empty', owner: users.reem, category: 'Books', city: 'Rafah', title: 'كراسة لتعلّم اللغة بحالة ممتازة', description: 'إعلان حديث لكتاب تعليمي لم تُضف إليه صور بعد؛ مثال لاختبار ظهور العناصر التي لا تحتوي على صور.', condition: 'LIKE_NEW', preference: 'BOTH', status: 'AVAILABLE', price: '7.00', days: 0, views: 0 },
  ];

  for (const definition of showcase) {
    products[definition.key] = await seedProduct(definition, categories, cities, tags);
  }

  const exchangeStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
  const userPairs = [
    [users.layla, users.omar], [users.omar, users.sara], [users.sara, users.noor],
    [users.noor, users.layla], [users.reem, users.adam],
  ];
  for (let index = 0; index < exchangeStatuses.length; index += 1) {
    const status = exchangeStatuses[index];
    const [firstUser, secondUser] = userPairs[index];
    const productStatus = status === 'PENDING' || status === 'ACCEPTED'
      ? 'RESERVED'
      : status === 'COMPLETED' ? 'EXCHANGED' : 'AVAILABLE';
    const key = status.toLowerCase();
    products[`exchange-${key}-offered`] = await seedProduct({
      key: `exchange-${key}-offered`,
      owner: firstUser,
      category: 'Electronics',
      city: 'Gaza',
      title: `غرض معروض في مبادلة ${EXCHANGE_STATUS_AR[status]}`,
      description: `إعلان تجريبي لغرض متاح للمبادلة في قطاع غزة، لتمثيل حالة «${EXCHANGE_STATUS_AR[status]}».`,
      condition: 'GOOD',
      preference: 'EXCHANGE_ONLY',
      status: productStatus,
      price: null,
      days: index === 0 ? 0 : 20 + index * 15,
      tags: ['good-condition'],
    }, categories, cities, tags);
    products[`exchange-${key}-requested`] = await seedProduct({
      key: `exchange-${key}-requested`,
      owner: secondUser,
      category: 'Home & Kitchen',
      city: 'Khan Yunis',
      title: `غرض مطلوب في مبادلة ${EXCHANGE_STATUS_AR[status]}`,
      description: `غرض منزلي من مستخدم آخر في غزة، مرتبط بسيناريو مبادلة ${EXCHANGE_STATUS_AR[status]}.`,
      condition: 'LIKE_NEW',
      preference: 'EXCHANGE_ONLY',
      status: productStatus,
      price: null,
      days: index === 0 ? 0 : 20 + index * 15,
    }, categories, cities, tags);
  }

  for (let index = 0; index < exchangeStatuses.length; index += 1) {
    const status = exchangeStatuses[index];
    const key = status.toLowerCase();
    const productStatus = status === 'PENDING' || status === 'ACCEPTED'
      ? 'RESERVED'
      : status === 'COMPLETED' ? 'SOLD' : 'AVAILABLE';
    products[`purchase-${key}`] = await seedProduct({
      key: `purchase-${key}`,
      owner: userPairs[index][1],
      category: index % 2 ? 'Books' : 'Electronics',
      city: 'Deir al-Balah',
      title: `إعلان بيع تجريبي - طلب ${PURCHASE_STATUS_AR[status]}`,
      description: `غرض معروض للبيع في قطاع غزة، مرتبط بسيناريو طلب ${PURCHASE_STATUS_AR[status]}.`,
      condition: 'GOOD',
      preference: 'PURCHASE_ONLY',
      status: productStatus,
      price: '35.00',
      days: index === 0 ? 0 : 25 + index * 18,
    }, categories, cities, tags);
  }

  for (let index = 0; index < 12; index += 1) {
    const owner = [users.layla, users.omar, users.sara, users.noor][index % 4];
    const title = `إعلان مجتمعي ${String(index + 1).padStart(2, '0')} - مستلزمات منزلية`;
    products[`volume-${index + 1}`] = await seedProduct({
      key: `volume-${index + 1}`,
      owner,
      category: index % 2 ? 'Home & Kitchen' : 'Books',
      city: ['Gaza', 'Khan Yunis', 'Rafah', 'Nuseirat'][index % 4],
      title,
      description: `إعلان قديم نسبيًا من مستخدم في ${['غزة', 'خان يونس', 'رفح', 'النصيرات'][index % 4]}، لاختبار التصفح والبحث وترتيب الإعلانات في السوق.`,
      condition: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'][index % 4],
      preference: ['BOTH', 'EXCHANGE_ONLY', 'PURCHASE_ONLY'][index % 3],
      status: 'AVAILABLE',
      price: index % 3 ? `${(12 + index * 4).toFixed(2)}` : null,
      days: 15 + index * 11,
      views: index * 37,
      tags: index % 2 ? ['student-friendly'] : ['pickup-gaza'],
      images: index % 3 ? [] : [`community-item-${index + 1}`],
    }, categories, cities, tags);
  }

  return products;
}

async function seedRequests(users, products, admin) {
  const statuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
  const historyRecords = [];
  const exchangeIds = {};
  const purchaseIds = {};

  for (let index = 0; index < statuses.length; index += 1) {
    const status = statuses[index];
    const lower = status.toLowerCase();
    const [initiator, target] = [
      [users.layla, users.omar], [users.omar, users.sara], [users.sara, users.noor],
      [users.noor, users.layla], [users.reem, users.adam],
    ][index];
    const requestedAt = daysAgo(index === 0 ? 0 : 15 + index * 20);
    const respondedAt = status === 'PENDING' ? null : new Date(requestedAt.getTime() + DAY);
    const acceptedAt = status === 'ACCEPTED' || status === 'COMPLETED' ? respondedAt : null;
    const completedAt = status === 'COMPLETED' ? new Date(requestedAt.getTime() + 3 * DAY) : null;
    const rejectedAt = status === 'REJECTED' ? respondedAt : null;
    const cancelledAt = status === 'CANCELLED' ? respondedAt : null;
    const commonDates = {
      request_status: status,
      requested_at: requestedAt,
      responded_at: respondedAt,
      accepted_at: acceptedAt,
      completed_at: completedAt,
      rejected_at: rejectedAt,
      cancelled_at: cancelledAt,
    };

    const exchangeNotes = `طلب مبادلة تجريبي بحالة ${EXCHANGE_STATUS_AR[status]}.`;
    const purchaseNotes = `طلب شراء تجريبي بحالة ${PURCHASE_STATUS_AR[status]}.`;
    
    const exchange = await ensureRecord('exchangeRequest', {
      OR: [
        { notes: `seed:exchange:${lower}` },
        { notes: exchangeNotes },
      ],
    }, {
      initiator_user_id: initiator.user_id,
      target_user_id: target.user_id,
      initiator_product_id: products[`exchange-${lower}-offered`].product_id,
      target_product_id: products[`exchange-${lower}-requested`].product_id,
      ...commonDates,
      initiator_message: 'مرحبًا، هل تناسبك هذه المبادلة؟ يمكننا تنسيق المعاينة والاستلام في مكان مناسب داخل غزة.',
      target_response_notes: status === 'PENDING' ? null : `ردّ تجريبي من صاحب الإعلان: حالة الطلب ${EXCHANGE_STATUS_AR[status]}.`,
      notes: exchangeNotes,
    });
    exchangeIds[status] = exchange.exchange_request_id;

    const purchase = await ensureRecord('purchaseRequest', {
      OR: [
        { notes: `seed:purchase:${lower}` },
        { notes: purchaseNotes },
      ],
    }, {
      initiator_user_id: initiator.user_id,
      target_user_id: target.user_id,
      product_id: products[`purchase-${lower}`].product_id,
      offered_price: status === 'REJECTED' ? '20.00' : '35.00',
      ...commonDates,
      buyer_message: 'مرحبًا، أنا مهتم بالشراء. هل السعر نهائي، وأين يمكن المعاينة والاستلام؟',
      seller_response_notes: status === 'PENDING' ? null : `ردّ تجريبي من البائع: حالة الطلب ${PURCHASE_STATUS_AR[status]}.`,
      notes: purchaseNotes,
    });
    purchaseIds[status] = purchase.purchase_request_id;

    let transitions;
    if (status === 'PENDING') {
      transitions = [{ before: null, after: 'PENDING', actor: initiator, suffix: 'created' }];
    } else if (status === 'COMPLETED') {
      transitions = [
        { before: null, after: 'PENDING', actor: initiator, suffix: 'created' },
        { before: 'PENDING', after: 'ACCEPTED', actor: target, suffix: 'accepted' },
        { before: 'ACCEPTED', after: 'COMPLETED', actor: target, suffix: 'completed' },
      ];
    } else {
      transitions = [
        { before: null, after: 'PENDING', actor: initiator, suffix: 'created' },
        { before: 'PENDING', after: status, actor: status === 'CANCELLED' ? initiator : target, suffix: status.toLowerCase() },
      ];
    }
    for (const transactionType of ['EXCHANGE', 'PURCHASE']) {
      const entityId = transactionType === 'EXCHANGE'
        ? exchangeIds[status]
        : purchaseIds[status];
      for (const transition of transitions) {
        historyRecords.push({
          transaction_type: transactionType,
          entity_id: entityId,
          status_before: transition.before,
          status_after: transition.after,
          changed_by: transition.actor.user_id,
          changed_at: transition.suffix === 'created'
            ? requestedAt
            : transition.suffix === 'accepted'
              ? acceptedAt
              : transition.suffix === 'completed'
                ? completedAt
                : respondedAt,
          key: `seed:${transactionType.toLowerCase()}:${lower}:${transition.suffix}`,
          notes: transition.suffix === 'created'
            ? transactionType === 'EXCHANGE' ? 'تم إنشاء طلب مبادلة جديد عبر سوق بدّلها في قطاع غزة.' : 'تم إنشاء طلب شراء جديد عبر سوق بدّلها في قطاع غزة.'
            : transition.suffix === 'accepted'
              ? 'وافق الطرف الآخر على الطلب، ويجري تنسيق الاستلام.'
              : transition.suffix === 'completed'
                ? 'اكتملت العملية بعد تسليم الغرض للطرف الآخر.'
                : transition.suffix === 'rejected'
                  ? 'رفض صاحب الإعلان الطلب.'
                  : 'ألغى صاحب الطلب العملية قبل اكتمالها.',
        });
      }
    }
  }

  for (const record of historyRecords) {
    const { key, ...data } = record;
    await ensureRecord('transactionHistory', {
      transaction_type: record.transaction_type,
      entity_id: record.entity_id,
      OR: [{ notes: key }, { notes: record.notes }],
    }, data);
  }

  await seedRatings(users, exchangeIds, purchaseIds);
  const reportIds = await seedReports(users, products, admin);
  await seedNotifications(users, products, exchangeIds, purchaseIds, reportIds);

  return { exchangeIds, purchaseIds };
}

async function seedRatings(users, exchangeIds, purchaseIds) {
  const scenarios = [
    { type: 'EXCHANGE', entity: exchangeIds.COMPLETED, rater: users.noor, rated: users.layla, score: 5, review: 'تواصل واضح وتسليم سهل، شكرًا على حسن التعامل.' },
    { type: 'PURCHASE', entity: purchaseIds.COMPLETED, rater: users.reem, rated: users.adam, score: 4, review: 'الغرض مطابق للوصف، لكن موعد الاستلام تأخر قليلًا.' },
    { type: 'EXCHANGE', entity: exchangeIds.COMPLETED, rater: users.layla, rated: users.noor, score: 3, review: 'تمت المبادلة بنجاح، وكان من الممكن تنسيق الموعد بشكل أفضل.' },
    { type: 'PURCHASE', entity: purchaseIds.COMPLETED, rater: users.adam, rated: users.reem, score: 1, review: 'تقييم منخفض لتمثيل حالة تحتاج إلى مراجعة.' },
  ];
  for (const rating of scenarios) {
    const existing = await prisma.rating.findFirst({
      where: {
        rated_entity_type: rating.type,
        entity_id: rating.entity,
        rater_user_id: rating.rater.user_id,
        rated_user_id: rating.rated.user_id,
      },
    });
    if (!existing) {
      await prisma.rating.create({
        data: {
          rated_entity_type: rating.type,
          entity_id: rating.entity,
          rater_user_id: rating.rater.user_id,
          rated_user_id: rating.rated.user_id,
          rating_score: rating.score,
          review: rating.review,
          created_at: daysAgo(3),
        },
      });
    }
  }
}

async function seedReports(users, products, admin) {
  const scenarios = [
    { key: 'fraud-pending', reporter: users.layla, reported: users.tariq, product: products['chair-removed'], type: 'FRAUD', status: 'PENDING', days: 0 },
    { key: 'spam-reviewing', reporter: users.omar, reported: users.maha, product: products['laptop-reserved'], type: 'SPAM', status: 'REVIEWING', days: 4 },
    { key: 'fake-product-resolved', reporter: users.sara, reported: users.tariq, product: products['chair-removed'], type: 'FAKE_PRODUCT', status: 'RESOLVED', days: 40 },
    { key: 'inappropriate-dismissed', reporter: users.noor, reported: users.maha, product: null, type: 'INAPPROPRIATE_CONTENT', status: 'DISMISSED', days: 70 },
    { key: 'incorrect-request', reporter: users.reem, reported: users.adam, product: products['purchase-rejected'], type: 'INCORRECT_REQUEST', status: 'RESOLVED', days: 15 },
    { key: 'other-pending', reporter: users.yousef, reported: users.omar, product: null, type: 'OTHER', status: 'PENDING', days: 1 },
  ];

  const reportIds = {};
  for (const scenario of scenarios) {
    const resolved = scenario.status === 'RESOLVED' || scenario.status === 'DISMISSED';
    const description = scenario.type === 'FRAUD'
      ? 'أشتبه بوجود تضليل في معلومات المستخدم أو الإعلان، وأرجو مراجعة التفاصيل.'
      : scenario.type === 'SPAM'
        ? 'تصلني رسائل متكررة وغير مرغوب بها من هذا الحساب.'
        : scenario.type === 'FAKE_PRODUCT'
          ? 'توجد مؤشرات إلى أن مواصفات الغرض أو صوره لا تطابق المنتج المعروض.'
          : scenario.type === 'INAPPROPRIATE_CONTENT'
            ? 'المحتوى المنشور غير مناسب لمجتمع السوق المحلي.'
            : scenario.type === 'INCORRECT_REQUEST'
              ? 'تفاصيل الطلب أو السعر المقترح غير دقيقة.'
              : 'أرجو مراجعة هذه الحالة والتواصل مع الأطراف عند الحاجة.';
    
    const report = await ensureRecord('report', {
      reporter_user_id: scenario.reporter.user_id,
      reported_user_id: scenario.reported.user_id,
      report_type: scenario.type,
      OR: [
        { description: { contains: `seed:report:${scenario.key}` } },
        { description },
      ],
    }, {
      reporter_user_id: scenario.reporter.user_id,
      reported_user_id: scenario.reported.user_id,
      product_id: scenario.product ? scenario.product.product_id : null,
      report_type: scenario.type,
      description,
      report_status: scenario.status,
      admin_response: resolved ? `تمت مراجعة البلاغ من فريق بدّلها وتحديث حالته إلى ${scenario.status === 'RESOLVED' ? 'تمت المعالجة' : 'مرفوض بعد المراجعة'}.` : null,
      created_at: daysAgo(scenario.days),
      resolved_at: resolved ? daysAgo(Math.max(0, scenario.days - 1)) : null,
      resolved_by: resolved ? admin.user_id : null,
    });
    reportIds[scenario.key] = report.report_id;
  }
  return reportIds;
}

async function seedNotifications(users, products, exchangeIds, purchaseIds, reportIds) {
  const scenarios = [
    { key: 'exchange-request', user: users.omar, type: 'EXCHANGE_REQUEST', entityType: 'EXCHANGE_REQUEST', entityId: exchangeIds.PENDING, read: false, days: 0, message: 'أرسلت لك ليلى طلب مبادلة؛ راجع الغرض المعروض وتواصل معها لتنسيق الاستلام في غزة.' },
    { key: 'purchase-request', user: users.omar, type: 'PURCHASE_REQUEST', entityType: 'PURCHASE_REQUEST', entityId: purchaseIds.PENDING, read: false, days: 0, message: 'وصلك عرض شراء جديد على أحد إعلاناتك.' },
    { key: 'request-response', user: users.layla, type: 'REQUEST_RESPONSE', entityType: 'EXCHANGE_REQUEST', entityId: exchangeIds.COMPLETED, read: true, days: 22, message: 'اكتملت عملية المبادلة، شكرًا لاستخدامك سوق بدّلها.' },
    { key: 'rating', user: users.adam, type: 'RATING', entityType: null, entityId: null, read: true, days: 3, message: 'حصلت على تقييم جديد بعد إتمام عملية تبادل.' },
    { key: 'report-update', user: users.omar, type: 'REPORT_UPDATE', entityType: 'REPORT', entityId: reportIds['spam-reviewing'], read: false, days: 4, message: 'البلاغ الذي أرسلته قيد المراجعة لدى فريق بدّلها.' },
    { key: 'system', user: users.reem, type: 'SYSTEM', entityType: null, entityId: null, read: true, days: 60, message: 'أهلًا بك في سوق بدّلها المجتمعي. أضف إعلانًا أو ابحث عمّا تحتاجه بالقرب منك.' },
    { key: 'featured-product', user: users.layla, type: 'FEATURED_PRODUCT', entityType: 'PRODUCT', entityId: products['smartphone-available'].product_id, read: false, days: 1, message: 'تم تمييز إعلانك ليظهر لمزيد من مستخدمي السوق.' },
    { key: 'old-deleted', user: users.tariq, type: 'SYSTEM', entityType: 'PRODUCT', entityId: products['chair-removed'].product_id, read: true, days: 180, message: 'إشعار قديم محذوف لاختبار السجلات التاريخية.', deleted: true },
  ];

  for (const scenario of scenarios) {
    const createdAt = daysAgo(scenario.days);
    const message = scenario.message;
    await ensureRecord('notification', {
      user_id: scenario.user.user_id,
      notification_type: scenario.type,
      OR: [
        { message: { contains: `seed:notification:${scenario.key}` } },
        {
          related_entity_type: scenario.entityType,
          related_entity_id: scenario.entityId,
          message,
        },
      ],
    }, {
      notification_type: scenario.type,
      related_entity_type: scenario.entityType,
      related_entity_id: scenario.entityId,
      message,
      is_read: scenario.read,
      created_at: createdAt,
      read_at: scenario.read ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
      deleted_at: scenario.deleted ? daysAgo(10) : null,
    });
  }
}

async function seedAdvertisements(users, products) {
  const scenarios = [
    { key: 'active-banner', product: products['smartphone-available'], start: daysAgo(2), end: daysFromNow(5), position: 'BANNER', active: true },
    { key: 'expired-sidebar', product: products['old-camera'], start: daysAgo(60), end: daysAgo(30), position: 'SIDEBAR', active: false },
    { key: 'scheduled-dashboard', product: products['football-new'], start: daysFromNow(2), end: daysFromNow(12), position: 'DASHBOARD', active: true },
  ];

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    await ensureRecord('ad', {
      product_id: scenario.product.product_id,
      ad_position: scenario.position,
    }, {
      admin_user_id: users.admin.user_id,
      end_date: scenario.end,
      display_order: index + 1,
      is_active: scenario.active,
      created_at: daysAgo(index * 5),
    });
  }
}

async function main() {
  const citiesByName = {};
  await CityService.ensureGazaCitiesSeeded();
  const cityRows = await prisma.city.findMany({
    where: { region: 'Gaza Strip' },
    select: { city_id: true, city_name: true },
  });
  for (const [canonicalName, arabicName] of Object.entries(GAZA_CITY_NAMES_ARABIC)) {
    const city = cityRows.find((row) => row.city_name === arabicName);
    if (city) citiesByName[canonicalName] = city;
  }

  const { roles, categories, tags } = await seedReferenceData();
  const users = await seedUsers(roles, citiesByName);
  await seedVerificationWorkflows(users, users.admin);
  const products = await seedProducts(users, categories, citiesByName, tags);
  await seedRequests(users, products, users.admin);
  await seedAdvertisements(users, products);

  console.log('اكتمل إعداد البيانات التجريبية. لن يتم تكرار أي سجل موجود مسبقًا.');
  console.log(`بريد مدير النظام: ${ADMIN_EMAIL}`);
  console.log(`كلمة مرور مدير النظام: ${ADMIN_PASSWORD}`);
  console.log(`كلمة مرور الحسابات التجريبية: ${DEMO_PASSWORD}`);
  console.log('حسابات للتجربة: layla.hassan@seed.badelha.com و yousef.barakat@seed.badelha.com و sara.nasser@seed.badelha.com.');
  console.log('هذه بيانات اختبار عامة للاستخدام المحلي فقط، ولا تستخدمها في بيئة الإنتاج.');
}

main()
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
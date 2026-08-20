const prisma = require('../src/config/prisma');

async function main() {

  await prisma.city.createMany({
    data: [
      {
        city_name: 'Gazahero',
        region: 'Gaza'
      },
      {
        city_name: 'Khan Younis',
        region: 'Gaza'
      },
      {
        city_name: 'Rafah',
        region: 'Gaza'
      }
    ],
    skipDuplicates: true
  });

  await prisma.role.createMany({
    data: [
      {
        role_name: 'USER'
      },
      {
        role_name: 'ADMIN'
      },
      {
        role_name: 'MODERATOR'
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Seeded Successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
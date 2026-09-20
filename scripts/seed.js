const prisma = require('../src/config/prisma');
const { getGazaCitySeedRows } = require('../src/constants/gazaRegions');

async function main() {
  await prisma.city.createMany({
    data: getGazaCitySeedRows(),
    skipDuplicates: true,
  });

  await prisma.role.createMany({
    data: [
      { role_name: 'USER' },
      { role_name: 'ADMIN' },
      { role_name: 'MODERATOR' },
    ],
    skipDuplicates: true,
  });

  const cities = await prisma.city.findMany({
    where: { region: 'Gaza Strip' },
    orderBy: { city_name: 'asc' },
    select: { city_id: true, city_name: true, region: true },
  });

  console.log('✅ Seeded Successfully');
  console.log(`✅ Gaza regions in database (${cities.length}):`);
  cities.forEach((city) => {
    console.log(`   - ${city.city_name} (${city.region})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

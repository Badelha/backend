const prisma = require('../config/prisma');
const {
  GAZA_CITIES,
  GAZA_COUNTRY_ARABIC,
  GAZA_CITY_NAMES_ARABIC,
  GAZA_REGION,
  GAZA_REGION_ARABIC,
  getGazaCitySeedRows,
  isAllowedGazaCity,
  normalizeCityName,
} = require('../constants/gazaRegions');

class CityService {
  static listDropdownCities() {
    return GAZA_CITIES.map((city) => ({
      city: GAZA_CITY_NAMES_ARABIC[city],
      region: GAZA_REGION_ARABIC,
    }));
  }

  static async listCities() {
    await CityService.ensureGazaCitiesSeeded();
    const cities = await prisma.city.findMany({
      where: {
        city_name: { in: Object.values(GAZA_CITY_NAMES_ARABIC) },
        region: GAZA_REGION,
      },
      orderBy: { city_name: 'asc' },
      select: {
        city_id: true,
        city_name: true,
        region: true,
        country: true,
      },
    });

    return cities.map((row) => ({
      city_id: row.city_id,
      city: row.city_name,
      region: GAZA_REGION_ARABIC,
      country: GAZA_COUNTRY_ARABIC,
    }));
  }

  static async ensureGazaCitiesSeeded() {
    await prisma.$transaction(async (tx) => {
      const existingCities = await tx.city.findMany({
        where: {
          region: GAZA_REGION,
          city_name: {
            in: [
              ...GAZA_CITIES,
              ...Object.values(GAZA_CITY_NAMES_ARABIC),
            ],
          },
        },
        select: { city_id: true, city_name: true },
      });
      const citiesByName = new Map(existingCities.map((city) => [city.city_name, city]));

      for (const [canonicalName, arabicName] of Object.entries(GAZA_CITY_NAMES_ARABIC)) {
        const legacyCity = citiesByName.get(canonicalName);
        const localizedCity = citiesByName.get(arabicName);
        if (!legacyCity) continue;

        if (localizedCity) {
          await tx.user.updateMany({
            where: { city_id: legacyCity.city_id },
            data: { city_id: localizedCity.city_id },
          });
          await tx.product.updateMany({
            where: { city_id: legacyCity.city_id },
            data: { city_id: localizedCity.city_id },
          });
          await tx.city.delete({ where: { city_id: legacyCity.city_id } });
        } else {
          await tx.city.update({
            where: { city_id: legacyCity.city_id },
            data: { city_name: arabicName },
          });
        }
      }

      await tx.city.createMany({
        data: getGazaCitySeedRows(),
        skipDuplicates: true,
      });
    });
  }

  static async resolveCityId({ city, cityId } = {}) {
    if (city !== undefined && city !== null && String(city).trim() !== '') {
      const canonical = normalizeCityName(city);
      if (!canonical) {
        throw new Error('INVALID_CITY');
      }
      const arabicCityName = GAZA_CITY_NAMES_ARABIC[canonical];

      const record = await prisma.city.findFirst({
        where: {
          city_name: { equals: arabicCityName, mode: 'insensitive' },
        },
        select: { city_id: true, city_name: true },
      });

      if (!record) {
        throw new Error('INVALID_CITY');
      }

      return record.city_id;
    }

    if (cityId !== undefined && cityId !== null && cityId !== '') {
      const record = await prisma.city.findUnique({
        where: { city_id: Number(cityId) },
        select: { city_id: true, city_name: true },
      });

      if (!record || !isAllowedGazaCity(record.city_name)) {
        throw new Error('INVALID_CITY');
      }

      return record.city_id;
    }

    return undefined;
  }
}

module.exports = CityService;

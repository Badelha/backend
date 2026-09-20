const prisma = require('../config/prisma');
const {
  GAZA_CITIES,
  GAZA_REGION,
  getGazaCitySeedRows,
  isAllowedGazaCity,
  normalizeCityName,
} = require('../constants/gazaRegions');

class CityService {
  static listDropdownCities() {
    return GAZA_CITIES.map((city) => ({
      city,
      region: GAZA_REGION,
    }));
  }

  static async listCities() {
    const cities = await prisma.city.findMany({
      where: {
        city_name: { in: [...GAZA_CITIES] },
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
      region: row.region,
      country: row.country,
    }));
  }

  static async ensureGazaCitiesSeeded() {
    await prisma.city.createMany({
      data: getGazaCitySeedRows(),
      skipDuplicates: true,
    });
  }

  static async resolveCityId({ city, cityId } = {}) {
    if (city !== undefined && city !== null && String(city).trim() !== '') {
      const canonical = normalizeCityName(city);
      if (!canonical) {
        throw new Error('INVALID_CITY');
      }

      const record = await prisma.city.findFirst({
        where: {
          city_name: { equals: canonical, mode: 'insensitive' },
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

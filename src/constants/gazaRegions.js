/**
 * Static Gaza Strip regions/localities for user city dropdowns.
 * Users may only choose from this list; names are seeded into the cities table.
 */
const GAZA_REGION = 'Gaza Strip';
const GAZA_COUNTRY = 'Palestine';
const GAZA_REGION_ARABIC = 'قطاع غزة';
const GAZA_COUNTRY_ARABIC = 'فلسطين';

const GAZA_CITIES = Object.freeze([
  'North Gaza',
  'Jabalia',
  'Beit Lahia',
  'Beit Hanoun',
  'Gaza',
  'Al-Zahra',
  'Deir al-Balah',
  'Nuseirat',
  'Al-Bureij',
  'Al-Maghazi',
  'Al-Zawayda',
  'Khan Yunis',
  'Bani Suhaila',
  'Abasan al-Kabira',
  'Rafah',
]);

const GAZA_CITY_NAMES_ARABIC = Object.freeze({
  'North Gaza': 'شمال غزة',
  Jabalia: 'جباليا',
  'Beit Lahia': 'بيت لاهيا',
  'Beit Hanoun': 'بيت حانون',
  Gaza: 'غزة',
  'Al-Zahra': 'الزهراء',
  'Deir al-Balah': 'دير البلح',
  Nuseirat: 'النصيرات',
  'Al-Bureij': 'البريج',
  'Al-Maghazi': 'المغازي',
  'Al-Zawayda': 'الزوايدة',
  'Khan Yunis': 'خان يونس',
  'Bani Suhaila': 'بني سهيلا',
  'Abasan al-Kabira': 'عبسان الكبيرة',
  Rafah: 'رفح',
});

const CITY_ALIASES = Object.freeze({
  'gaza city': 'Gaza',
  'gazahero': 'Gaza',
  'khan younis': 'Khan Yunis',
  'khan younes': 'Khan Yunis',
  'deir el-balah': 'Deir al-Balah',
  'deir el balah': 'Deir al-Balah',
  'nuseirat camp': 'Nuseirat',
  'bureij': 'Al-Bureij',
  'maghazi': 'Al-Maghazi',
  'zawayda': 'Al-Zawayda',
  'beit lahiya': 'Beit Lahia',
});

const cityLookup = new Map(GAZA_CITIES.map((name) => [name.toLowerCase(), name]));
const arabicCityLookup = new Map(
  Object.entries(GAZA_CITY_NAMES_ARABIC).map(([canonical, arabic]) => [arabic, canonical])
);

function normalizeCityName(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  return cityLookup.get(key) || arabicCityLookup.get(trimmed) || null;
}

function isAllowedGazaCity(value) {
  return normalizeCityName(value) !== null;
}

function getGazaCitySeedRows() {
  return GAZA_CITIES.map((city) => ({
    city_name: GAZA_CITY_NAMES_ARABIC[city],
    region: GAZA_REGION,
    country: GAZA_COUNTRY,
  }));
}

module.exports = {
  GAZA_REGION,
  GAZA_COUNTRY,
  GAZA_REGION_ARABIC,
  GAZA_COUNTRY_ARABIC,
  GAZA_CITIES,
  GAZA_CITY_NAMES_ARABIC,
  CITY_ALIASES,
  normalizeCityName,
  isAllowedGazaCity,
  getGazaCitySeedRows,
};

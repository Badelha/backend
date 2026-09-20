/**
 * Static Gaza Strip regions/localities for user city dropdowns.
 * Users may only choose from this list; names are seeded into the cities table.
 */
const GAZA_REGION = 'Gaza Strip';
const GAZA_COUNTRY = 'Palestine';

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

function normalizeCityName(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  return cityLookup.get(key) || null;
}

function isAllowedGazaCity(value) {
  return normalizeCityName(value) !== null;
}

function getGazaCitySeedRows() {
  return GAZA_CITIES.map((city_name) => ({
    city_name,
    region: GAZA_REGION,
    country: GAZA_COUNTRY,
  }));
}

module.exports = {
  GAZA_REGION,
  GAZA_COUNTRY,
  GAZA_CITIES,
  CITY_ALIASES,
  normalizeCityName,
  isAllowedGazaCity,
  getGazaCitySeedRows,
};

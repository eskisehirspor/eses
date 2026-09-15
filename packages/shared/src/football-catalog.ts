import { TFF_GROUP2_SOURCE } from './tff-group2-source';

export type CatalogPlayer = {
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  shirtNumber: number | null;
  position: 'Kaleci' | 'Savunma' | 'Orta saha' | 'Hücum';
};

export type CatalogTeam = {
  name: string;
  shortName: string;
  slug: string;
  isEskisehirspor?: boolean;
  tffName: string;
  providerTeamId: string;
  /** Preferred transparent PNG (Wikimedia / club site). Tried before TFF. */
  preferredCrestUrl?: string;
  /** Official TFF crest (often JPEG with white canvas). Fallback. */
  sourceCrestUrl?: string;
};

export type CatalogCrestSourceKind = 'club' | 'preferred' | 'tff' | 'none';

/** Resolve downloadable crest URL (Next image proxy → origin asset; strip query noise). */
export function resolveCrestDownloadUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (url.pathname.includes('/_next/image')) {
    const asset = url.searchParams.get('url');
    if (asset) {
      const decoded = decodeURIComponent(asset);
      if (/^https?:\/\//i.test(decoded)) {
        return resolveCrestDownloadUrl(decoded);
      }
      return new URL(decoded, url.origin).toString();
    }
  }

  url.search = '';
  url.hash = '';
  return url.toString();
}

/** Preferred PNG first, then TFF — never includes Eskişehirspor. */
export function catalogCrestDownloadUrls(team: CatalogTeam): string[] {
  if (team.isEskisehirspor) {
    return [];
  }
  const urls: string[] = [];
  if (team.preferredCrestUrl) {
    urls.push(resolveCrestDownloadUrl(team.preferredCrestUrl));
  }
  if (team.sourceCrestUrl) {
    const fallback = resolveCrestDownloadUrl(team.sourceCrestUrl);
    if (!urls.includes(fallback)) {
      urls.push(fallback);
    }
  }
  return urls;
}

export function catalogCrestSourceKind(team: CatalogTeam): CatalogCrestSourceKind {
  if (team.isEskisehirspor) {
    return 'club';
  }
  if (team.preferredCrestUrl) {
    return 'preferred';
  }
  if (team.sourceCrestUrl) {
    return 'tff';
  }
  return 'none';
}

export const CATALOG_CREST_SOURCE_LABELS: Record<CatalogCrestSourceKind, string> = {
  club: 'Yerel kulüp arması',
  preferred: 'Özel PNG',
  tff: 'TFF',
  none: 'Yok',
};

export type CatalogFixture = {
  round: number;
  roundLabel: string;
  date: string;
  kickoffTime: string | null;
  homeSlug: string;
  awaySlug: string;
  status: 'scheduled' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  providerFixtureId: string;
};

export type CatalogStanding = {
  slug: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export const FOOTBALL_CATALOG_META = {
  competitionName: 'Nesine 3. Lig',
  seasonLabel: '2026-2027',
  groupLabel: '2. Grup',
  timezone: 'Europe/Istanbul',
  providerCode: 'tff',
  providerCompetitionId: 'nesine-3-lig-02-2026-2027',
  sources: [
    'https://www.tff.org/Default.aspx?pageID=971',
    'https://www.eskisehirspor.org.tr/fikstur',
    'https://www.eskisehirspor.org.tr/a-takim',
  ],
  capturedAt: '2026-09-15',
} as const;

export const CATALOG_TEAMS: CatalogTeam[] = [
  {
    name: 'Eskişehirspor',
    shortName: 'ES ES',
    slug: 'eskisehirspor',
    isEskisehirspor: true,
    tffName: 'ESKİŞEHİRSPOR KULÜBÜ',
    providerTeamId: 'eskisehirspor',
  },
  {
    name: 'Eskişehir Anadolu',
    shortName: 'Eskişehir Anadolu',
    slug: 'eskisehir-anadolu',
    tffName: 'ESKİŞEHİR ANADOLU SPOR FAALİYETLERİ A.Ş.',
    providerTeamId: 'eskisehir-anadolu',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010528_120x120.jpg',
  },
  {
    name: '1922 Akşehir',
    shortName: '1922 Akşehir',
    slug: '1922-aksehir',
    tffName: '1922 AKŞEHİR SPOR KULÜBÜ',
    providerTeamId: '1922-aksehir',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/0/0f/1922_aksehirspor.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/016085_120x120.jpg',
  },
  {
    name: 'Alanya 1221',
    shortName: 'Alanya 1221',
    slug: 'alanya-1221',
    tffName: 'ALANYA 1221 FUTBOL SPOR KULÜBÜ',
    providerTeamId: 'alanya-1221',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/a/a2/Alanya_1221_FK.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010134_120x120.jpg',
  },
  {
    name: 'Altay',
    shortName: 'Altay',
    slug: 'altay',
    tffName: 'ALTAY',
    providerTeamId: 'altay',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000149_120x120.png',
  },
  {
    name: 'Ayvalıkgücü Belediyespor',
    shortName: 'Ayvalıkgücü',
    slug: 'ayvalikgucu-belediyespor',
    tffName: 'AYVALIKGÜCÜ BELEDİYESPOR',
    providerTeamId: 'ayvalikgucu-belediyespor',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/4/4b/Ayvalikgucu_belediyespor2.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000104_120x120.jpg',
  },
  {
    name: 'Balıkesirspor',
    shortName: 'Balıkesirspor',
    slug: 'balikesirspor',
    tffName: 'BALIKESİRSPOR',
    providerTeamId: 'balikesirspor',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000137_120x120.png',
  },
  {
    name: 'Bigaspor',
    shortName: 'Bigaspor',
    slug: 'bigaspor',
    tffName: 'BİGASPOR',
    providerTeamId: 'bigaspor',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000138_120x120.png',
  },
  {
    name: 'Bucaspor 1928',
    shortName: 'Bucaspor 1928',
    slug: 'bucaspor-1928',
    tffName: 'BUCASPOR 1928',
    providerTeamId: 'bucaspor-1928',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010675_120x120.jpg',
  },
  {
    name: 'Gemlik Sümerbey',
    shortName: 'Gemlik Sümerbey',
    slug: 'bursa-nilufer',
    tffName: 'GEMLİK SÜMERBEY FUTBOL SPOR A.Ş.',
    providerTeamId: 'bursa-nilufer',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/6/69/Gemlik_Sumerbey_FSK.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/017080_120x120.png',
  },
  {
    name: 'Bursa Yıldırım',
    shortName: 'Bursa Yıldırım',
    slug: 'bursa-yildirim',
    tffName: 'BURSA YILDIRIM SPOR KULÜBÜ',
    providerTeamId: 'bursa-yildirim',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/e/e3/Bursa_Yıldırımspor_logo.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/017135_120x120.jpg',
  },
  {
    name: 'Denizli İdmanyurdu 1959',
    shortName: 'Denizli İY 1959',
    slug: 'denizli-idmanyurdu-1959',
    tffName: 'DENİZLİ İDMANYURDU 1959 SPOR KULÜBÜ',
    providerTeamId: 'denizli-idmanyurdu-1959',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/012090_120x120.jpg',
  },
  {
    name: 'Etimesgut',
    shortName: 'Etimesgut',
    slug: 'etimesgut',
    tffName: 'ETİMESGUT SPOR KULÜBÜ',
    providerTeamId: 'etimesgut',
    preferredCrestUrl: 'https://etimesgutspor.org/_next/image?url=%2Fimages%2Flogo.png&w=3840&q=75',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010597_120x120.jpg',
  },
  {
    name: 'Karşıyaka',
    shortName: 'Karşıyaka',
    slug: 'karsiyaka',
    tffName: 'KARŞIYAKA',
    providerTeamId: 'karsiyaka',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000156_120x120.jpg',
  },
  {
    name: 'Kepez Spor',
    shortName: 'Kepez Spor',
    slug: 'kepez-spor',
    tffName: 'KEPEZ SPOR FUTBOL A.Ş.',
    providerTeamId: 'kepez-spor',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/3/3b/Kepezsporlogo.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/013708_120x120.jpg',
  },
  {
    name: 'Söke 1970',
    shortName: 'Söke 1970',
    slug: 'soke-1970',
    tffName: 'SÖKE 1970 SPOR KULÜBÜ',
    providerTeamId: 'soke-1970',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/7/7a/Söke_1970_spor.png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/015703_120x120.jpg',
  },
  {
    name: 'Tire 2021',
    shortName: 'Tire 2021',
    slug: 'tire-2021',
    tffName: 'GAZİEMİR G.O.G. SPOR YAT. A.Ş.',
    providerTeamId: 'tire-2021',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/015176_120x120.png',
  },
  {
    name: 'Uşak Spor',
    shortName: 'Uşak',
    slug: 'usak-spor',
    tffName: 'UŞAK SPOR A.Ş.',
    providerTeamId: 'usak-spor',
    preferredCrestUrl: 'https://upload.wikimedia.org/wikipedia/tr/7/79/Uşakspor_A.Ş..png',
    sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/011704_120x120.jpg',
  },
];

const TFF_NAME_TO_SLUG = new Map(CATALOG_TEAMS.map((team) => [team.tffName, team.slug]));

export const CATALOG_VENUE = {
  name: 'Yeni Eskişehir Stadyumu',
  city: 'Eskişehir',
};

export const CREST_STORAGE_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type CrestStorageMime = keyof typeof CREST_STORAGE_MIME_EXT;

export function catalogCrestObjectName(providerTeamId: string, mimeType: string): string | null {
  const ext = CREST_STORAGE_MIME_EXT[mimeType as CrestStorageMime];
  if (!ext || !/^[a-z0-9-]+$/.test(providerTeamId)) {
    return null;
  }
  return `tff-${providerTeamId}.${ext}`;
}

/** Deterministic transparent crest object after import preprocessing. */
export function catalogCrestPngObjectName(providerTeamId: string): string {
  if (!/^[a-z0-9-]+$/.test(providerTeamId)) {
    throw new Error(`invalid_provider_team_id:${providerTeamId}`);
  }
  return `tff-${providerTeamId}.png`;
}

export type CatalogAwayTrip = {
  opponentSlug: string;
  city: string;
  stadiumName: string | null;
  /** Approximate highway km from Eskişehir city center to the stadium city / venue area. */
  approxRoadKm: number | null;
  distanceSource: string | null;
  mapsQuery: string;
};

/**
 * Eskişehirspor away venues + approximate highway km (not geodesic).
 * Stadium names: sonhaber.com.tr deplasman haritası (2026-09-07) + club fixture pages.
 * Km: province/district highway tables (illerarasi / yolharitam / mesafesorgulama).
 * Local derby (ESOGÜ) has no intercity km.
 */
export const CATALOG_AWAY_TRIPS: Record<string, CatalogAwayTrip> = {
  'alanya-1221': {
    opponentSlug: 'alanya-1221',
    city: 'Alanya',
    stadiumName: 'Milli Egemenlik Stadyumu',
    approxRoadKm: 530,
    distanceSource: 'highway_city_route:Eskişehir→Alanya',
    mapsQuery: 'Milli Egemenlik Stadyumu Alanya',
  },
  'usak-spor': {
    opponentSlug: 'usak-spor',
    city: 'Uşak',
    stadiumName: 'Uşak 1 Eylül Stadyumu',
    approxRoadKm: 217,
    distanceSource: 'highway_province:Eskişehir→Uşak',
    mapsQuery: 'Uşak 1 Eylül Stadyumu',
  },
  bigaspor: {
    opponentSlug: 'bigaspor',
    city: 'Biga',
    stadiumName: 'Biga İlyas Bayram Stadyumu',
    approxRoadKm: 330,
    distanceSource: 'highway_district_route:Eskişehir→Biga',
    mapsQuery: 'Biga İlyas Bayram Stadyumu',
  },
  '1922-aksehir': {
    opponentSlug: '1922-aksehir',
    city: 'Akşehir',
    stadiumName: 'Nasreddin Hoca Stadyumu',
    approxRoadKm: 208,
    distanceSource: 'highway_district_route:Eskişehir→Akşehir',
    mapsQuery: 'Nasreddin Hoca Stadyumu Akşehir',
  },
  altay: {
    opponentSlug: 'altay',
    city: 'İzmir',
    stadiumName: 'Alsancak Mustafa Denizli Stadyumu',
    approxRoadKm: 412,
    distanceSource: 'highway_province:Eskişehir→İzmir',
    mapsQuery: 'Alsancak Mustafa Denizli Stadyumu',
  },
  'tire-2021': {
    opponentSlug: 'tire-2021',
    city: 'İzmir',
    stadiumName: 'Bornova Aziz Kocaoğlu Stadyumu',
    approxRoadKm: 412,
    distanceSource: 'highway_province:Eskişehir→İzmir',
    mapsQuery: 'Bornova Aziz Kocaoğlu Stadyumu',
  },
  'eskisehir-anadolu': {
    opponentSlug: 'eskisehir-anadolu',
    city: 'Eskişehir',
    stadiumName: 'ESOGÜ Stadyumu',
    approxRoadKm: null,
    distanceSource: null,
    mapsQuery: 'ESOGÜ Stadyumu Eskişehir',
  },
  'soke-1970': {
    opponentSlug: 'soke-1970',
    city: 'Söke',
    stadiumName: 'Söke İlçe Stadyumu',
    approxRoadKm: 492,
    distanceSource: 'highway_district_route:Eskişehir→Söke',
    mapsQuery: 'Söke İlçe Stadyumu',
  },
  karsiyaka: {
    opponentSlug: 'karsiyaka',
    city: 'İzmir',
    stadiumName: 'Alsancak Mustafa Denizli Stadyumu',
    approxRoadKm: 412,
    distanceSource: 'highway_province:Eskişehir→İzmir',
    mapsQuery: 'Alsancak Mustafa Denizli Stadyumu',
  },
  'bucaspor-1928': {
    opponentSlug: 'bucaspor-1928',
    city: 'İzmir',
    stadiumName: 'Yeni Buca Stadyumu',
    approxRoadKm: 412,
    distanceSource: 'highway_province:Eskişehir→İzmir',
    mapsQuery: 'Yeni Buca Stadyumu',
  },
  etimesgut: {
    opponentSlug: 'etimesgut',
    city: 'Etimesgut',
    stadiumName: 'Etimesgut Atatürk Stadyumu',
    approxRoadKm: 233,
    distanceSource: 'highway_province:Eskişehir→Ankara',
    mapsQuery: 'Etimesgut Atatürk Stadyumu',
  },
  'bursa-yildirim': {
    opponentSlug: 'bursa-yildirim',
    city: 'Bursa',
    stadiumName: 'Minareliçavuş Tesisleri',
    approxRoadKm: 152,
    distanceSource: 'highway_province:Eskişehir→Bursa',
    mapsQuery: 'Minareliçavuş Tesisleri Bursa',
  },
  'kepez-spor': {
    opponentSlug: 'kepez-spor',
    city: 'Antalya',
    stadiumName: 'Hasan Doğan Stadyumu',
    approxRoadKm: 421,
    distanceSource: 'highway_province:Eskişehir→Antalya',
    mapsQuery: 'Hasan Doğan Stadyumu Kepez Antalya',
  },
  'ayvalikgucu-belediyespor': {
    opponentSlug: 'ayvalikgucu-belediyespor',
    city: 'Ayvalık',
    stadiumName: 'Hüsnü Uğural Stadyumu',
    approxRoadKm: 422,
    distanceSource: 'highway_district_route:Eskişehir→Ayvalık',
    mapsQuery: 'Hüsnü Uğural Stadyumu Ayvalık',
  },
  'denizli-idmanyurdu-1959': {
    opponentSlug: 'denizli-idmanyurdu-1959',
    city: 'Denizli',
    stadiumName: 'Denizli Atatürk Stadyumu',
    approxRoadKm: 355,
    distanceSource: 'highway_province:Eskişehir→Denizli',
    mapsQuery: 'Denizli Atatürk Stadyumu',
  },
  'bursa-nilufer': {
    opponentSlug: 'bursa-nilufer',
    city: 'Gemlik',
    stadiumName: 'Gemlik Atatürk Stadyumu',
    approxRoadKm: 181,
    distanceSource: 'highway_district_route:Eskişehir→Gemlik',
    mapsQuery: 'Gemlik Atatürk Stadyumu',
  },
  balikesirspor: {
    opponentSlug: 'balikesirspor',
    city: 'Balıkesir',
    stadiumName: 'Balıkesir Atatürk Stadyumu',
    approxRoadKm: 303,
    distanceSource: 'highway_province:Eskişehir→Balıkesir',
    mapsQuery: 'Balıkesir Atatürk Stadyumu',
  },
};

export function clubAwayTrip(homeSlug: string, awaySlug: string): CatalogAwayTrip | null {
  if (awaySlug !== 'eskisehirspor') {
    return null;
  }
  return CATALOG_AWAY_TRIPS[homeSlug] ?? null;
}

export const CATALOG_PLAYERS: CatalogPlayer[] = [
  { displayName: 'Bora Göymen', firstName: 'Bora', lastName: 'Göymen', shirtNumber: 1, position: 'Kaleci' },
  { displayName: 'Kaan Çinkaya', firstName: 'Kaan', lastName: 'Çinkaya', shirtNumber: 54, position: 'Kaleci' },
  { displayName: 'Arda Pehlivan', firstName: 'Arda', lastName: 'Pehlivan', shirtNumber: 98, position: 'Kaleci' },
  { displayName: 'Arda Okumuş', firstName: 'Arda', lastName: 'Okumuş', shirtNumber: 26, position: 'Savunma' },
  { displayName: 'Sarper Çağlar', firstName: 'Sarper', lastName: 'Çağlar', shirtNumber: 97, position: 'Savunma' },
  { displayName: 'Murat Şenel', firstName: 'Murat', lastName: 'Şenel', shirtNumber: 22, position: 'Savunma' },
  { displayName: 'Ertuğrul Kurtuluş', firstName: 'Ertuğrul', lastName: 'Kurtuluş', shirtNumber: 16, position: 'Savunma' },
  { displayName: 'Mustafa Eren Damar', firstName: 'Mustafa Eren', lastName: 'Damar', shirtNumber: 23, position: 'Savunma' },
  { displayName: 'Abdulkadir Öksüz', firstName: 'Abdulkadir', lastName: 'Öksüz', shirtNumber: 4, position: 'Savunma' },
  { displayName: 'Ahmet Lütfi Kara', firstName: 'Ahmet Lütfi', lastName: 'Kara', shirtNumber: 3, position: 'Savunma' },
  { displayName: 'Tayfun Tatlı', firstName: 'Tayfun', lastName: 'Tatlı', shirtNumber: null, position: 'Orta saha' },
  { displayName: 'Ozan İsmail Koç', firstName: 'Ozan İsmail', lastName: 'Koç', shirtNumber: 5, position: 'Orta saha' },
  { displayName: 'Mehmet Bağlı', firstName: 'Mehmet', lastName: 'Bağlı', shirtNumber: 14, position: 'Orta saha' },
  { displayName: 'Ozan İsmail Cörüt', firstName: 'Ozan İsmail', lastName: 'Cörüt', shirtNumber: null, position: 'Orta saha' },
  { displayName: 'Emre Tangeldi', firstName: 'Emre', lastName: 'Tangeldi', shirtNumber: 35, position: 'Orta saha' },
  { displayName: 'Fırat Sarı', firstName: 'Fırat', lastName: 'Sarı', shirtNumber: 80, position: 'Orta saha' },
  { displayName: 'Mert Başer', firstName: 'Mert', lastName: 'Başer', shirtNumber: 11, position: 'Orta saha' },
  { displayName: 'Beykan Şimşek', firstName: 'Beykan', lastName: 'Şimşek', shirtNumber: null, position: 'Hücum' },
  { displayName: 'Kerem Baykuş', firstName: 'Kerem', lastName: 'Baykuş', shirtNumber: 20, position: 'Hücum' },
  { displayName: 'Hasan Kaya', firstName: 'Hasan', lastName: 'Kaya', shirtNumber: 28, position: 'Hücum' },
  { displayName: 'Ahmet Dereli', firstName: 'Ahmet', lastName: 'Dereli', shirtNumber: 7, position: 'Hücum' },
  { displayName: 'Atalay Yıldırım', firstName: 'Atalay', lastName: 'Yıldırım', shirtNumber: 99, position: 'Hücum' },
  { displayName: 'Osman Arslantaş', firstName: 'Osman', lastName: 'Arslantaş', shirtNumber: 45, position: 'Hücum' },
];

/** First-half dates: eskisehirspor.org.tr/fikstur (2026-09-15). Weeks 18–34 have TFF pairings but no published calendar on TFF/club at capture; dates stay as existing catalog week markers so kickoff_at remains NOT NULL. Times for those weeks stay null. */
const ROUND_DATES: Record<number, string> = {
  1: '2026-09-06',
  2: '2026-09-13',
  3: '2026-09-19',
  4: '2026-09-27',
  5: '2026-10-03',
  6: '2026-10-11',
  7: '2026-10-17',
  8: '2026-10-24',
  9: '2026-11-01',
  10: '2026-11-07',
  11: '2026-11-11',
  12: '2026-11-15',
  13: '2026-11-22',
  14: '2026-11-29',
  15: '2026-12-06',
  16: '2026-12-13',
  17: '2026-12-20',
  18: '2027-01-17',
  19: '2027-01-24',
  20: '2027-01-31',
  21: '2027-02-07',
  22: '2027-02-10',
  23: '2027-02-14',
  24: '2027-02-21',
  25: '2027-02-28',
  26: '2027-03-07',
  27: '2027-03-13',
  28: '2027-03-17',
  29: '2027-03-21',
  30: '2027-03-28',
  31: '2027-04-04',
  32: '2027-04-11',
  33: '2027-04-18',
  34: '2027-04-24',
};

/** Club-published kickoff times from eskisehirspor.org.tr/fikstur (weeks 2–17). Week 1 has no published clock. Other group matches have no published clock. */
const CLUB_KICKOFF_TIMES: Record<string, string> = {
  '2:usak-spor:eskisehirspor': '16:30',
  '3:bigaspor:eskisehirspor': '16:00',
  '4:eskisehirspor:balikesirspor': '19:00',
  '5:1922-aksehir:eskisehirspor': '15:00',
  '6:eskisehirspor:etimesgut': '19:00',
  '7:altay:eskisehirspor': '19:00',
  '8:eskisehirspor:bursa-yildirim': '19:00',
  '9:tire-2021:eskisehirspor': '15:00',
  '10:eskisehirspor:kepez-spor': '15:00',
  '11:eskisehir-anadolu:eskisehirspor': '15:00',
  '12:eskisehirspor:ayvalikgucu-belediyespor': '15:00',
  '13:soke-1970:eskisehirspor': '15:00',
  '14:eskisehirspor:denizli-idmanyurdu-1959': '15:00',
  '15:karsiyaka:eskisehirspor': '15:00',
  '16:eskisehirspor:bursa-nilufer': '15:00',
  '17:bucaspor-1928:eskisehirspor': '15:00',
};

function padRound(round: number): string {
  return String(round).padStart(2, '0');
}

export function parseTffGroup2Source(source = TFF_GROUP2_SOURCE): CatalogFixture[] {
  const fixtures: CatalogFixture[] = [];
  let round = 0;
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    const roundMatch = /^(\d+)\.Hafta$/.exec(line);
    if (roundMatch) {
      round = Number(roundMatch[1]);
      continue;
    }
    if (!line.includes('|') || round === 0) {
      continue;
    }
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length < 3) {
      continue;
    }
    const homeName = parts[0] ?? '';
    const scorePart = parts[1] ?? '';
    const awayName = parts[2] ?? '';
    const homeSlug = TFF_NAME_TO_SLUG.get(homeName);
    const awaySlug = TFF_NAME_TO_SLUG.get(awayName);
    if (!homeSlug || !awaySlug) {
      throw new Error(`tff_unmapped_team:${homeName}|${awayName}`);
    }
    const scored = /^(\d+)\s*-\s*(\d+)$/.exec(scorePart);
    const homeScore = scored ? Number(scored[1]) : null;
    const awayScore = scored ? Number(scored[2]) : null;
    const finished = homeScore != null && awayScore != null;
    const date = ROUND_DATES[round];
    if (!date) {
      throw new Error(`tff_missing_round_date:${round}`);
    }
    fixtures.push({
      round,
      roundLabel: `${round}. Hafta`,
      date,
      kickoffTime: CLUB_KICKOFF_TIMES[`${round}:${homeSlug}:${awaySlug}`] ?? null,
      homeSlug,
      awaySlug,
      status: finished ? 'finished' : 'scheduled',
      homeScore,
      awayScore,
      providerFixtureId: `${FOOTBALL_CATALOG_META.providerCompetitionId}:${padRound(round)}:${homeSlug}:${awaySlug}`,
    });
  }
  return fixtures;
}

export const CATALOG_FIXTURES: CatalogFixture[] = parseTffGroup2Source();

type StandingAcc = {
  slug: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export function standingsFromFinishedFixtures(fixtures: CatalogFixture[]): CatalogStanding[] {
  const rows = new Map<string, StandingAcc>();
  for (const team of CATALOG_TEAMS) {
    rows.set(team.slug, {
      slug: team.slug,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }
  for (const fixture of fixtures) {
    if (fixture.status !== 'finished' || fixture.homeScore == null || fixture.awayScore == null) {
      continue;
    }
    const home = rows.get(fixture.homeSlug);
    const away = rows.get(fixture.awaySlug);
    if (!home || !away) {
      continue;
    }
    home.played += 1;
    away.played += 1;
    home.goalsFor += fixture.homeScore;
    home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore;
    away.goalsAgainst += fixture.homeScore;
    if (fixture.homeScore > fixture.awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (fixture.homeScore < fixture.awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }
  return [...rows.values()]
    .sort((a, b) => {
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (gdB !== gdA) {
        return gdB - gdA;
      }
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      return a.slug.localeCompare(b.slug);
    })
    .map((row, index) => ({
      slug: row.slug,
      position: index + 1,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      points: row.points,
    }));
}

export const CATALOG_STANDINGS: CatalogStanding[] = standingsFromFinishedFixtures(CATALOG_FIXTURES);

/** Unknown clocks persist as 00:00+03:00 for NOT NULL kickoff_at. UI must not display that sentinel. */
export function catalogKickoffIso(
  date: string,
  time: string | null,
  timeZone = FOOTBALL_CATALOG_META.timezone,
): string {
  const clock = time ?? '00:00';
  const [hour, minute] = clock.split(':').map(Number);
  const utcGuess = Date.parse(
    `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`,
  );
  if (timeZone !== 'Europe/Istanbul') {
    return new Date(utcGuess).toISOString();
  }
  return new Date(utcGuess).toISOString();
}

export function clubFixtureFilter(homeSlug: string, awaySlug: string): boolean {
  return homeSlug === 'eskisehirspor' || awaySlug === 'eskisehirspor';
}

export function catalogIntegrity(fixtures = CATALOG_FIXTURES) {
  const teamSlugs = new Set(CATALOG_TEAMS.map((team) => team.slug));
  const ids = fixtures.map((fixture) => fixture.providerFixtureId);
  const pairs = fixtures.map((fixture) => `${fixture.round}:${fixture.homeSlug}:${fixture.awaySlug}`);
  const club = fixtures.filter((fixture) => clubFixtureFilter(fixture.homeSlug, fixture.awaySlug));
  const byRound = new Map<number, number>();
  for (const fixture of fixtures) {
    byRound.set(fixture.round, (byRound.get(fixture.round) ?? 0) + 1);
  }
  return {
    teamCount: CATALOG_TEAMS.length,
    fixtureCount: fixtures.length,
    finishedCount: fixtures.filter((fixture) => fixture.status === 'finished').length,
    uniqueProviderIds: new Set(ids).size,
    uniquePairs: new Set(pairs).size,
    rounds: [...byRound.entries()].sort((a, b) => a[0] - b[0]),
    clubHome: club.filter((fixture) => fixture.homeSlug === 'eskisehirspor').length,
    clubAway: club.filter((fixture) => fixture.awaySlug === 'eskisehirspor').length,
    unknownTeams: fixtures.filter(
      (fixture) => !teamSlugs.has(fixture.homeSlug) || !teamSlugs.has(fixture.awaySlug),
    ).length,
    scheduledWithScore: fixtures.filter(
      (fixture) => fixture.status === 'scheduled' && (fixture.homeScore != null || fixture.awayScore != null),
    ).length,
    clubKnownKickoffTimes: club.filter((fixture) => fixture.kickoffTime != null).length,
    sourceCrestUrls: CATALOG_TEAMS.filter(
      (team) => Boolean(team.sourceCrestUrl) || Boolean(team.preferredCrestUrl),
    ).length,
    preferredCrestUrls: CATALOG_TEAMS.filter((team) => Boolean(team.preferredCrestUrl)).length,
  };
}

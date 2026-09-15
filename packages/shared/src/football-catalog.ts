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
  sourceCrestUrl?: string;
};

export type CatalogFixture = {
  roundLabel: string;
  date: string;
  kickoffTime: string | null;
  homeSlug: string;
  awaySlug: string;
  status: 'scheduled' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
};

export const FOOTBALL_CATALOG_META = {
  competitionName: 'Nesine 3. Lig',
  seasonLabel: '2026-2027',
  groupLabel: '2. Grup',
  timezone: 'Europe/Istanbul',
  sources: [
    'https://www.eskisehirspor.org.tr/fikstur',
    'https://www.eskisehirspor.org.tr/a-takim',
    'https://www.tff.org/Default.aspx?pageID=971',
  ],
  capturedAt: '2026-09-15',
} as const;

export const CATALOG_TEAMS: CatalogTeam[] = [
  { name: 'Eskişehirspor', shortName: 'ES ES', slug: 'eskisehirspor', isEskisehirspor: true },
  { name: 'Alanya 1221', shortName: 'Alanya 1221', slug: 'alanya-1221', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010134_120x120.jpg' },
  { name: 'Uşak Spor', shortName: 'Uşak', slug: 'usak-spor', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/011704_120x120.jpg' },
  { name: 'Bigaspor', shortName: 'Bigaspor', slug: 'bigaspor', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000138_120x120.png' },
  { name: 'Balıkesirspor', shortName: 'Balıkesirspor', slug: 'balikesirspor', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000137_120x120.png' },
  { name: '1922 Akşehir', shortName: '1922 Akşehir', slug: '1922-aksehir', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/016085_120x120.jpg' },
  { name: 'Etimesgut', shortName: 'Etimesgut', slug: 'etimesgut', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010597_120x120.jpg' },
  { name: 'Altay', shortName: 'Altay', slug: 'altay', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000149_120x120.png' },
  { name: 'Bursa Yıldırım', shortName: 'Bursa Yıldırım', slug: 'bursa-yildirim', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/017135_120x120.jpg' },
  { name: 'Gaziemir G.O.G.', shortName: 'Gaziemir GOG', slug: 'gaziemir-gog', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/015176_120x120.png' },
  { name: 'Kepez Spor', shortName: 'Kepez Spor', slug: 'kepez-spor', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/013708_120x120.jpg' },
  { name: 'Eskişehir Anadolu', shortName: 'Eskişehir Anadolu', slug: 'eskisehir-anadolu', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010528_120x120.jpg' },
  { name: 'Ayvalıkgücü Belediyespor', shortName: 'Ayvalıkgücü', slug: 'ayvalikgucu-belediyespor', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000104_120x120.jpg' },
  { name: 'Söke 1970', shortName: 'Söke 1970', slug: 'soke-1970', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/015703_120x120.jpg' },
  { name: 'Denizli İdmanyurdu 1959', shortName: 'Denizli İY 1959', slug: 'denizli-idmanyurdu-1959', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/012090_120x120.jpg' },
  { name: 'Karşıyaka', shortName: 'Karşıyaka', slug: 'karsiyaka', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/000156_120x120.jpg' },
  { name: 'Gemlik Sümerbey', shortName: 'Gemlik Sümerbey', slug: 'gemlik-sumerbey', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/017080_120x120.png' },
  { name: 'Bucaspor 1928', shortName: 'Bucaspor 1928', slug: 'bucaspor-1928', sourceCrestUrl: 'https://fys.tff.org/TFFUploadFolder/KulupLogolari/010675_120x120.jpg' },
];

export const CATALOG_VENUE = {
  name: 'Yeni Eskişehir Stadyumu',
  city: 'Eskişehir',
};

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

export const CATALOG_FIXTURES: CatalogFixture[] = [
  { roundLabel: '1. Hafta', date: '2026-09-06', kickoffTime: null, homeSlug: 'eskisehirspor', awaySlug: 'alanya-1221', status: 'finished', homeScore: 4, awayScore: 0 },
  { roundLabel: '2. Hafta', date: '2026-09-13', kickoffTime: '16:30', homeSlug: 'usak-spor', awaySlug: 'eskisehirspor', status: 'finished', homeScore: 2, awayScore: 2 },
  { roundLabel: '3. Hafta', date: '2026-09-19', kickoffTime: '16:00', homeSlug: 'bigaspor', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '4. Hafta', date: '2026-09-27', kickoffTime: '19:00', homeSlug: 'eskisehirspor', awaySlug: 'balikesirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '5. Hafta', date: '2026-10-03', kickoffTime: '15:00', homeSlug: '1922-aksehir', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '6. Hafta', date: '2026-10-11', kickoffTime: '19:00', homeSlug: 'eskisehirspor', awaySlug: 'etimesgut', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '7. Hafta', date: '2026-10-17', kickoffTime: '19:00', homeSlug: 'altay', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '8. Hafta', date: '2026-10-24', kickoffTime: '19:00', homeSlug: 'eskisehirspor', awaySlug: 'bursa-yildirim', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '9. Hafta', date: '2026-11-01', kickoffTime: '15:00', homeSlug: 'gaziemir-gog', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '10. Hafta', date: '2026-11-07', kickoffTime: '15:00', homeSlug: 'eskisehirspor', awaySlug: 'kepez-spor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '11. Hafta', date: '2026-11-11', kickoffTime: '15:00', homeSlug: 'eskisehir-anadolu', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '12. Hafta', date: '2026-11-15', kickoffTime: '15:00', homeSlug: 'eskisehirspor', awaySlug: 'ayvalikgucu-belediyespor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '13. Hafta', date: '2026-11-22', kickoffTime: '15:00', homeSlug: 'soke-1970', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '14. Hafta', date: '2026-11-29', kickoffTime: '15:00', homeSlug: 'eskisehirspor', awaySlug: 'denizli-idmanyurdu-1959', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '15. Hafta', date: '2026-12-06', kickoffTime: '15:00', homeSlug: 'karsiyaka', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '16. Hafta', date: '2026-12-13', kickoffTime: '15:00', homeSlug: 'eskisehirspor', awaySlug: 'gemlik-sumerbey', status: 'scheduled', homeScore: null, awayScore: null },
  { roundLabel: '17. Hafta', date: '2026-12-20', kickoffTime: '15:00', homeSlug: 'bucaspor-1928', awaySlug: 'eskisehirspor', status: 'scheduled', homeScore: null, awayScore: null },
];

export function catalogKickoffIso(date: string, time: string | null, timeZone = FOOTBALL_CATALOG_META.timezone): string {
  const clock = time ?? '00:00';
  const [hour, minute] = clock.split(':').map(Number);
  const utcGuess = Date.parse(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`);
  if (timeZone !== 'Europe/Istanbul') {
    return new Date(utcGuess).toISOString();
  }
  return new Date(utcGuess).toISOString();
}

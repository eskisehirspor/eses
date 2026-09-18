import { describe, expect, it } from 'vitest';
import {
  CATALOG_AWAY_TRIPS,
  CATALOG_FIXTURES,
  CATALOG_STANDINGS,
  CATALOG_TEAMS,
  catalogCrestDownloadUrls,
  catalogCrestObjectName,
  catalogCrestPngObjectName,
  catalogCrestSourceKind,
  catalogIntegrity,
  catalogKickoffIso,
  clubAwayTrip,
  clubFixtureFilter,
  resolveCrestDownloadUrl,
} from './football-catalog';
import { formatKickoffLabel, formatKickoffTime } from './kickoff';

describe('2026-2027 Nesine 3. Lig group 2 catalog', () => {
  const integrity = catalogIntegrity();

  it('has 18 unique teams and 306 fixtures across 34 rounds of 9', () => {
    expect(integrity.teamCount).toBe(18);
    expect(new Set(CATALOG_TEAMS.map((team) => team.slug)).size).toBe(18);
    expect(integrity.fixtureCount).toBe(306);
    expect(integrity.uniqueProviderIds).toBe(306);
    expect(integrity.uniquePairs).toBe(306);
    expect(integrity.rounds).toHaveLength(34);
    expect(integrity.rounds.every(([, count]) => count === 9)).toBe(true);
    expect(integrity.unknownTeams).toBe(0);
    expect(integrity.scheduledWithScore).toBe(0);
  });

  it('gives Eskişehirspor 17 home and 17 away fixtures', () => {
    expect(integrity.clubHome).toBe(17);
    expect(integrity.clubAway).toBe(17);
    expect(CATALOG_FIXTURES.filter((fixture) => clubFixtureFilter(fixture.homeSlug, fixture.awaySlug))).toHaveLength(
      34,
    );
  });

  it('keeps verified Eskişehirspor results and leaves future scores empty', () => {
    const week1 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === 'eskisehirspor' && fixture.awaySlug === 'alanya-1221',
    );
    const week2 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === 'usak-spor' && fixture.awaySlug === 'eskisehirspor',
    );
    const week3 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === 'bigaspor' && fixture.awaySlug === 'eskisehirspor',
    );
    expect(week1).toMatchObject({ status: 'finished', homeScore: 4, awayScore: 0 });
    expect(week2).toMatchObject({ status: 'finished', homeScore: 2, awayScore: 2, kickoffTime: '16:30' });
    expect(week3).toMatchObject({ status: 'scheduled', homeScore: null, awayScore: null });
    expect(integrity.finishedCount).toBe(18);
  });

  it('keeps official TFF home/away for rounds 5 and 6 (regression: eskisehirspor.org.tr/fikstur cross-check)', () => {
    const week5 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === '1922-aksehir' && fixture.awaySlug === 'eskisehirspor',
    );
    const week6 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === 'eskisehirspor' && fixture.awaySlug === 'etimesgut',
    );
    expect(week5).toMatchObject({
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      date: '2026-10-03',
      kickoffTime: '15:00',
    });
    expect(week6).toMatchObject({
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      date: '2026-10-11',
      kickoffTime: '19:00',
    });
  });

  it('derives standings only from finished TFF results', () => {
    expect(CATALOG_STANDINGS).toHaveLength(18);
    const club = CATALOG_STANDINGS.find((row) => row.slug === 'eskisehirspor');
    expect(club).toMatchObject({ played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 6, goalsAgainst: 2, points: 4 });
    expect(CATALOG_STANDINGS.every((row) => row.played === row.wins + row.draws + row.losses)).toBe(true);
    expect(CATALOG_STANDINGS.map((row) => row.position)).toEqual([...Array(18)].map((_, index) => index + 1));
  });

  it('keeps club-published kickoff clocks and never treats 00:00 as a UI time', () => {
    expect(integrity.clubKnownKickoffTimes).toBe(16);
    const week1 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === 'eskisehirspor' && fixture.awaySlug === 'alanya-1221',
    );
    const week4 = CATALOG_FIXTURES.find(
      (fixture) => fixture.homeSlug === 'eskisehirspor' && fixture.awaySlug === 'balikesirspor',
    );
    expect(week1?.kickoffTime).toBeNull();
    expect(week4?.kickoffTime).toBe('19:00');
    expect(formatKickoffTime(catalogKickoffIso(week1!.date, week1!.kickoffTime))).toBeNull();
    expect(formatKickoffLabel(catalogKickoffIso(week1!.date, week1!.kickoffTime))).toBe('06.09.2026');
    expect(formatKickoffLabel(catalogKickoffIso(week4!.date, week4!.kickoffTime))).toBe('27.09.2026 · 19:00');
    expect(
      CATALOG_FIXTURES.filter((fixture) => !clubFixtureFilter(fixture.homeSlug, fixture.awaySlug)).every(
        (fixture) => fixture.kickoffTime == null,
      ),
    ).toBe(true);
  });

  it('names crest objects deterministically and keeps 17 opponent source URLs', () => {
    expect(integrity.sourceCrestUrls).toBe(17);
    expect(integrity.preferredCrestUrls).toBe(9);
    expect(CATALOG_TEAMS.find((team) => team.isEskisehirspor)?.sourceCrestUrl).toBeUndefined();
    expect(CATALOG_TEAMS.find((team) => team.isEskisehirspor)?.preferredCrestUrl).toBeUndefined();
    expect(catalogCrestObjectName('altay', 'image/png')).toBe('tff-altay.png');
    expect(catalogCrestPngObjectName('usak-spor')).toBe('tff-usak-spor.png');
    expect(catalogCrestObjectName('usak-spor', 'image/jpeg')).toBe('tff-usak-spor.jpg');
    expect(catalogCrestObjectName('altay', 'image/svg+xml')).toBeNull();
  });

  it('maps nine preferred PNG crests ahead of TFF and resolves Etimesgut proxy', () => {
    const preferred = CATALOG_TEAMS.filter((team) => Boolean(team.preferredCrestUrl));
    expect(preferred).toHaveLength(9);
    expect(preferred.map((team) => team.providerTeamId).sort()).toEqual(
      [
        '1922-aksehir',
        'alanya-1221',
        'ayvalikgucu-belediyespor',
        'bursa-nilufer',
        'bursa-yildirim',
        'etimesgut',
        'kepez-spor',
        'soke-1970',
        'usak-spor',
      ].sort(),
    );

    const etimesgut = CATALOG_TEAMS.find((team) => team.slug === 'etimesgut')!;
    expect(resolveCrestDownloadUrl(etimesgut.preferredCrestUrl!)).toBe(
      'https://etimesgutspor.org/images/logo.png',
    );
    expect(catalogCrestDownloadUrls(etimesgut)[0]).toBe('https://etimesgutspor.org/images/logo.png');
    expect(catalogCrestDownloadUrls(etimesgut)[1]).toContain('fys.tff.org');
    expect(catalogCrestSourceKind(etimesgut)).toBe('preferred');
    expect(catalogCrestPngObjectName(etimesgut.providerTeamId)).toBe('tff-etimesgut.png');

    const gemlik = CATALOG_TEAMS.find((team) => team.slug === 'bursa-nilufer')!;
    expect(catalogCrestDownloadUrls(gemlik)[0]).toContain('Gemlik_Sumerbey_FSK.png');
    expect(catalogCrestSourceKind(gemlik)).toBe('preferred');

    const balikesir = CATALOG_TEAMS.find((team) => team.slug === 'balikesirspor')!;
    expect(catalogCrestSourceKind(balikesir)).toBe('tff');
    expect(catalogCrestDownloadUrls(balikesir)).toHaveLength(1);

    const club = CATALOG_TEAMS.find((team) => team.isEskisehirspor)!;
    expect(catalogCrestDownloadUrls(club)).toEqual([]);
    expect(catalogCrestSourceKind(club)).toBe('club');

    expect(
      resolveCrestDownloadUrl('https://upload.wikimedia.org/wikipedia/tr/0/0f/1922_aksehirspor.png?x=1'),
    ).toBe('https://upload.wikimedia.org/wikipedia/tr/0/0f/1922_aksehirspor.png');
  });

  it('exposes away trips only for Eskişehirspor away fixtures', () => {
    expect(Object.keys(CATALOG_AWAY_TRIPS)).toHaveLength(17);
    expect(clubAwayTrip('eskisehirspor', 'usak-spor')).toBeNull();
    expect(clubAwayTrip('usak-spor', 'eskisehirspor')).toMatchObject({
      city: 'Uşak',
      stadiumName: 'Uşak 1 Eylül Stadyumu',
      approxRoadKm: 217,
    });
    expect(clubAwayTrip('eskisehir-anadolu', 'eskisehirspor')?.approxRoadKm).toBeNull();
    expect(Object.values(CATALOG_AWAY_TRIPS).every((trip) => Boolean(trip.stadiumName))).toBe(true);
  });
});

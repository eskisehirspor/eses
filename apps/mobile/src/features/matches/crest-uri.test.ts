import { describe, expect, it } from 'vitest';
import { preferredCrestCount, resolvePreferredOrRemoteCrestUri } from './crest-uri';

describe('preferred crest live URLs', () => {
  it('maps nine preferred logos and loads them live from catalog URLs', () => {
    expect(preferredCrestCount()).toBe(9);
    expect(
      resolvePreferredOrRemoteCrestUri({ slug: 'usak-spor', isClub: false, crestPath: 'tff-usak-spor.jpg' }),
    ).toBe('https://upload.wikimedia.org/wikipedia/tr/7/79/U%C5%9Fakspor_A.%C5%9E..png');
    expect(resolvePreferredOrRemoteCrestUri({ slug: 'etimesgut', isClub: false, crestPath: null })).toBe(
      'https://etimesgutspor.org/images/logo.png',
    );
    expect(
      resolvePreferredOrRemoteCrestUri({
        slug: 'bursa-nilufer',
        isClub: false,
        crestPath: 'tff-bursa-nilufer.png',
      }),
    ).toContain('Gemlik_Sumerbey_FSK.png');
  });

  it('never resolves Eskişehirspor remotely', () => {
    expect(
      resolvePreferredOrRemoteCrestUri({ slug: 'eskisehirspor', isClub: true, crestPath: 'x.png' }),
    ).toBeNull();
  });

  it('passes through https crest paths for non-preferred teams', () => {
    expect(
      resolvePreferredOrRemoteCrestUri({
        slug: 'balikesirspor',
        isClub: false,
        crestPath: 'https://example.com/crest.png',
      }),
    ).toBe('https://example.com/crest.png');
  });

  it('defers storage paths for non-preferred teams', () => {
    expect(
      resolvePreferredOrRemoteCrestUri({
        slug: 'balikesirspor',
        isClub: false,
        crestPath: 'tff-balikesirspor.png',
      }),
    ).toBeNull();
  });
});

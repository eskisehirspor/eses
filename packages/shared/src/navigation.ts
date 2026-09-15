export const DEEP_LINK_SCHEME = 'eskisehirspor';

export const MOBILE_TABS = [
  { key: 'home', href: '/', title: 'Home', label: 'HOME' },
  { key: 'maclar', href: '/maclar', title: 'Maçlar', label: 'MAÇLAR' },
  { key: 'tribun', href: '/tribun', title: 'Tribün', label: 'TRİBÜN' },
  { key: 'oyna', href: '/oyna', title: 'Oyna', label: 'OYNA' },
  { key: 'profil', href: '/profil', title: 'Profil', label: 'PROFİL' },
] as const;

export type MobileTabKey = (typeof MOBILE_TABS)[number]['key'];

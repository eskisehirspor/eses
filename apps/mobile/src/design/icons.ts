import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const navIcons = {
  home: { idle: 'home-outline', active: 'home' },
  matches: { idle: 'football-outline', active: 'football' },
  tribune: { idle: 'chatbubbles-outline', active: 'chatbubbles' },
  play: { idle: 'trophy-outline', active: 'trophy' },
  profile: { idle: 'person-outline', active: 'person' },
} as const satisfies Record<string, { idle: IoniconName; active: IoniconName }>;

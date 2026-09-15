/**
 * Future XP action keys. Phase 0 does not award XP.
 * Clients must never send a delta with these keys.
 */
export const XP_ACTION_KEYS = [
  'daily_login',
  'article_read',
  'prediction_submitted',
  'prediction_correct',
  'quiz_completed',
  'mission_completed',
  'match_presence_verified',
  'referral_verified',
  'sponsor_mission',
  'admin_adjust',
] as const;

export type XpActionKey = (typeof XP_ACTION_KEYS)[number];

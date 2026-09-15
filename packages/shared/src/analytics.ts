export const ANALYTICS_EVENTS = [
  'app_open',
  'screen_view',
  'article_view',
  'match_view',
  'prediction_started',
  'prediction_submitted',
  'quiz_started',
  'quiz_completed',
  'mission_completed',
  'XP_earned',
  'leaderboard_view',
  'forum_post_created',
  'report_submitted',
  'match_presence_detected',
  'match_presence_verified',
  'notification_opened',
  'supporter_level_up',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

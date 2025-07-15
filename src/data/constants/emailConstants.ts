export const MARKET_SEGMENTS = {
  MUSIC: 'music_industry',
  LUXURY: 'luxury_brands',
  SPORTS: 'sports_brands',
  WEDDING: 'wedding_industry',
  CORPORATE: 'corporate',
  AGENCY: 'creative_agencies'
} as const;

export const TEMPLATE_CATEGORIES = {
  INTRO: 'introduction',
  FOLLOW_UP: 'follow_up',
  PROPOSAL: 'proposal',
  NURTURING: 'nurturing',
  CLOSING: 'closing',
  REACTIVATION: 'reactivation'
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export const PERFORMANCE_WEIGHTS = {
  RESPONSE_RATE: 0.4,
  CONVERSION_RATE: 0.4,
  OPEN_RATE: 0.1,
  CLICK_RATE: 0.1
} as const;
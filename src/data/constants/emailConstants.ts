export const MARKET_SEGMENTS = {
  ADVERTISING: 'advertising',
  MUSIC: 'music', 
  LUXURY: 'luxury',
  SPORTS: 'sports',
  WEDDING: 'wedding',
  CORPORATE: 'corporate',
  AGENCY: 'agency'
} as const;

export type MarketSegment = typeof MARKET_SEGMENTS[keyof typeof MARKET_SEGMENTS];

// Segments ciblés prioritaires (alignés avec prospectionStore)
export const TARGET_SEGMENTS = [
  MARKET_SEGMENTS.ADVERTISING,
  MARKET_SEGMENTS.MUSIC,
  MARKET_SEGMENTS.LUXURY, 
  MARKET_SEGMENTS.SPORTS
] as const;

// Mapping NAF vers segments
export const NAF_TO_SEGMENT: Record<string, MarketSegment> = {
  // Publicité et communication
  '7311Z': MARKET_SEGMENTS.ADVERTISING,
  '7312Z': MARKET_SEGMENTS.ADVERTISING,
  '7320Z': MARKET_SEGMENTS.ADVERTISING,
  '5811Z': MARKET_SEGMENTS.ADVERTISING,
  '5812Z': MARKET_SEGMENTS.ADVERTISING,
  
  // Musique et créatif
  '5920Z': MARKET_SEGMENTS.MUSIC,
  '9001Z': MARKET_SEGMENTS.MUSIC,
  '9002Z': MARKET_SEGMENTS.MUSIC,
  '9003A': MARKET_SEGMENTS.MUSIC,
  '9003B': MARKET_SEGMENTS.MUSIC,
  
  // Luxe et mode
  '1413Z': MARKET_SEGMENTS.LUXURY,
  '1414Z': MARKET_SEGMENTS.LUXURY,
  '4771Z': MARKET_SEGMENTS.LUXURY,
  '4772A': MARKET_SEGMENTS.LUXURY,
  '4772B': MARKET_SEGMENTS.LUXURY,
  
  // Sport et événementiel
  '9311Z': MARKET_SEGMENTS.SPORTS,
  '9312Z': MARKET_SEGMENTS.SPORTS,
  '9319Z': MARKET_SEGMENTS.SPORTS,
  '8230Z': MARKET_SEGMENTS.SPORTS,
  '9329Z': MARKET_SEGMENTS.SPORTS
};

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
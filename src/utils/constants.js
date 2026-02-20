// Points configuration by tier
export const POINTS_COSTS = {
  free: {
    message: 5,
    like: 2,
    undo: 2
  },
  premium: {
    message: 3,
    like: 1,
    undo: 1
  },
  vip: {
    message: 0,
    like: 0,
    undo: 0
  }
};

export const POINTS_CONFIG = {
  STARTING_BONUS: 50,
  PROFILE_VIEW_COST: 1,
  MIN_POINTS_TO_MESSAGE: 5,
  MIN_POINTS_TO_BROWSE: 0
};

export const getPointsCost = (tier, action) => {
  return POINTS_COSTS[tier]?.[action] || 0;
};

// Get effective tier considering trial upgrades
export const getEffectiveTier = (user) => {
  if (user.trialExpiresAt && new Date(user.trialExpiresAt) > new Date()) {
    return user.trialTier || user.tier;
  }
  return user.tier;
};

// Ad configuration
export const AD_CONFIG = {
  MIN_DURATION: 5,
  MAX_DURATION: 120,
  MIN_REWARD: 1,
  MAX_REWARD: 100
};

// Survey configuration
export const SURVEY_CONFIG = {
  MIN_REWARD: 5,
  MAX_REWARD: 100
};

// User configuration
export const USER_CONFIG = {
  MIN_AGE: 18,
  MAX_AGE: 120,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PASSWORD: 'Password must be at least 6 characters',
  INVALID_AGE: 'Age must be between 18 and 120',
  INSUFFICIENT_POINTS: 'Insufficient points for this action',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  DUPLICATE_EMAIL: 'Email already registered',
  INVALID_INPUT: 'Invalid input provided'
};

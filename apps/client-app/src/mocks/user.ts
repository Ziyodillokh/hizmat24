import type { UserProfile } from './types';

export const USER: UserProfile = {
  fullName: 'Jasur',
  phoneNumber: '+998901234567',
};

/** 8.3-band: ism boʻlmagan holat varianti ham kerak. */
export const USER_WITHOUT_NAME: UserProfile = {
  fullName: null,
  phoneNumber: '+998901234567',
};

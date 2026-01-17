import { DeviceConfig } from './types';

// API Configuration
export const SESAME_API_BASE = 'https://app.candyhouse.co/api/sesame2';
export const API_KEY = '7Nbu3oEc8O7KLpXckNsTz23AOb7qPcLA4aOMVYVt';

// Auth Credentials
export const AUTH_CREDS = {
  email: 'cafekenta@gmail.com',
  password: 'Littleboy0809',
};

// Devices
export const DEVICES: Record<string, DeviceConfig> = {
  BOT_2: {
    name: 'Sesame Bot 2 (Lighting)',
    uuid: '11200423-0300-0207-5500-0A01FFFFFFFF',
    secret: 'fcf7adabb9daf83476f255b5be40c5b7',
    type: 'bot',
  },
  SESAME_5: {
    name: 'Sesame 5 (Entrance)',
    uuid: '11200416-0103-0701-CA00-8100FFFFFFFF',
    secret: '66c9750fd4b8133bb83c55c4a3e01484',
    type: 'lock',
  },
};

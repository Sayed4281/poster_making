import { Rect } from './types';

export const ADMIN_EMAIL = 'admin@gmail.com';
export const ADMIN_PASSWORD = 'admin123';
export const LOCAL_STORAGE_KEY = 'smart_template_db_v1';
export const AUTH_STORAGE_KEY = 'smart_template_auth';

// Default rectangular selection if none provided
export const DEFAULT_RECT: Rect = {
  x: 35,
  y: 20,
  width: 30,
  height: 40,
  shape: 'rect'
};
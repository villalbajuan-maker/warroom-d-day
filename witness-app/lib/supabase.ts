import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

const getSupabaseUrl = (): string => {
  if (Constants.expoConfig?.extra?.supabaseUrl) {
    return Constants.expoConfig.extra.supabaseUrl;
  }

  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) {
    return process.env.EXPO_PUBLIC_SUPABASE_URL;
  }

  return '';
};

const getSupabaseAnonKey = (): string => {
  if (Constants.expoConfig?.extra?.supabaseAnonKey) {
    return Constants.expoConfig.extra.supabaseAnonKey;
  }

  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }

  return '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

console.log('[SUPABASE] Config loaded:', {
  urlFromExtra: Constants.expoConfig?.extra?.supabaseUrl ? 'Found' : 'Not found',
  keyFromExtra: Constants.expoConfig?.extra?.supabaseAnonKey ? 'Found' : 'Not found',
  urlFromEnv: (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ? 'Found' : 'Not found',
  keyFromEnv: (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ? 'Found' : 'Not found',
  finalUrl: supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : 'Missing',
  finalKey: supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'Missing',
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing. Using placeholder values.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

import { supabase } from './supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  sesame_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export const getUserSettings = async (): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single();

  if (error) {
    // No settings found is OK
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Failed to fetch user settings:', error);
    return null;
  }

  return data;
};

export const saveApiKey = async (apiKey: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No authenticated user');
    return false;
  }

  // Try upsert
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      sesame_api_key: apiKey,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Failed to save API key:', error);
    return false;
  }

  return true;
};

export const clearApiKey = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from('user_settings')
    .update({ sesame_api_key: null })
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to clear API key:', error);
    return false;
  }

  return true;
};

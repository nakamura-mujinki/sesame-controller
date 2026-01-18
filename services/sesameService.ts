import { supabase, DbDevice } from './supabase';

const EDGE_FUNCTION_URL = 'https://coawkrogiuekmjsnrtln.supabase.co/functions/v1/send-command';

export type ActionType = 'scenario0' | 'scenario1' | 'lock' | 'unlock';

export const sendCommand = async (
  deviceUuid: string,
  action: ActionType
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('Session check:', { session: !!session, error: sessionError, token: session?.access_token?.slice(0, 20) });

    if (!session) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        device_uuid: deviceUuid,
        action,
      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);

    if (!response.ok) {
      return { success: false, message: result.error || 'API Error' };
    }

    return { success: true, message: result.message || 'Command sent' };
  } catch (error) {
    console.error('Failed to send command:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getDevices = async (): Promise<DbDevice[]> => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('visible', true)
    .order('created_at');

  if (error) {
    console.error('Failed to fetch devices:', error);
    return [];
  }

  return data || [];
};

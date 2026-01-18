import { supabase, DbDevice, DeviceType } from './supabase';

/**
 * Get all visible devices for the current user
 */
export const getVisibleDevices = async (): Promise<DbDevice[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .eq('visible', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get devices:', error);
    return [];
  }

  return data || [];
};

/**
 * Get all devices for the current user (including hidden)
 */
export const getAllDevices = async (): Promise<DbDevice[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get devices:', error);
    return [];
  }

  return data || [];
};

/**
 * Add a new device
 */
export const addDevice = async (device: {
  name: string;
  device_type: DeviceType;
  device_uuid: string;
  secret_key: string;
}): Promise<DbDevice | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('devices')
    .insert({
      user_id: user.id,
      visible: true,
      ...device,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add device:', error);
    return null;
  }

  return data;
};

/**
 * Toggle device visibility (show/hide)
 */
export const toggleDeviceVisibility = async (id: string, visible: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('devices')
    .update({ visible })
    .eq('id', id);

  if (error) {
    console.error('Failed to toggle device visibility:', error);
    return false;
  }

  return true;
};

/**
 * Update device name
 */
export const updateDeviceName = async (id: string, name: string): Promise<boolean> => {
  const { error } = await supabase
    .from('devices')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Failed to update device name:', error);
    return false;
  }

  return true;
};

/**
 * Delete a device permanently
 */
export const deleteDevice = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete device:', error);
    return false;
  }

  return true;
};

/**
 * Update scenario names for a bot2 device
 */
export const updateScenarioNames = async (
  id: string,
  scenario0_name: string,
  scenario1_name: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('devices')
    .update({ scenario0_name, scenario1_name })
    .eq('id', id);

  if (error) {
    console.error('Failed to update scenario names:', error);
    return false;
  }

  return true;
};

/**
 * Update device secret key
 */
export const updateDeviceSecretKey = async (id: string, secret_key: string): Promise<boolean> => {
  const { error } = await supabase
    .from('devices')
    .update({ secret_key })
    .eq('id', id);

  if (error) {
    console.error('Failed to update device secret key:', error);
    return false;
  }

  return true;
};

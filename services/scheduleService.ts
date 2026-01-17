import { supabase, DbSchedule, DbDevice } from './supabase';

export const getSchedules = async (): Promise<DbSchedule[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('time_hour')
    .order('time_minute');

  if (error) {
    console.error('Failed to fetch schedules:', error);
    return [];
  }

  return data || [];
};

export const createSchedule = async (schedule: {
  name: string;
  device_type: 'bot' | 'lock';
  device_uuid: string;
  action: string;
  time_hour: number;
  time_minute: number;
  days_of_week: number[] | null;
}): Promise<DbSchedule | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('schedules')
    .insert({
      user_id: user.id,
      ...schedule,
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create schedule:', error);
    return null;
  }

  return data;
};

export const deleteSchedule = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete schedule:', error);
    return false;
  }

  return true;
};

export const toggleSchedule = async (id: string, enabled: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('schedules')
    .update({ enabled })
    .eq('id', id);

  if (error) {
    console.error('Failed to toggle schedule:', error);
    return false;
  }

  return true;
};

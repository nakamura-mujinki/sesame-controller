import { supabase, DbOperationLog } from './supabase';

export const getLogs = async (limit: number = 50): Promise<DbOperationLog[]> => {
  const { data, error } = await supabase
    .from('operation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch logs:', error);
    return [];
  }

  return data || [];
};

import { supabase } from '@/lib/supabase';
import { AdGroup } from '@/types';

export async function getAdGroups(): Promise<AdGroup[]> {
  const { data, error } = await supabase
    .from('ad_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAdGroup(adGroup: Omit<AdGroup, 'id' | 'created_at' | 'updated_at'>): Promise<AdGroup> {
  const { data, error } = await supabase
    .from('ad_groups')
    .insert([adGroup])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdGroup(id: string, updates: Partial<AdGroup>): Promise<AdGroup> {
  const { data, error } = await supabase
    .from('ad_groups')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAdGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('ad_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function duplicateAdGroup(id: string): Promise<AdGroup> {
  const { data: original, error: fetchError } = await supabase
    .from('ad_groups')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { id: _, created_at, updated_at, ...adGroupData } = original;
  const duplicate = {
    ...adGroupData,
    name: `${original.name} (Copy)`,
  };

  return createAdGroup(duplicate);
}

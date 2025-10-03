import { supabase } from '@/lib/supabase';
import { Creative } from '@/types';

export async function getCreatives(): Promise<Creative[]> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCreative(creative: Omit<Creative, 'id' | 'created_at' | 'updated_at'>): Promise<Creative> {
  const { data, error } = await supabase
    .from('creatives')
    .insert([creative])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCreative(id: string, updates: Partial<Creative>): Promise<Creative> {
  const { data, error } = await supabase
    .from('creatives')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCreative(id: string): Promise<void> {
  const { error } = await supabase
    .from('creatives')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function duplicateCreative(id: string): Promise<Creative> {
  const { data: original, error: fetchError } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { id: _, created_at, updated_at, ...creativeData } = original;
  const duplicate = {
    ...creativeData,
    name: `${original.name} (Copy)`,
  };

  return createCreative(duplicate);
}

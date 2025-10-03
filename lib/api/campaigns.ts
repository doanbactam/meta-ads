import { supabase } from '@/lib/supabase';
import { Campaign } from '@/types';

export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaign])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function duplicateCampaign(id: string): Promise<Campaign> {
  const { data: original, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { id: _, created_at, updated_at, ...campaignData } = original;
  const duplicate = {
    ...campaignData,
    name: `${original.name} (Copy)`,
  };

  return createCampaign(duplicate);
}

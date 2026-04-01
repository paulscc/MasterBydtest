'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createLicense(formData: FormData) {
  const client_id = formData.get('client_id') as string;
  const api_key = formData.get('api_key') as string;
  const status = formData.get('status') as string || 'ACTIVE';
  const modulesString = formData.get('modules') as string;
  const max_users = parseInt(formData.get('max_users') as string) || 5;
  const expires_at = formData.get('expires_at') as string;

  let modules = [];
  try {
    modules = modulesString ? JSON.parse(modulesString) : [];
  } catch (e) {
    modules = modulesString.split(',').map(m => m.trim());
  }

  const { error } = await supabaseAdmin.from('licenses').insert({
    client_id,
    api_key,
    status,
    modules,
    max_users,
    expires_at,
  });

  if (error) return { error: error.message };

  revalidatePath('/licenses');
  revalidatePath('/');
  return { success: true };
}

export async function updateLicense(id: string, formData: FormData) {
  const status = formData.get('status') as string;
  const modulesString = formData.get('modules') as string;
  const max_users = parseInt(formData.get('max_users') as string);
  const expires_at = formData.get('expires_at') as string;

  let modules = [];
  try {
    modules = modulesString ? JSON.parse(modulesString) : [];
  } catch (e) {
    modules = modulesString.split(',').map(m => m.trim());
  }

  const { error } = await supabaseAdmin.from('licenses').update({
    status,
    modules,
    max_users,
    expires_at,
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/licenses');
  return { success: true };
}

export async function deleteLicense(id: string) {
  const { error } = await supabaseAdmin.from('licenses').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/licenses');
  revalidatePath('/');
  return { success: true };
}

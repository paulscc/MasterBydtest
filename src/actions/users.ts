'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createUser(formData: FormData) {
  const client_id = formData.get('client_id') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const is_active = formData.get('is_active') === 'true';

  const password_hash = await bcrypt.hash(password, 10);

  const { error } = await supabaseAdmin.from('master_users').insert({
    client_id,
    email,
    password_hash,
    is_active
  });

  if (error) return { error: error.message };

  revalidatePath('/users');
  revalidatePath('/');
  return { success: true };
}

export async function updateUser(id: string, formData: FormData) {
  const email = formData.get('email') as string;
  const is_active = formData.get('is_active') === 'true';

  const updates: any = {
    email,
    is_active
  };

  const password = formData.get('password') as string;
  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  const { error } = await supabaseAdmin.from('master_users').update(updates).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.from('master_users').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/users');
  revalidatePath('/');
  return { success: true };
}

export async function getUsersByClient(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from('master_users')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('master_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return { error: error.message };
  return { data };
}

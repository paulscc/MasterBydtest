'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createUser(formData: FormData) {
  const client_id = formData.get('client_id') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;
  const role = formData.get('role') as string;

  const password_hash = await bcrypt.hash(password, 10);

  const { error } = await supabaseAdmin.from('users').insert({
    client_id: client_id || null,
    email,
    password_hash,
    full_name,
    role
  });

  if (error) return { error: error.message };

  revalidatePath('/users');
  revalidatePath('/');
  return { success: true };
}

export async function updateUser(id: string, formData: FormData) {
  const client_id = formData.get('client_id') as string;
  const email = formData.get('email') as string;
  const full_name = formData.get('full_name') as string;
  const role = formData.get('role') as string;
  const is_active = formData.get('is_active') === 'true';

  const updates: any = {
    client_id: client_id || null,
    email,
    full_name,
    role,
    is_active
  };

  const password = formData.get('password') as string;
  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/users');
  revalidatePath('/');
  return { success: true };
}

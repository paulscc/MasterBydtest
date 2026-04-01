'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createClient(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const db_connection_string = formData.get('db_connection_string') as string;

  const { error } = await supabaseAdmin.from('clients').insert({
    name,
    slug,
    db_connection_string: db_connection_string || null,
  });

  if (error) return { error: error.message };

  revalidatePath('/clients');
  revalidatePath('/');
  return { success: true };
}

export async function updateClient(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const db_connection_string = formData.get('db_connection_string') as string;
  const is_active = formData.get('is_active') === 'true';

  const { error } = await supabaseAdmin.from('clients').update({
    name,
    slug,
    db_connection_string: db_connection_string || null,
    is_active
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/clients');
  return { success: true };
}

export async function deleteClient(id: string) {
  const { error } = await supabaseAdmin.from('clients').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/clients');
  revalidatePath('/');
  return { success: true };
}

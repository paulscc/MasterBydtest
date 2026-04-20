'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createClient(formData: FormData) {
  const business_name = formData.get('name') as string || formData.get('business_name') as string;
  const subdomain = formData.get('slug') as string || formData.get('subdomain') as string;
  const db_connection_url = formData.get('db_connection_string') as string || formData.get('db_connection_url') as string;
  
  // Generar schema_name automáticamente basado en el subdomain
  const schema_name = 'tenant_' + subdomain.replace(/[^a-zA-Z0-9]/g, '_');

  const { error } = await supabaseAdmin.from('master_clients').insert({
    business_name,
    subdomain,
    schema_name,
    db_connection_url: db_connection_url || null,
  });

  if (error) return { error: error.message };

  revalidatePath('/clients');
  revalidatePath('/');
  return { success: true };
}

export async function updateClient(id: string, formData: FormData) {
  const business_name = formData.get('name') as string || formData.get('business_name') as string;
  const subdomain = formData.get('slug') as string || formData.get('subdomain') as string;
  const db_connection_url = formData.get('db_connection_string') as string || formData.get('db_connection_url') as string;
  const is_active = formData.get('is_active') === 'true';

  // Generar schema_name automáticamente basado en el subdomain
  const schema_name = 'tenant_' + subdomain.replace(/[^a-zA-Z0-9]/g, '_');

  const { error } = await supabaseAdmin.from('master_clients').update({
    business_name,
    subdomain,
    schema_name,
    db_connection_url: db_connection_url || null,
    is_active
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/clients');
  return { success: true };
}

export async function deleteClient(id: string) {
  const { error } = await supabaseAdmin.from('master_clients').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/clients');
  revalidatePath('/');
  return { success: true };
}

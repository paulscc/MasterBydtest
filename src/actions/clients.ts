'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { rdsService } from '@/lib/aws-rds';
import bcrypt from 'bcryptjs';

export async function createClient(formData: FormData) {
  const business_name = formData.get('name') as string || formData.get('business_name') as string;
  const subdomain = formData.get('slug') as string || formData.get('subdomain') as string;
  const admin_email = formData.get('admin_email') as string;
  const admin_password = formData.get('admin_password') as string;
  const db_connection_url = process.env.DATABASE_URL || formData.get('db_connection_url') as string;
  
  if (!business_name || !subdomain || !admin_email || !admin_password) {
    return { error: 'Todos los campos son requeridos' };
  }

  try {
    // 1. Crear el esquema en AWS RDS
    const schemaName = await rdsService.createClientSchema({
      subdomain,
      businessName: business_name
    });

    // 2. Insertar el cliente en la base de datos maestra
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('master_clients')
      .insert({
        business_name,
        subdomain,
        db_connection_url,
        is_active: true
      })
      .select()
      .single();

    if (clientError) {
      return { error: `Error creando cliente: ${clientError.message}` };
    }

    // 3. Crear el usuario administrador para el cliente
    const password_hash = await bcrypt.hash(admin_password, 10);
    const { error: userError } = await supabaseAdmin
      .from('master_users')
      .insert({
        email: admin_email,
        password_hash,
        client_id: clientData.id,
        is_active: true
      });

    if (userError) {
      return { error: `Error creando usuario: ${userError.message}` };
    }

    // 4. Crear licencia básica para el cliente
    const { error: licenseError } = await supabaseAdmin
      .from('licenses')
      .insert({
        client_id: clientData.id,
        api_key: `sk_${subdomain}_${Date.now()}`,
        status: 'ACTIVE',
        modules: ['inventory', 'users'],
        max_users: 5,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año
      });

    if (licenseError) {
      return { error: `Error creando licencia: ${licenseError.message}` };
    }

    // 5. Registrar log de sincronización
    await supabaseAdmin
      .from('master_sync_logs')
      .insert({
        client_id: clientData.id,
        sync_type: 'client_creation',
        status: 'completed',
        finished_at: new Date().toISOString()
      });

    revalidatePath('/clients');
    revalidatePath('/');
    
    return { 
      success: true, 
      data: {
        clientId: clientData.id,
        schemaName,
        message: `Cliente ${business_name} creado exitosamente con esquema ${schemaName}`
      }
    };

  } catch (error) {
    console.error('Error creating client:', error);
    return { error: `Error creando cliente: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
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

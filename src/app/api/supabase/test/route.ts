import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Probar conexión básica
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('master_clients')
      .select('count(*)')
      .single();

    if (connectionError) {
      return NextResponse.json({
        success: false,
        message: 'Error connecting to Supabase',
        error: connectionError.message,
        tables: {
          master_clients: 'error',
          master_users: 'unknown',
          master_modules: 'unknown',
          licenses: 'unknown'
        }
      }, { status: 500 });
    }

    // Verificar todas las tablas del nuevo esquema
    const tables = [
      'master_clients',
      'master_users', 
      'master_modules',
      'master_client_modules',
      'master_software_releases',
      'master_sync_logs',
      'licenses'
    ];

    const tableStatus: Record<string, any> = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count(*)')
          .single();
        
        tableStatus[table] = error ? 'error' : 'exists';
      } catch (error) {
        tableStatus[table] = 'error';
      }
    }

    // Verificar tablas antiguas que podrían existir
    const oldTables = ['clients', 'users'];
    const oldTableStatus: Record<string, any> = {};

    for (const table of oldTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count(*)')
          .single();
        
        oldTableStatus[table] = error ? 'not_found' : 'exists';
      } catch (error) {
        oldTableStatus[table] = 'not_found';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tables: tableStatus,
      oldTables: oldTableStatus,
      config: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    });

  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing Supabase connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

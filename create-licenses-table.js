// Script para crear la tabla licenses en el schema public
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

console.log('=== Creando tabla licenses en schema public ===');

async function createLicensesTable() {
  const client = new Client({
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE,
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Crear tabla licenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.licenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID UNIQUE,
        api_key TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED')),
        modules JSONB NOT NULL DEFAULT '[]'::jsonb,
        max_users INTEGER DEFAULT 5,
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('Tabla licenses creada exitosamente');

    // Crear índice
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_licenses_api_key ON public.licenses(api_key)
    `);
    
    console.log('Índice creado exitosamente');

    // Verificar que la tabla existe
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'licenses'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('Tabla licenses verificada correctamente');
    } else {
      console.log('Error: La tabla no se creó correctamente');
    }

    await client.end();
    console.log('Conexión cerrada');

    return true;

  } catch (error) {
    console.error('Error creando tabla licenses:', error.message);
    
    try {
      await client.end();
    } catch (endError) {
      // Ignorar error al cerrar
    }
    
    return false;
  }
}

// Ejecutar la creación
createLicensesTable().then(success => {
  if (success) {
    console.log('\n=== TABLA LICENSES CREADA EXITOSAMENTE ===');
    console.log('Ahora puedes probar el flujo completo de creación de clientes');
  } else {
    console.log('\n=== ERROR CREANDO TABLA ===');
    console.log('Revisa los errores e intenta nuevamente');
  }
}).catch(error => {
  console.error('Error ejecutando script:', error);
});

// Script para probar la creación de un nuevo tenant
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('=== Prueba de Creación de Nuevo Tenant ===');

// Configuración de conexión a AWS RDS
const rdsConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

// Datos del nuevo tenant para prueba
const newTenant = {
  businessName: 'Empresa Prueba S.A.',
  subdomain: 'test-company-2024',
  adminEmail: 'admin@testcompany.com',
  adminPassword: 'Test123456!'
};

async function createTenantSchema() {
  const client = new Client(rdsConfig);
  
  try {
    console.log('\n1. Conectando a AWS RDS...');
    await client.connect();
    console.log('Conexión establecida');

    // 2. Generar nombre del schema
    const schemaName = `tenant_${newTenant.subdomain.replace(/[^a-zA-Z0-9]/g, '_')}`;
    console.log(`\n2. Creando schema: ${schemaName}`);

    // 3. Verificar si el schema ya existe
    const existingSchema = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);

    if (existingSchema.rows.length > 0) {
      console.log('El schema ya existe. Eliminándolo primero...');
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      console.log('Schema existente eliminado');
    }

    // 4. Crear el nuevo schema
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    console.log('Schema creado exitosamente');

    // 5. Leer y ejecutar el script corrected++.sql
    console.log('\n3. Ejecutando script de esquema...');
    const scriptPath = path.join(__dirname, 'script_corrected++.sql');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`No se encuentra el archivo ${scriptPath}`);
    }

    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Establecer el search_path al nuevo schema
    await client.query(`SET search_path TO "${schemaName}", public`);
    console.log('Search_path configurado');

    // Ejecutar el script en el nuevo schema
    await client.query(scriptContent);
    console.log('Script de esquema ejecutado exitosamente');

    // 6. Verificar tablas creadas en el nuevo schema
    console.log('\n4. Verificando tablas creadas...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name
    `, [schemaName]);

    console.log(`Tablas creadas en schema ${schemaName}:`);
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // 7. Insertar un usuario de prueba en el nuevo schema
    console.log('\n5. Insertando usuario de prueba...');
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // UUID fijo para pruebas
    
    await client.query(`
      INSERT INTO "${schemaName}".users (id, name, phone, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        updated_at = EXCLUDED.updated_at
    `, [
      testUserId,
      'Usuario de Prueba',
      '+1234567890',
      true,
      new Date(),
      new Date()
    ]);

    console.log('Usuario de prueba insertado');

    // 8. Verificar que el usuario fue insertado
    const userCheck = await client.query(`
      SELECT id, name, phone, is_active 
      FROM "${schemaName}".users 
      WHERE id = $1
    `, [testUserId]);

    if (userCheck.rows.length > 0) {
      console.log('Usuario verificado exitosamente:');
      console.log(`  ID: ${userCheck.rows[0].id}`);
      console.log(`  Nombre: ${userCheck.rows[0].name}`);
      console.log(`  Teléfono: ${userCheck.rows[0].phone}`);
      console.log(`  Activo: ${userCheck.rows[0].is_active}`);
    }

    // 9. Listar todos los schemas disponibles
    console.log('\n6. Listando todos los schemas de tenant...');
    const tenantSchemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
      ORDER BY schema_name
    `);

    console.log('Schemas de tenant existentes:');
    tenantSchemas.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.schema_name}`);
    });

    await client.end();
    
    console.log('\n=== TENANT CREADO EXITOSAMENTE ===');
    console.log(`Schema: ${schemaName}`);
    console.log(`Empresa: ${newTenant.businessName}`);
    console.log(`Subdominio: ${newTenant.subdomain}`);
    console.log(`Tablas creadas: ${tables.rows.length}`);
    
    return {
      success: true,
      schemaName,
      tablesCreated: tables.rows.length,
      businessName: newTenant.businessName,
      subdomain: newTenant.subdomain
    };

  } catch (error) {
    console.error('Error creando tenant:', error.message);
    
    try {
      await client.end();
    } catch (endError) {
      // Ignorar error al cerrar
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar la prueba
createTenantSchema().then(result => {
  if (result.success) {
    console.log('\n¡Prueba completada exitosamente!');
    console.log('Puedes ahora usar este schema para el tenant en tu aplicación.');
  } else {
    console.log('\nLa prueba falló. Revisa los errores e intenta nuevamente.');
  }
}).catch(error => {
  console.error('Error inesperado:', error);
});

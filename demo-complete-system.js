// Demostración completa del sistema multi-tenant
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('=== DEMOSTRACIÓN COMPLETA DEL SISTEMA MULTI-TENANT ===');

// Configuración de conexión a AWS RDS
const rdsConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function showSystemStatus() {
  const client = new Client(rdsConfig);
  
  try {
    console.log('\n1. Conectando a AWS RDS...');
    await client.connect();
    console.log('Conexión establecida');

    // Mostrar información de la base de datos
    console.log('\n2. Información de la Base de Datos:');
    const dbInfo = await client.query('SELECT version() as version, current_database() as database');
    console.log(`Versión PostgreSQL: ${dbInfo.rows[0].version.split(',')[0]}`);
    console.log(`Base de datos actual: ${dbInfo.rows[0].database}`);

    // Listar todos los schemas
    console.log('\n3. Schemas disponibles:');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'topology')
      ORDER BY schema_name
    `);

    schemas.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.schema_name}`);
    });

    // Mostrar schemas de tenant específicamente
    console.log('\n4. Schemas de Tenants:');
    const tenantSchemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
      ORDER BY schema_name
    `);

    if (tenantSchemas.rows.length > 0) {
      console.log(`Tenants creados: ${tenantSchemas.rows.length}`);
      tenantSchemas.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.schema_name}`);
      });
    } else {
      console.log('No hay schemas de tenant creados aún');
    }

    // Analizar cada tenant schema
    if (tenantSchemas.rows.length > 0) {
      console.log('\n5. Análisis de Tenants:');
      
      for (const schemaRow of tenantSchemas.rows) {
        const schemaName = schemaRow.schema_name;
        
        // Contar tablas en el schema
        const tableCount = await client.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = $1
        `, [schemaName]);

        // Contar usuarios en el schema
        let userCount = 0;
        try {
          const usersCount = await client.query(`
            SELECT COUNT(*) as count
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'users'
          `, [schemaName]);
          
          if (usersCount.rows[0].count > 0) {
            const userResult = await client.query(`
              SELECT COUNT(*) as count
              FROM "${schemaName}".users
            `);
            userCount = userResult.rows[0].count;
          }
        } catch (error) {
          // Ignorar error si no hay tabla users
        }

        console.log(`\n  Tenant: ${schemaName}`);
        console.log(`    Tablas: ${tableCount.rows[0].count}`);
        console.log(`    Usuarios: ${userCount}`);
        
        // Mostrar algunas tablas clave
        const keyTables = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name IN ('users', 'clients', 'products', 'orders')
          ORDER BY table_name
        `, [schemaName]);
        
        if (keyTables.rows.length > 0) {
          console.log(`    Tablas clave: ${keyTables.rows.map(r => r.table_name).join(', ')}`);
        }
      }
    }

    // Mostrar tablas del schema public
    console.log('\n6. Tablas en schema public (maestro):');
    const publicTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`Tablas maestras: ${publicTables.rows.length}`);
    publicTables.rows.forEach((row, index) => {
      if (index < 10) { // Mostrar solo las primeras 10
        console.log(`  ${index + 1}. ${row.table_name}`);
      }
    });
    
    if (publicTables.rows.length > 10) {
      console.log(`  ... y ${publicTables.rows.length - 10} más`);
    }

    await client.end();

  } catch (error) {
    console.error('Error mostrando estado del sistema:', error.message);
    
    try {
      await client.end();
    } catch (endError) {
      // Ignorar error al cerrar
    }
  }
}

async function createDemoTenant() {
  console.log('\n=== CREANDO TENANT DE DEMOSTRACIÓN ===');
  
  const demoTenant = {
    businessName: 'Demo Company Inc.',
    subdomain: 'demo-company',
    adminEmail: 'demo@democompany.com',
    adminPassword: 'Demo123456!'
  };

  const client = new Client(rdsConfig);
  
  try {
    await client.connect();
    
    // Generar nombre del schema
    const schemaName = `tenant_${demoTenant.subdomain.replace(/[^a-zA-Z0-9]/g, '_')}`;
    console.log(`Creando tenant: ${schemaName}`);

    // Eliminar si existe
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    
    // Crear nuevo schema
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    
    // Ejecutar script de esquema
    const scriptPath = path.join(__dirname, 'script_corrected++.sql');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    await client.query(`SET search_path TO "${schemaName}", public`);
    await client.query(scriptContent);
    
    // Insertar datos de demo
    const demoUserId = 'demo-user-uuid-12345';
    await client.query(`
      INSERT INTO "${schemaName}".users (id, name, phone, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      demoUserId,
      'Demo User',
      '+1234567890',
      true,
      new Date(),
      new Date()
    ]);

    // Insertar warehouse de demo
    await client.query(`
      INSERT INTO "${schemaName}".warehouses (name, address, is_active, created_at)
      VALUES ($1, $2, $3, $4)
    `, [
      'Main Warehouse',
      '123 Demo Street, Demo City',
      true,
      new Date()
    ]);

    // Verificar creación
    const tableCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, [schemaName]);

    await client.end();
    
    console.log(`\nTenant creado exitosamente:`);
    console.log(`- Schema: ${schemaName}`);
    console.log(`- Empresa: ${demoTenant.businessName}`);
    console.log(`- Subdominio: ${demoTenant.subdomain}`);
    console.log(`- Tablas: ${tableCount.rows[0].count}`);
    console.log(`- Usuario demo: ${demoUserId}`);
    
    return {
      success: true,
      schemaName,
      businessName: demoTenant.businessName,
      tablesCreated: tableCount.rows[0].count
    };

  } catch (error) {
    console.error('Error creando tenant demo:', error.message);
    
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

async function showSystemCapabilities() {
  console.log('\n=== CAPACIDADES DEL SISTEMA ===');
  
  console.log('\n1. Arquitectura Multi-Tenant:');
  console.log('   - Schema por tenant (aislamiento completo)');
  console.log('   - Base de datos maestra para gestión centralizada');
  console.log('   - Conexión AWS RDS PostgreSQL');

  console.log('\n2. Módulos Disponibles:');
  console.log('   - Gestión de usuarios y roles');
  console.log('   - Inventario y productos');
  console.log('   - Órdenes y cotizaciones');
  console.log('   - Clientes y contactos');
  console.log('   - Slabs y materiales');
  console.log('   - Instalaciones y crews');
  console.log('   - Pagos y facturación');
  console.log('   - Almacenes y logística');

  console.log('\n3. Características de Seguridad:');
  console.log('   - Aislamiento de datos por schema');
  console.log('   - Autenticación centralizada');
  console.log('   - Gestión de permisos por roles');
  console.log('   - Conexión SSL a base de datos');

  console.log('\n4. Componentes del Sistema:');
  console.log('   - Frontend: Next.js 16.2.2');
  console.log('   - Base de datos: PostgreSQL 17.6 en AWS RDS');
  console.log('   - Backend API: Server Actions de Next.js');
  console.log('   - Multi-tenancy: PostgreSQL schemas');

  console.log('\n5. Endpoints API:');
  console.log('   - GET /api/aws-rds/test - Prueba de conexión');
  console.log('   - POST /api/clients/create - Crear tenant');
  console.log('   - GET /api/supabase/test - Prueba Supabase');

  console.log('\n6. Scripts de Utilidad:');
  console.log('   - test-aws-rds.js - Prueba conexión AWS RDS');
  console.log('   - test-tenant-creation.js - Creación de tenant');
  console.log('   - demo-complete-system.js - Demostración completa');
}

// Ejecutar demostración completa
async function runCompleteDemo() {
  console.log('Iniciando demostración completa del sistema multi-tenant...\n');
  
  // 1. Mostrar estado actual
  await showSystemStatus();
  
  // 2. Crear tenant de demostración
  const demoResult = await createDemoTenant();
  
  if (demoResult.success) {
    console.log('\n=== TENANT DEMO CREADO ===');
    
    // 3. Mostrar estado actualizado
    await showSystemStatus();
    
    // 4. Mostrar capacidades del sistema
    await showSystemCapabilities();
    
    console.log('\n=== DEMOSTRACIÓN COMPLETADA ===');
    console.log('El sistema multi-tenant está funcionando correctamente.');
    console.log('Puedes crear más tenants usando los scripts proporcionados.');
    
  } else {
    console.log('\n=== ERROR EN DEMOSTRACIÓN ===');
    console.log('No se pudo crear el tenant de demostración.');
    console.log('Revisa los errores y la configuración.');
  }
}

// Ejecutar demostración
runCompleteDemo().catch(error => {
  console.error('Error en demostración:', error);
});

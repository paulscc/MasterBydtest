// Script para probar conexión con SSL
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

console.log('=== Prueba de Conexión AWS RDS con SSL ===');

async function testConnectionWithSSL() {
  // Configuración con SSL requerido para AWS RDS
  const sslConfigs = [
    {
      name: "SSL con rejectUnauthorized: false",
      ssl: { rejectUnauthorized: false }
    },
    {
      name: "SSL con rejectUnauthorized: true",
      ssl: { rejectUnauthorized: true }
    },
    {
      name: "SSL requerido",
      ssl: true
    },
    {
      name: "SSL deshabilitado (último recurso)",
      ssl: false
    }
  ];

  for (const config of sslConfigs) {
    console.log(`\n--- Probando: ${config.name} ---`);
    
    const client = new Client({
      host: process.env.AWS_RDS_HOST,
      port: parseInt(process.env.AWS_RDS_PORT || '5432'),
      database: process.env.AWS_RDS_DATABASE,
      user: process.env.AWS_RDS_USER,
      password: 'admin', // Usar la contraseña que proporcionaste
      ssl: config.ssl
    });

    try {
      await client.connect();
      console.log('¡Conexión exitosa!');
      
      const result = await client.query('SELECT version() as version, NOW() as current_time');
      console.log('Versión PostgreSQL:', result.rows[0].version.split(',')[0]);
      console.log('Hora servidor:', result.rows[0].current_time);
      
      // Listar tablas
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
        LIMIT 10
      `);
      
      if (tables.rows.length > 0) {
        console.log('Tablas encontradas:');
        tables.rows.forEach(row => {
          console.log('- ', row.table_name);
        });
      }
      
      await client.end();
      
      console.log('\n=== CONFIGURACIÓN EXITOSA ===');
      console.log('SSL Configuration:', config.name);
      
      // Actualizar el archivo de configuración si es necesario
      if (config.ssl !== false) {
        console.log('Recomendación: Mantener SSL habilitado para producción');
      }
      
      return true;
      
    } catch (error) {
      console.error('Error:', error.message);
      
      try {
        await client.end();
      } catch (e) {
        // Ignorar error al cerrar
      }
      
      if (config.name.includes('deshabilitado')) {
        console.log('\nTodas las configuraciones SSL fallaron. Verifica:');
        console.log('1. Las credenciales de usuario y contraseña');
        console.log('2. Que el usuario tenga permisos de conexión');
        console.log('3. Que la base de datos exista');
        console.log('4. Configuración de seguridad en AWS RDS');
      }
    }
  }
  
  return false;
}

testConnectionWithSSL().then(success => {
  console.log(`\n=== RESULTADO FINAL ===`);
  console.log(success ? 'CONEXIÓN ESTABLECIDA' : 'CONEXIÓN FALLIDA');
  
  if (!success) {
    console.log('\nPosibles soluciones:');
    console.log('1. Verifica la contraseña en la consola de AWS RDS');
    console.log('2. Revisa las reglas de VPC y security groups');
    console.log('3. Confirma que el usuario postgres tenga los permisos necesarios');
    console.log('4. Verifica que la base de datos "postgres" exista');
  }
});

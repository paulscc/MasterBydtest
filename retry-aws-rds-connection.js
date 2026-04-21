// Script mejorado para reintentar conexión AWS RDS
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

console.log('=== Nuevo Intento de Conexión AWS RDS ===');

async function testConnection() {
  // Mostrar configuración actual
  console.log('\nConfiguración actual:');
  console.log(`- Host: ${process.env.AWS_RDS_HOST}`);
  console.log(`- Port: ${process.env.AWS_RDS_PORT || '5432'}`);
  console.log(`- Database: ${process.env.AWS_RDS_DATABASE}`);
  console.log(`- User: ${process.env.AWS_RDS_USER}`);
  console.log(`- Password: ${process.env.AWS_RDS_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
  
  // Verificar que todas las variables necesarias estén configuradas
  const requiredVars = ['AWS_RDS_HOST', 'AWS_RDS_DATABASE', 'AWS_RDS_USER', 'AWS_RDS_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('\nERROR: Faltan variables obligatorias:', missingVars.join(', '));
    return false;
  }
  
  // Diferentes configuraciones SSL para probar
  const configs = [
    {
      name: 'SSL requerido con rejectUnauthorized: false',
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'SSL requerido',
      ssl: true
    },
    {
      name: 'SSL deshabilitado (si falla lo anterior)',
      ssl: false
    }
  ];
  
  for (const config of configs) {
    console.log(`\n--- Probando configuración: ${config.name} ---`);
    
    const client = new Client({
      host: process.env.AWS_RDS_HOST,
      port: parseInt(process.env.AWS_RDS_PORT || '5432'),
      database: process.env.AWS_RDS_DATABASE,
      user: process.env.AWS_RDS_USER,
      password: process.env.AWS_RDS_PASSWORD,
      ssl: config.ssl,
      connectionTimeoutMillis: 10000, // 10 segundos timeout
      query_timeout: 5000 // 5 segundos timeout para consultas
    });
    
    try {
      console.log('Intentando conectar...');
      await client.connect();
      console.log('¡Conexión establecida!');
      
      // Probar consulta simple
      const result = await client.query('SELECT version() as version, NOW() as current_time');
      console.log('Versión PostgreSQL:', result.rows[0].version.split(',')[0]);
      console.log('Hora servidor:', result.rows[0].current_time);
      
      // Listar bases de datos disponibles
      const dbList = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname');
      console.log('\nBases de datos disponibles:');
      dbList.rows.forEach(row => {
        console.log('- ', row.datname);
      });
      
      // Si estamos en postgres, listar tablas
      if (process.env.AWS_RDS_DATABASE === 'postgres') {
        const tables = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
          LIMIT 10
        `);
        
        if (tables.rows.length > 0) {
          console.log('\nTablas en schema public:');
          tables.rows.forEach(row => {
            console.log('- ', row.table_name);
          });
        } else {
          console.log('\nNo hay tablas en el schema public');
        }
      }
      
      await client.end();
      console.log('\nConexión cerrada exitosamente');
      
      console.log('\n=== ÉXITO: Conexión AWS RDS establecida ===');
      console.log('Configuración utilizada:', config.name);
      return true;
      
    } catch (error) {
      console.error('Error:', error.message);
      
      // Análisis específico del error
      if (error.message.includes('password authentication failed')) {
        console.log('-> La contraseña es incorrecta');
        console.log('-> Verifica las credenciales en la consola AWS RDS');
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('-> El host no existe o no es accesible');
        console.log('-> Verifica el nombre del host y la conectividad');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('-> Conexión rechazada');
        console.log('-> Verifica el puerto y las reglas de firewall/security group');
      } else if (error.message.includes('pg_hba.conf')) {
        console.log('-> Problema de configuración de autenticación');
        console.log('-> Revisa las reglas de seguridad en AWS RDS');
      } else if (error.message.includes('certificate')) {
        console.log('-> Problema con certificado SSL');
        console.log('-> Intentando siguiente configuración...');
      } else {
        console.log('-> Error desconocido, intentando siguiente configuración...');
      }
      
      try {
        await client.end();
      } catch (endError) {
        // Ignorar error al cerrar
      }
      
      continue; // Intentar siguiente configuración
    }
  }
  
  console.log('\n=== FALLIDO: No se pudo establecer conexión ===');
  console.log('\nRecomendaciones:');
  console.log('1. Verifica las credenciales en la consola AWS RDS');
  console.log('2. Revisa que el Security Group permita tu IP');
  console.log('3. Confirma que la base de datos exista');
  console.log('4. Verifica que el usuario tenga permisos de conexión');
  
  return false;
}

// Ejecutar la prueba
testConnection().then(success => {
  if (success) {
    console.log('\n¡La conexión a AWS RDS está funcionando!');
  } else {
    console.log('\nDebes resolver los problemas de conexión antes de continuar.');
  }
}).catch(error => {
  console.error('Error inesperado:', error);
});

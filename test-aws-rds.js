// Script para probar la conexión a AWS RDS directamente
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

async function testAWSRDSConnection() {
  console.log('=== Prueba de Conexión AWS RDS ===');
  
  // Mostrar configuración (sin mostrar datos sensibles)
  console.log('Configuración:');
  console.log('- Host:', process.env.AWS_RDS_HOST ? 'Configurado' : 'No configurado');
  console.log('- Port:', process.env.AWS_RDS_PORT || '5432');
  console.log('- Database:', process.env.AWS_RDS_DATABASE ? 'Configurado' : 'No configurado');
  console.log('- User:', process.env.AWS_RDS_USER ? 'Configurado' : 'No configurado');
  console.log('- Password:', process.env.AWS_RDS_PASSWORD ? 'Configurado' : 'No configurado');
  console.log('- Node Env:', process.env.NODE_ENV);
  
  // Verificar que todas las variables necesarias estén configuradas
  if (!process.env.AWS_RDS_HOST || !process.env.AWS_RDS_DATABASE || 
      !process.env.AWS_RDS_USER || !process.env.AWS_RDS_PASSWORD) {
    console.error('\nERROR: Faltan variables de entorno obligatorias');
    console.log('Por favor, configura las siguientes variables en tu archivo .env.local:');
    console.log('- AWS_RDS_HOST');
    console.log('- AWS_RDS_DATABASE');
    console.log('- AWS_RDS_USER');
    console.log('- AWS_RDS_PASSWORD');
    return false;
  }

  const client = new Client({
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE,
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('\nIntentando conectar a AWS RDS...');
    await client.connect();
    
    console.log('¡Conexión exitosa!');
    
    // Probar una consulta simple
    const result = await client.query('SELECT version() as version, NOW() as current_time');
    console.log('Versión de PostgreSQL:', result.rows[0].version);
    console.log('Hora actual del servidor:', result.rows[0].current_time);
    
    // Listar bases de datos disponibles
    const dbList = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('\nBases de datos disponibles:');
    dbList.rows.forEach(row => {
      console.log('- ', row.datname);
    });
    
    await client.end();
    console.log('\nConexión cerrada exitosamente');
    return true;
    
  } catch (error) {
    console.error('\nERROR de conexión:', error.message);
    
    // Proporcionar sugerencias basadas en el error
    if (error.message.includes('ENOTFOUND')) {
      console.log('Sugerencia: Verifica que el host de AWS RDS sea correcto');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('Sugerencia: Verifica que el puerto y el firewall permitan la conexión');
    } else if (error.message.includes('password')) {
      console.log('Sugerencia: Verifica las credenciales de usuario y contraseña');
    } else if (error.message.includes('database')) {
      console.log('Sugerencia: Verifica que el nombre de la base de datos sea correcto');
    }
    
    try {
      await client.end();
    } catch (endError) {
      // Ignorar error al cerrar conexión
    }
    return false;
  }
}

testAWSRDSConnection().then(success => {
  console.log('\n=== Resultado de la Prueba ===');
  console.log(success ? 'CONEXIÓN EXITOSA' : 'CONEXIÓN FALLIDA');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Error inesperado:', error);
  process.exit(1);
});

// Script para ayudar a configurar AWS RDS correctamente
require('dotenv').config({ path: '.env.local' });

console.log('=== Configuración de AWS RDS ===');

const databaseUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL actual:', databaseUrl);

// Si DATABASE_URL solo contiene el host, necesitamos las otras variables
if (databaseUrl && !databaseUrl.includes('://')) {
  console.log('\nDATABASE_URL parece ser solo el host del servidor RDS');
  console.log('Host detectado:', databaseUrl);
  
  const awsVars = {
    'AWS_RDS_HOST': databaseUrl,
    'AWS_RDS_PORT': '5432',
    'AWS_RDS_DATABASE': 'postgres', // Base de datos por defecto
    'AWS_RDS_USER': 'postgres',    // Usuario por defecto
    'AWS_RDS_PASSWORD': 'TU_PASSWORD_AQUI', // Necesitas proporcionar esto
  };
  
  console.log('\nVariables de entorno sugeridas:');
  console.log('Por favor, agrega estas variables a tu archivo .env.local:');
  console.log('');
  
  Object.entries(awsVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  console.log('\nNOTA: Debes reemplazar TU_PASSWORD_AQUI con tu contraseña real de RDS');
  console.log('y verificar que el nombre de usuario y base de datos sean correctos.');
  
} else if (databaseUrl && databaseUrl.includes('://')) {
  console.log('DATABASE_URL tiene formato completo, extrayendo información...');
  
  const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = databaseUrl.match(urlPattern);
  
  if (match) {
    const [, username, password, host, port, database] = match;
    
    console.log('\nVariables extraídas:');
    console.log(`AWS_RDS_HOST=${host}`);
    console.log(`AWS_RDS_PORT=${port}`);
    console.log(`AWS_RDS_DATABASE=${database}`);
    console.log(`AWS_RDS_USER=${username}`);
    console.log(`AWS_RDS_PASSWORD=${password}`);
    
    // Probar conexión
    testRDSConnection(host, port, database, username, password);
  } else {
    console.log('No se pudo extraer la información de la URL');
  }
} else {
  console.log('No se encontró DATABASE_URL');
}

async function testRDSConnection(host, port, database, user, password) {
  const { Client } = require('pg');
  
  const client = new Client({
    host,
    port: parseInt(port),
    database,
    user,
    password,
    ssl: false // Desarrollo
  });

  try {
    console.log('\n=== Probando conexión a RDS ===');
    await client.connect();
    console.log('¡Conexión exitosa!');
    
    const result = await client.query('SELECT version() as version, NOW() as current_time');
    console.log('Versión PostgreSQL:', result.rows[0].version.split(',')[0]);
    console.log('Hora servidor:', result.rows[0].current_time);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('Error de conexión:', error.message);
    console.log('\nSugerencias:');
    if (error.message.includes('ENOTFOUND')) {
      console.log('- Verifica que el host sea correcto');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('- Verifica que el puerto y firewall permitan la conexión');
    } else if (error.message.includes('password')) {
      console.log('- Verifica usuario y contraseña');
    }
    return false;
  }
}

// Mostrar información de AWS configurada
console.log('\n=== Credenciales AWS Configuradas ===');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('AWS_REGION:', process.env.AWS_REGION || 'NO CONFIGURADO');

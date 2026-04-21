// Script para configurar variables de AWS RDS a partir del DATABASE_URL
require('dotenv').config({ path: '.env.local' });

console.log('=== Configuración Automática de AWS RDS ===');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: No se encontró DATABASE_URL en las variables de entorno');
  process.exit(1);
}

console.log('DATABASE_URL encontrado:', databaseUrl);

// Extraer información de la URL de conexión
// Formato: postgresql://username:password@host:port/database
const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
const match = databaseUrl.match(urlPattern);

if (!match) {
  console.error('ERROR: Formato de DATABASE_URL no válido');
  console.log('Formato esperado: postgresql://username:password@host:port/database');
  process.exit(1);
}

const [, username, password, host, port, database] = match;

console.log('\nInformación extraída de DATABASE_URL:');
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Database: ${database}`);
console.log(`User: ${username}`);
console.log(`Password: ${password ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);

// Generar el contenido para el archivo .env.local
const envVars = [
  `# AWS RDS Configuration (extraído de DATABASE_URL)`,
  `AWS_RDS_HOST=${host}`,
  `AWS_RDS_PORT=${port}`,
  `AWS_RDS_DATABASE=${database}`,
  `AWS_RDS_USER=${username}`,
  `AWS_RDS_PASSWORD=${password}`,
  '',
  `# AWS Credentials (ya existentes)`,
  `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID || ''}`,
  `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY || ''}`,
  `AWS_REGION=${process.env.AWS_REGION || 'us-east-2'}`,
  '',
  `# Supabase Configuration (ya existentes)`,
  `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`,
  `SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
  '',
  `# Otras variables`,
  `NODE_ENV=${process.env.NODE_ENV || 'development'}`
];

console.log('\n=== Variables de entorno generadas ===');
console.log('Las siguientes variables deben agregarse a tu archivo .env.local:');
console.log('');
envVars.forEach(line => {
  if (line.includes('PASSWORD') || line.includes('SECRET') || line.includes('KEY')) {
    console.log(line.replace(/=.+/, '=***VALOR_SECRETO***'));
  } else {
    console.log(line);
  }
});

// Crear un archivo con las variables sugeridas
const fs = require('fs');
const suggestedEnvPath = '.env.local.suggested';
fs.writeFileSync(suggestedEnvPath, envVars.join('\n'));

console.log(`\nArchivo de sugerencias creado: ${suggestedEnvPath}`);
console.log('Puedes copiar las variables de este archivo a tu .env.local actual');

// Probar la conexión con las variables extraídas
async function testConnection() {
  const { Client } = require('pg');
  
  const client = new Client({
    host,
    port: parseInt(port),
    database,
    user: username,
    password,
    ssl: false // Desarrollo
  });

  try {
    console.log('\n=== Probando conexión con variables extraídas ===');
    await client.connect();
    console.log('¡Conexión exitosa!');
    
    const result = await client.query('SELECT version() as version, NOW() as current_time');
    console.log('Versión de PostgreSQL:', result.rows[0].version.split(',')[0]);
    console.log('Hora del servidor:', result.rows[0].current_time);
    
    await client.end();
    console.log('Conexión cerrada exitosamente');
    return true;
    
  } catch (error) {
    console.error('ERROR de conexión:', error.message);
    try {
      await client.end();
    } catch (e) {
      // Ignorar error al cerrar
    }
    return false;
  }
}

testConnection().then(success => {
  console.log(`\n=== Resultado ===`);
  console.log(success ? 'CONEXIÓN EXITOSA - La configuración es correcta' : 'CONEXIÓN FALLIDA - Revisa las credenciales');
});

// Script para probar la conexión pidiendo la contraseña
require('dotenv').config({ path: '.env.local' });

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Prueba de Conexión AWS RDS ===');
console.log('Configuración actual:');
console.log('- Host:', process.env.AWS_RDS_HOST);
console.log('- Port:', process.env.AWS_RDS_PORT);
console.log('- Database:', process.env.AWS_RDS_DATABASE);
console.log('- User:', process.env.AWS_RDS_USER);
console.log('- Password:', process.env.AWS_RDS_PASSWORD === 'TU_PASSWORD_AQUI' ? 'NECESITA ACTUALIZARSE' : 'CONFIGURADO');

if (process.env.AWS_RDS_PASSWORD === 'TU_PASSWORD_AQUI') {
  console.log('\nNecesitas proporcionar tu contraseña real de RDS');
  
  rl.question('Por favor, ingresa tu contraseña de RDS: ', (password) => {
    testConnection(password);
    rl.close();
  });
} else {
  testConnection(process.env.AWS_RDS_PASSWORD);
  rl.close();
}

async function testConnection(password) {
  const { Client } = require('pg');
  
  const client = new Client({
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE,
    user: process.env.AWS_RDS_USER,
    password: password,
    ssl: false // Desarrollo
  });

  try {
    console.log('\n=== Probando conexión a AWS RDS ===');
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
    `);
    
    if (tables.rows.length > 0) {
      console.log('\nTablas encontradas:');
      tables.rows.forEach(row => {
        console.log('- ', row.table_name);
      });
    } else {
      console.log('\nNo se encontraron tablas en el schema public');
    }
    
    await client.end();
    console.log('\nConexión cerrada exitosamente');
    
    // Actualizar el archivo .env.local si la conexión fue exitosa
    if (process.env.AWS_RDS_PASSWORD === 'TU_PASSWORD_AQUI') {
      updateEnvPassword(password);
    }
    
  } catch (error) {
    console.error('Error de conexión:', error.message);
    
    console.log('\nSugerencias:');
    if (error.message.includes('ENOTFOUND')) {
      console.log('- Verifica que el host sea correcto');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('- Verifica que el puerto y firewall permitan la conexión');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('- Verifica usuario y contraseña');
    } else if (error.message.includes('database')) {
      console.log('- Verifica que el nombre de la base de datos sea correcto');
    }
    
    try {
      await client.end();
    } catch (e) {
      // Ignorar error al cerrar
    }
  }
}

function updateEnvPassword(password) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(__dirname, '.env.local');
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Reemplazar la contraseña temporal
    content = content.replace('AWS_RDS_PASSWORD=TU_PASSWORD_AQUI', `AWS_RDS_PASSWORD=${password}`);
    
    fs.writeFileSync(envPath, content);
    console.log('\nContraseña actualizada en .env.local');
  } catch (error) {
    console.log('No se pudo actualizar el archivo .env.local:', error.message);
  }
}

// Script para configurar las credenciales correctas del backend externo
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');

console.log('=== Configuración de Credenciales del Backend Externo ===');

const correctCredentials = `
# Credenciales del Backend Externo
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=password123

# URL del Backend Externo
EXTERNAL_API_BASE=https://d2o45auo4j2cpf.cloudfront.net
`;

// Leer el archivo .env.local actual
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('Archivo .env.local leído');
} catch (error) {
  console.log('Creando nuevo archivo .env.local');
  envContent = '';
}

// Actualizar o agregar las credenciales
const lines = envContent.split('\n');
let updatedLines = [];
let credentialsFound = false;

for (const line of lines) {
  if (line.startsWith('ADMIN_EMAIL=') || line.startsWith('ADMIN_PASSWORD=')) {
    credentialsFound = true;
    continue; // Eliminar las credenciales existentes
  }
  if (line.trim() !== '') {
    updatedLines.push(line);
  }
}

// Agregar las credenciales correctas
updatedLines.push(...correctCredentials.trim().split('\n'));

// Escribir el archivo actualizado
try {
  fs.writeFileSync('.env.local', updatedLines.join('\n') + '\n');
  console.log('Credenciales configuradas exitosamente en .env.local');
  
  console.log('\nCredenciales configuradas:');
  console.log('ADMIN_EMAIL=admin@company.com');
  console.log('ADMIN_PASSWORD=password123');
  console.log('EXTERNAL_API_BASE=https://d2o45auo4j2cpf.cloudfront.net');
  
} catch (error) {
  console.error('Error configurando credenciales:', error.message);
  console.log('\nPor favor, agrega manualmente estas líneas a tu archivo .env.local:');
  console.log(correctCredentials);
}

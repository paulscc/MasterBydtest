// Script para agregar las variables AWS_RDS faltantes al .env.local
const fs = require('fs');
const path = require('path');

console.log('=== Agregando variables AWS_RDS faltantes ===');

const envPath = path.join(__dirname, '.env.local');

try {
  // Leer el archivo actual
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  
  // Extraer el host de DATABASE_URL
  const databaseUrlLine = lines.find(line => line.startsWith('DATABASE_URL='));
  let rdsHost = '';
  
  if (databaseUrlLine) {
    rdsHost = databaseUrlLine.split('=')[1];
    console.log('Host RDS detectado:', rdsHost);
  }
  
  // Variables AWS_RDS que necesitamos agregar
  const awsRdsVars = [
    `AWS_RDS_HOST=${rdsHost}`,
    'AWS_RDS_PORT=5432',
    'AWS_RDS_DATABASE=postgres',
    'AWS_RDS_USER=postgres',
    'AWS_RDS_PASSWORD=TU_PASSWORD_AQUI' // Necesita ser actualizado manualmente
  ];
  
  console.log('\nVariables que se agregarán:');
  awsRdsVars.forEach((line, index) => {
    console.log(`${index + 1}. ${line}`);
  });
  
  // Crear el nuevo contenido
  let newContent = content;
  
  // Agregar las variables AWS_RDS al final del archivo
  awsRdsVars.forEach(varLine => {
    if (!content.includes(varLine.split('=')[0])) {
      newContent += '\n' + varLine;
    }
  });
  
  // Guardar el archivo actualizado
  fs.writeFileSync(envPath, newContent);
  
  console.log('\nVariables AWS_RDS agregadas a .env.local');
  console.log('\nIMPORTANTE: Debes editar .env.local y reemplazar TU_PASSWORD_AQUI con tu contraseña real de RDS');
  
  // Verificar el archivo actualizado
  console.log('\n=== Verificación del archivo actualizado ===');
  const updatedContent = fs.readFileSync(envPath, 'utf8');
  const updatedLines = updatedContent.split('\n');
  
  updatedLines.forEach((line, index) => {
    if (line.trim() && (line.includes('AWS_RDS') || line.includes('DATABASE_URL'))) {
      console.log(`Línea ${index + 1}: ${line}`);
    }
  });
  
} catch (error) {
  console.error('Error:', error.message);
}

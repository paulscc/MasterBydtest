// Script para leer el archivo .env.local directamente
const fs = require('fs');
const path = require('path');

console.log('=== Leyendo archivo .env.local directamente ===');

const envPath = path.join(__dirname, '.env.local');

try {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('Contenido completo del archivo .env.local:');
  console.log('=====================================');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (line.trim()) {
      console.log(`Línea ${lineNumber}: ${line}`);
    } else {
      console.log(`Línea ${lineNumber}: [línea vacía]`);
    }
  });
  
  console.log('\n=== Análisis de líneas 5, 6, 7, 8 ===');
  for (let i = 4; i < 8 && i < lines.length; i++) {
    const line = lines[i];
    console.log(`Línea ${i + 1}: "${line}"`);
    
    if (line.includes('AWS_RDS')) {
      console.log('  -> Esta es una variable AWS_RDS');
      
      // Extraer nombre y valor
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const varName = line.substring(0, equalIndex).trim();
        const varValue = line.substring(equalIndex + 1).trim();
        console.log(`  -> Variable: ${varName}`);
        console.log(`  -> Valor: ${varValue || 'VACÍO'}`);
      }
    }
  }
  
  console.log('\n=== Variables AWS_RDS encontradas ===');
  const awsRdsVars = lines.filter(line => 
    line.trim() && line.includes('AWS_RDS') && !line.startsWith('#')
  );
  
  if (awsRdsVars.length > 0) {
    awsRdsVars.forEach((line, index) => {
      console.log(`${index + 1}. ${line}`);
    });
  } else {
    console.log('No se encontraron variables AWS_RDS');
  }
  
} catch (error) {
  console.error('Error al leer el archivo .env.local:', error.message);
}

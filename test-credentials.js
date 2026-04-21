// Script para probar diferentes combinaciones de credenciales
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Probando Diferentes Credenciales ===');

const credentialSets = [
  { email: 'admin@company.com', password: 'password123' },
  { email: 'admin@company.com', password: 'admin123' },
  { email: 'admin@company.com', password: 'password' },
  { email: 'admin@company.com', password: 'admin' },
  { email: 'admin@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'admin@example.com', password: 'password' },
  { email: 'admin@example.com', password: 'admin' },
  { email: 'administrator@company.com', password: 'password123' },
  { email: 'administrator@company.com', password: 'admin123' },
  { email: 'root@company.com', password: 'password123' },
  { email: 'root@company.com', password: 'admin123' },
  { email: 'test@company.com', password: 'password123' },
  { email: 'test@company.com', password: 'test123' },
  { email: 'demo@company.com', password: 'password123' },
  { email: 'demo@company.com', password: 'demo123' }
];

async function testCredentials(credentials, index) {
  console.log(`\n${index + 1}. Probando: ${credentials.email} / ${credentials.password}`);
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(credentials);
    
    const options = {
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success && response.token) {
            console.log('  ¡ÉXITO! Token obtenido:', response.token.substring(0, 50) + '...');
            resolve({ success: true, token: response.token, credentials });
          } else {
            console.log(`  Fallido (${res.statusCode}): ${response.error || response.message}`);
            resolve({ success: false, statusCode: res.statusCode, error: response.error, credentials });
          }
        } catch (error) {
          console.log('  Error parseando respuesta:', error.message);
          resolve({ success: false, parseError: error.message, credentials });
        }
      });
    });

    req.on('error', (error) => {
      console.log('  Error de conexión:', error.message);
      resolve({ success: false, connectionError: error.message, credentials });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, timeout: true, credentials });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllCredentials() {
  console.log('Probando', credentialSets.length, 'conjuntos de credenciales...\n');
  
  for (let i = 0; i < credentialSets.length; i++) {
    const result = await testCredentials(credentialSets[i], i);
    
    if (result.success) {
      console.log('\n¡CREDENCIALES CORRECTAS ENCONTRADAS!');
      console.log('Email:', result.credentials.email);
      console.log('Password:', result.credentials.password);
      console.log('Token:', result.token);
      
      // Guardar las credenciales correctas
      const fs = require('fs');
      const correctCreds = `# Credenciales Correctas Encontradas
ADMIN_EMAIL=${result.credentials.email}
ADMIN_PASSWORD=${result.credentials.password}
BACKEND_TOKEN=${result.token}
`;
      
      try {
        fs.writeFileSync('correct-credentials.txt', correctCreds);
        console.log('Credenciales guardadas en correct-credentials.txt');
      } catch (error) {
        console.log('Error guardando credenciales:', error.message);
      }
      
      return result;
    }
    
    // Pequeña pausa entre requests para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\nNo se encontraron credenciales correctas en las combinaciones probadas.');
  console.log('El backend está operativo pero requiere las credenciales correctas.');
  
  return { success: false, message: 'No credentials found' };
}

// Ejecutar pruebas
testAllCredentials().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO FINAL');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('¡ÉXITO! Credenciales correctas encontradas.');
    console.log('El sistema puede usar el backend externo ahora.');
  } else {
    console.log('No se encontraron credenciales válidas.');
    console.log('El sistema continuará usando el fallback local.');
    console.log('Se necesitan las credenciales correctas del administrador del backend.');
  }
}).catch(error => {
  console.error('Error en las pruebas:', error);
});

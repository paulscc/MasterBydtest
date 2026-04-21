// Script para probar credenciales manager@company.com
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Probando Credenciales Manager ===');
console.log('Email: manager@company.com');
console.log('Password: password123\n');

async function testManagerCredentials() {
  const credentials = {
    email: 'manager@company.com',
    password: 'password123'
  };

  const postData = JSON.stringify(credentials);
  
  console.log('=== REQUEST ===');
  console.log('Method: POST');
  console.log('URL: https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login');
  console.log('Headers:');
  console.log('  Content-Type: application/json');
  console.log('  Content-Length: ' + postData.length);
  console.log('Body:');
  console.log(JSON.stringify(credentials, null, 2));

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Multi-Tenant-System/1.0'
      }
    };

    const req = https.request(options, (res) => {
      console.log('\n=== RESPONSE ===');
      console.log('Status Code:', res.statusCode);
      console.log('Status Message:', res.statusMessage);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response Body:');
        console.log('Length:', data.length, 'bytes');
        
        try {
          const response = JSON.parse(data);
          console.log('Parsed Response:');
          console.log(JSON.stringify(response, null, 2));

          // Analizar la respuesta
          console.log('\n=== ANÁLISIS DE LA RESPUESTA ===');
          
          if (res.statusCode === 200 && response.success && response.token) {
            console.log('¡ÉXITO! Token obtenido correctamente');
            console.log('Token:', response.token);
            console.log('Token Length:', response.token.length);
            console.log('Tipo: JWT Token');
            
            if (response.expiresAt) {
              console.log('Expira en:', response.expiresAt);
            } else {
              console.log('Expiración: No especificada (probablemente 1 hora)');
            }
            
            resolve({
              success: true,
              token: response.token,
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 200 && !response.success) {
            console.log('Respuesta 200 pero sin éxito');
            console.log('Error:', response.error || 'No especificado');
            console.log('Message:', response.message || 'No especificado');
            
            resolve({
              success: false,
              error: response.error || 'Respuesta sin éxito',
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 401) {
            console.log('No autorizado (401)');
            console.log('Credenciales incorrectas o no válidas');
            console.log('Error:', response.error || 'No especificado');
            console.log('Message:', response.message || 'No especificado');
            
            resolve({
              success: false,
              error: 'Credenciales incorrectas',
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 400) {
            console.log('Solicitud incorrecta (400)');
            console.log('Error de validación o formato');
            
            resolve({
              success: false,
              error: 'Solicitud incorrecta',
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 500) {
            console.log('Error interno del servidor (500)');
            console.log('El backend está experimentando problemas');
            console.log('Error:', response.error || 'Error interno');
            console.log('Message:', response.message || 'Error en el servidor');
            
            resolve({
              success: false,
              error: 'Error interno del servidor',
              statusCode: res.statusCode,
              response: response
            });
            
          } else {
            console.log('Código de estado inesperado:', res.statusCode);
            console.log('Respuesta:', response);
            
            resolve({
              success: false,
              error: 'Código de estado inesperado',
              statusCode: res.statusCode,
              response: response
            });
          }
          
        } catch (parseError) {
          console.log('Error parseando la respuesta JSON');
          console.log('Parse Error:', parseError.message);
          console.log('Raw Response:');
          console.log(data);
          
          resolve({
            success: false,
            error: 'Respuesta no válida (no JSON)',
            statusCode: res.statusCode,
            rawResponse: data,
            parseError: parseError.message
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error en la solicitud');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
      
      reject({
        success: false,
        error: 'Error de conexión',
        connectionError: error.message
      });
    });

    req.on('timeout', () => {
      console.log('Timeout de la solicitud');
      req.destroy();
      
      reject({
        success: false,
        error: 'Timeout'
      });
    });

    req.setTimeout(30000); // 30 segundos

    // Enviar la solicitud
    console.log('\n=== ENVIANDO SOLICITUD ===');
    req.write(postData);
    req.end();
    console.log('Solicitud enviada, esperando respuesta...');
  });
}

// Ejecutar la prueba
async function main() {
  try {
    const result = await testManagerCredentials();
    
    console.log('\n' + '='.repeat(60));
    console.log('RESULTADO FINAL - MANAGER CREDENTIALS');
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log('¡TOKEN OBTENIDO EXITOSAMENTE CON MANAGER!');
      console.log('Token:', result.token);
      console.log('Longitud:', result.token.length);
      console.log('Status Code:', result.statusCode);
      
      console.log('\nUSO DEL TOKEN:');
      console.log('Authorization: Bearer ' + result.token);
      
      console.log('\n¡EL BACKEND EXTERNO ESTÁ LISTO PARA USARSE!');
      console.log('El sistema puede ahora usar el backend externo con estas credenciales.');
      
      // Guardar las credenciales correctas
      const fs = require('fs');
      const correctCreds = `# Credenciales Correctas Encontradas
ADMIN_EMAIL=manager@company.com
ADMIN_PASSWORD=password123
BACKEND_TOKEN=${result.token}
`;
      
      try {
        fs.writeFileSync('correct-manager-credentials.txt', correctCreds);
        console.log('Credenciales guardadas en correct-manager-credentials.txt');
      } catch (error) {
        console.log('Error guardando credenciales:', error.message);
      }
      
    } else {
      console.log('NO SE PUDO OBTENER EL TOKEN CON MANAGER');
      console.log('Error:', result.error);
      console.log('Status Code:', result.statusCode);
      
      console.log('\nRECOMENDACIÓN:');
      console.log('El sistema continuará usando el fallback local que funciona correctamente');
      console.log('Se necesitan otras credenciales para activar el backend externo');
    }
    
  } catch (error) {
    console.log('ERROR GENERAL:');
    console.log(error.message);
  }
}

// Ejecutar
main();

// Script para obtener token del backend externo
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Obtener Token del Backend Externo ===');
console.log('URL: https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login');
console.log('Credenciales: admin@company.com / password123\n');

async function getToken() {
  const credentials = {
    email: 'admin@company.com',
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
      console.log('Headers:');
      console.log(JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\nResponse Body:');
        console.log('Length:', data.length, 'bytes');
        
        try {
          const response = JSON.parse(data);
          console.log('Parsed Response:');
          console.log(JSON.stringify(response, null, 2));

          // Analizar la respuesta
          console.log('\n=== ANÁLISIS DE LA RESPUESTA ===');
          
          if (res.statusCode === 200 && response.success && response.token) {
            console.log('EXITO: Token obtenido correctamente');
            console.log('Token:', response.token);
            console.log('Token Length:', response.token.length);
            console.log('Tipo: JWT Token');
            
            // Calcular expiración (si viene en la respuesta)
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
            console.log('ERROR: Respuesta 200 pero sin éxito');
            console.log('Error:', response.error || 'No especificado');
            console.log('Message:', response.message || 'No especificado');
            
            resolve({
              success: false,
              error: response.error || 'Respuesta sin éxito',
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 401) {
            console.log('ERROR: No autorizado (401)');
            console.log('Credenciales incorrectas o no válidas');
            
            resolve({
              success: false,
              error: 'Credenciales incorrectas',
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 400) {
            console.log('ERROR: Solicitud incorrecta (400)');
            console.log('Error de validación o formato');
            
            resolve({
              success: false,
              error: 'Solicitud incorrecta',
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 500) {
            console.log('ERROR: Error interno del servidor (500)');
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
            console.log('ERROR: Código de estado inesperado:', res.statusCode);
            console.log('Respuesta:', response);
            
            resolve({
              success: false,
              error: 'Código de estado inesperado',
              statusCode: res.statusCode,
              response: response
            });
          }
          
        } catch (parseError) {
          console.log('ERROR: No se pudo parsear la respuesta JSON');
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
      console.log('ERROR: Error en la solicitud');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
      
      reject({
        success: false,
        error: 'Error de conexión',
        connectionError: error.message
      });
    });

    req.on('timeout', () => {
      console.log('ERROR: Timeout de la solicitud');
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

// Ejecutar la función para obtener el token
async function main() {
  try {
    const result = await getToken();
    
    console.log('\n' + '='.repeat(60));
    console.log('RESULTADO FINAL');
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log('TOKEN OBTENIDO EXITOSAMENTE');
      console.log('Token:', result.token);
      console.log('Longitud:', result.token.length);
      console.log('Status Code:', result.statusCode);
      
      console.log('\nUSO DEL TOKEN:');
      console.log('Authorization: Bearer ' + result.token);
      
      console.log('\nEJEMPLO DE USO:');
      console.log('curl -H "Authorization: Bearer ' + result.token + '" \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema');
      
    } else {
      console.log('NO SE PUDO OBTENER EL TOKEN');
      console.log('Error:', result.error);
      console.log('Status Code:', result.statusCode);
      
      if (result.connectionError) {
        console.log('Error de conexión:', result.connectionError);
        console.log('Solución: Verificar conexión a internet');
      }
      
      console.log('\nRECOMENDACIÓN:');
      console.log('Usar el sistema de fallback local que está funcionando correctamente');
    }
    
  } catch (error) {
    console.log('ERROR GENERAL:');
    console.log(error.message);
    
    if (error.message.includes('timeout')) {
      console.log('Solución: Verificar conexión y retry');
    }
  }
}

// Ejecutar
main();

// Script para probar credenciales admin@company.com y password
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Probando Credenciales Admin/Password ===');
console.log('Email: admin@company.com');
console.log('Password: password\n');

async function testAdminPasswordCredentials() {
  const credentials = {
    email: 'admin@company.com',
    password: 'password'
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
        console.log('Raw Response:');
        console.log('"' + data + '"');
        
        // Intentar parsear como JSON
        try {
          const response = JSON.parse(data);
          console.log('\nParsed Response:');
          console.log(JSON.stringify(response, null, 2));

          // Analizar la respuesta
          console.log('\n=== ANÁLISIS DE LA RESPUESTA ===');
          
          if (res.statusCode === 200 && response.success && response.token) {
            console.log('¡ÉXITO! Token obtenido correctamente');
            console.log('Token:', response.token);
            console.log('Token Length:', response.token.length);
            
            resolve({
              success: true,
              token: response.token,
              statusCode: res.statusCode,
              response: response
            });
            
          } else if (res.statusCode === 200 && (!response.success || !response.token)) {
            console.log('HTTP 200 pero sin éxito o sin token');
            console.log('Success:', response.success);
            console.log('Token:', response.token || 'No presente');
            console.log('Error:', response.error || 'No especificado');
            console.log('Message:', response.message || 'No especificado');
            
            resolve({
              success: false,
              error: 'Respuesta 200 sin token',
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
          console.log('\nNo se pudo parsear como JSON');
          console.log('Parse Error:', parseError.message);
          console.log('Raw Response Length:', data.length);
          console.log('Raw Response Bytes:', Array.from(data).map(b => b.charCodeAt(0)));
          
          // Si es HTTP 200 pero no es JSON, podría ser un token plano
          if (res.statusCode === 200 && data.length > 0) {
            console.log('\n¿Podría ser un token plano?');
            console.log('Possible Token:', data);
            
            // Verificar si parece un JWT (tiene 3 partes separadas por puntos)
            if (data.includes('.') && data.split('.').length === 3) {
              console.log('¡Parece ser un JWT token!');
              resolve({
                success: true,
                token: data,
                statusCode: res.statusCode,
                tokenType: 'plain_jwt'
              });
            } else {
              resolve({
                success: false,
                error: 'Respuesta 200 pero no es JSON ni JWT',
                statusCode: res.statusCode,
                rawResponse: data
              });
            }
          } else {
            resolve({
              success: false,
              error: 'Respuesta no válida',
              statusCode: res.statusCode,
              rawResponse: data,
              parseError: parseError.message
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error en la solicitud');
      console.log('Error:', error.message);
      
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

    req.setTimeout(30000);

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
    const result = await testAdminPasswordCredentials();
    
    console.log('\n' + '='.repeat(60));
    console.log('RESULTADO FINAL - ADMIN/PASSWORD');
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log('¡TOKEN OBTENIDO EXITOSAMENTE!');
      console.log('Token:', result.token);
      console.log('Longitud:', result.token.length);
      console.log('Status Code:', result.statusCode);
      console.log('Tipo:', result.tokenType || 'JSON response');
      
      console.log('\nUSO DEL TOKEN:');
      console.log('Authorization: Bearer ' + result.token);
      
      console.log('\n¡EL BACKEND EXTERNO ESTÁ LISTO PARA USARSE!');
      console.log('El sistema puede ahora usar el backend externo con estas credenciales.');
      
      // Guardar las credenciales correctas
      const fs = require('fs');
      const correctCreds = `# Credenciales Correctas Encontradas
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=password
BACKEND_TOKEN=${result.token}
`;
      
      try {
        fs.writeFileSync('correct-admin-password-credentials.txt', correctCreds);
        console.log('Credenciales guardadas en correct-admin-password-credentials.txt');
      } catch (error) {
        console.log('Error guardando credenciales:', error.message);
      }
      
    } else {
      console.log('NO SE PUDO OBTENER EL TOKEN');
      console.log('Error:', result.error);
      console.log('Status Code:', result.statusCode);
      
      if (result.rawResponse) {
        console.log('Raw Response:', result.rawResponse);
      }
      
      console.log('\nRECOMENDACIÓN:');
      console.log('El sistema continuará usando el fallback local que funciona correctamente');
    }
    
  } catch (error) {
    console.log('ERROR GENERAL:');
    console.log(error.message);
  }
}

// Ejecutar
main();

// Test específico del endpoint de login del backend externo
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Test del Endpoint de Login del Backend Externo ===');

// Función para hacer request HTTPS con más detalles
function makeRequest(url, method, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Multi-Tenant-System-Test/1.0',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`\n=== ${method} ${url} ===`);
    console.log('Headers:', JSON.stringify(options.headers, null, 2));
    if (data) console.log('Body:', JSON.stringify(data, null, 2));

    const req = https.request(options, (res) => {
      console.log(`\n--- Response ---`);
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Status Message: ${res.statusMessage}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`Response Body (${responseData.length} bytes):`);
        
        try {
          const parsed = JSON.parse(responseData);
          console.log(JSON.stringify(parsed, null, 2));
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
        } catch (error) {
          console.log('Raw Response:');
          console.log(responseData);
          console.log('Parse Error:', error.message);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: responseData, parseError: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      console.error('Stack:', error.stack);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('Request Timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000); // 30 segundos

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test 1: Verificar si el endpoint está accesible (sin autenticación)
async function testEndpointAvailability() {
  console.log('\n1. Test de Disponibilidad del Endpoint');
  console.log('=====================================');
  
  try {
    const result = await makeRequest('https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login', 'GET');
    
    console.log('\nAnálisis de Disponibilidad:');
    if (result.statusCode === 200) {
      console.log('Endpoint disponible (HTTP 200)');
    } else if (result.statusCode === 405) {
      console.log('Endpoint disponible pero método no permitido (HTTP 405)');
    } else if (result.statusCode === 404) {
      console.log('Endpoint no encontrado (HTTP 404)');
    } else {
      console.log(`Endpoint responde con código inesperado: ${result.statusCode}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error en test de disponibilidad:', error.message);
    return { error: error.message };
  }
}

// Test 2: Login con credenciales proporcionadas
async function testLoginWithCredentials() {
  console.log('\n2. Test de Login con Credenciales Proporcionadas');
  console.log('===============================================');
  
  const credentials = {
    email: 'admin@company.com',
    password: 'password123'
  };
  
  console.log(`Credenciales: ${credentials.email} / ${credentials.password}`);
  
  try {
    const result = await makeRequest(
      'https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login',
      'POST',
      credentials
    );
    
    console.log('\nAnálisis del Login:');
    if (result.statusCode === 200) {
      console.log('Login exitoso (HTTP 200)');
      if (result.data && result.data.success && result.data.token) {
        console.log('Token recibido:', result.data.token.substring(0, 50) + '...');
        console.log('Tipo de respuesta:', 'Login correcto');
      } else {
        console.log('Respuesta inesperada para HTTP 200');
      }
    } else if (result.statusCode === 401) {
      console.log('Credenciales incorrectas (HTTP 401)');
    } else if (result.statusCode === 400) {
      console.log('Solicitud incorrecta (HTTP 400)');
    } else if (result.statusCode === 500) {
      console.log('Error interno del servidor (HTTP 500)');
      console.log('El backend está teniendo problemas internos');
    } else {
      console.log(`Código de estado inesperado: ${result.statusCode}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error en test de login:', error.message);
    return { error: error.message };
  }
}

// Test 3: Login con credenciales incorrectas (para comparar)
async function testLoginWithWrongCredentials() {
  console.log('\n3. Test de Login con Credenciales Incorrectas');
  console.log('==============================================');
  
  const wrongCredentials = {
    email: 'wrong@company.com',
    password: 'wrongpassword'
  };
  
  try {
    const result = await makeRequest(
      'https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login',
      'POST',
      wrongCredentials
    );
    
    console.log('\nAnálisis con Credenciales Incorrectas:');
    if (result.statusCode === 401) {
      console.log('Rechazo correcto de credenciales incorrectas (HTTP 401)');
    } else if (result.statusCode === 400) {
      console.log('Error de validación (HTTP 400)');
    } else if (result.statusCode === 500) {
      console.log('Error interno del servidor (HTTP 500) - mismo error que con credenciales correctas');
    } else {
      console.log(`Respuesta inesperada: ${result.statusCode}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error en test con credenciales incorrectas:', error.message);
    return { error: error.message };
  }
}

// Test 4: Verificar headers del servidor
async function testServerHeaders() {
  console.log('\n4. Test de Headers del Servidor');
  console.log('===============================');
  
  try {
    const result = await makeRequest('https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login', 'OPTIONS');
    
    console.log('\nAnálisis de Headers:');
    if (result.headers) {
      console.log('Server:', result.headers.server || 'Not specified');
      console.log('Content-Type:', result.headers['content-type'] || 'Not specified');
      console.log('CORS Headers:');
      console.log('  Access-Control-Allow-Origin:', result.headers['access-control-allow-origin'] || 'Not set');
      console.log('  Access-Control-Allow-Methods:', result.headers['access-control-allow-methods'] || 'Not set');
      console.log('  Access-Control-Allow-Headers:', result.headers['access-control-allow-headers'] || 'Not set');
      console.log('CloudFront Headers:');
      console.log('  Via:', result.headers.via || 'Not set');
      console.log('  X-Amz-Cf-Id:', result.headers['x-amz-cf-id'] || 'Not set');
      console.log('  X-Amz-Cf-Pop:', result.headers['x-amz-cf-pop'] || 'Not set');
    }
    
    return result;
  } catch (error) {
    console.error('Error en test de headers:', error.message);
    return { error: error.message };
  }
}

// Función principal
async function runEndpointTests() {
  console.log('Iniciando tests del endpoint de login...\n');
  console.log('URL: https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login');
  console.log('Credenciales: admin@company.com / password123\n');
  
  try {
    // Ejecutar todos los tests
    const availabilityResult = await testEndpointAvailability();
    const loginResult = await testLoginWithCredentials();
    const wrongLoginResult = await testLoginWithWrongCredentials();
    const headersResult = await testServerHeaders();
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN COMPLETO DEL ENDPOINT');
    console.log('='.repeat(60));
    
    console.log('\n1. Disponibilidad:');
    if (availabilityResult.error) {
      console.log('  Endpoint no accesible:', availabilityResult.error);
    } else {
      console.log('  Endpoint accesible (HTTP ' + availabilityResult.statusCode + ')');
    }
    
    console.log('\n2. Login con Credenciales Correctas:');
    if (loginResult.error) {
      console.log('  Error de conexión:', loginResult.error);
    } else {
      console.log('  Código:', loginResult.statusCode);
      if (loginResult.data) {
        console.log('  Éxito:', loginResult.data.success || 'No especificado');
        console.log('  Mensaje:', loginResult.data.message || 'No especificado');
        console.log('  Error:', loginResult.data.error || 'No especificado');
      }
    }
    
    console.log('\n3. Login con Credenciales Incorrectas:');
    if (wrongLoginResult.error) {
      console.log('  Error de conexión:', wrongLoginResult.error);
    } else {
      console.log('  Código:', wrongLoginResult.statusCode);
      if (wrongLoginResult.data) {
        console.log('  Éxito:', wrongLoginResult.data.success || 'No especificado');
        console.log('  Mensaje:', wrongLoginResult.data.message || 'No especificado');
        console.log('  Error:', wrongLoginResult.data.error || 'No especificado');
      }
    }
    
    console.log('\n4. Conclusión:');
    if (loginResult.statusCode === 200 && loginResult.data && loginResult.data.success) {
      console.log('  Endpoint funcionando correctamente');
      console.log('  Login exitoso con credenciales proporcionadas');
      console.log('  Sistema de autenticación operativo');
    } else if (loginResult.statusCode === 500) {
      console.log('  Endpoint accesible pero con error interno del servidor');
      console.log('  El backend externo está experimentando problemas');
      console.log('  Recomendación: Usar sistema de fallback local');
    } else if (loginResult.statusCode === 401) {
      console.log('  Endpoint accesible pero credenciales incorrectas');
      console.log('  Recomendación: Verificar credenciales con el administrador del backend');
    } else {
      console.log('  Estado del endpoint desconocido');
      console.log('  Código de respuesta:', loginResult.statusCode);
    }
    
  } catch (error) {
    console.error('Error general en los tests:', error);
  }
}

// Ejecutar tests
runEndpointTests();

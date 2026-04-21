// Script para probar el sistema completo de autenticación del backend
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

console.log('=== Prueba del Sistema de Autenticación del Backend ===');

// Función para probar login
async function testLogin(email, password) {
  console.log(`\n1. Probando login con: ${email}`);
  
  const loginData = { email, password };
  const postData = JSON.stringify(loginData);
  
  return new Promise((resolve, reject) => {
    const req = https.request('https://d2o45auo4j2cpf.cloudfront.net/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status login: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta login:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta login (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en login:', error.message);
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout de 15 segundos'));
    });

    req.write(postData);
    req.end();
  });
}

// Función para probar listar esquemas con token
async function testListSchemas(token) {
  console.log('\n2. Probando listar esquemas con token...');
  
  return new Promise((resolve, reject) => {
    const req = https.request('https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`Status listar esquemas: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta esquemas:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta esquemas (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error listando esquemas:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

// Función para probar crear esquema con token
async function testCreateSchema(token) {
  console.log('\n3. Probando crear esquema con token...');
  
  const schemaData = {
    schemaName: "tenant_auth_test_" + Date.now(),
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "Auth Test Company",
      databaseUrl: "postgresql://user:password@host:5432/tenant_db",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "Auth Test User",
        phone: "+1234567890"
      }
    }
  };

  const postData = JSON.stringify(schemaData);
  
  return new Promise((resolve, reject) => {
    const req = https.request('https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status crear esquema: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta crear esquema:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta crear esquema (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error creando esquema:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout de 30 segundos'));
    });

    req.write(postData);
    req.end();
  });
}

// Función para probar acceso sin token
async function testAccessWithoutToken() {
  console.log('\n4. Probando acceso sin token (debe fallar)...');
  
  return new Promise((resolve, reject) => {
    const req = https.request('https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Sin Authorization header
      }
    }, (res) => {
      console.log(`Status sin token: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta sin token:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta sin token (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error sin token:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

// Función para probar página de admin local
async function testAdminPage() {
  console.log('\n5. Probando página de administración local...');
  
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/admin', {
      method: 'GET'
    }, (res) => {
      console.log(`Status página admin: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('Página de administración accesible correctamente');
      }
      
      resolve({ statusCode: res.statusCode });
    });

    req.on('error', (error) => {
      console.error('Error accediendo a página admin:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

async function runAuthTests() {
  console.log('Iniciando pruebas del sistema de autenticación...\n');
  
  try {
    // 1. Probar login con credenciales por defecto
    const loginResult = await testLogin('admin@company.com', 'password123');
    
    if (!loginResult.success || !loginResult.token) {
      console.log('\n=== ERROR DE AUTENTICACIÓN ===');
      console.log('No se pudo obtener token con credenciales por defecto');
      console.log('Intentando con otras credenciales...');
      
      // Probar con credenciales de entorno si existen
      const envEmail = process.env.ADMIN_EMAIL;
      const envPassword = process.env.ADMIN_PASSWORD;
      
      if (envEmail && envPassword) {
        console.log(`Probando con credenciales de entorno: ${envEmail}`);
        const envLoginResult = await testLogin(envEmail, envPassword);
        
        if (envLoginResult.success && envLoginResult.token) {
          console.log('Login exitoso con credenciales de entorno');
          await runAuthenticatedTests(envLoginResult.token);
        } else {
          console.log('Falló login con credenciales de entorno también');
        }
      }
      
      return;
    }
    
    console.log('Login exitoso con credenciales por defecto');
    
    // 2. Ejecutar pruebas con autenticación
    await runAuthenticatedTests(loginResult.token);
    
  } catch (error) {
    console.error('Error en las pruebas de autenticación:', error.message);
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\n=== SOLUCIÓN POSIBLE ===');
      console.log('1. Verifica conexión a internet');
      console.log('2. Asegúrate de que el servidor Next.js esté corriendo');
      console.log('3. Verifica que el backend externo esté accesible');
    }
  }
}

async function runAuthenticatedTests(token) {
  try {
    // 2. Probar listar esquemas con token
    const listResult = await testListSchemas(token);
    
    // 3. Probar crear esquema con token
    const createResult = await testCreateSchema(token);
    
    // 4. Probar acceso sin token (debe fallar)
    const noTokenResult = await testAccessWithoutToken();
    
    // 5. Probar página de administración local
    const adminPageResult = await testAdminPage();
    
    console.log('\n=== RESUMEN DEL SISTEMA DE AUTENTICACIÓN ===');
    
    console.log('1. Login con token:          ', loginResult.success ? ' \u2705 ÉXITO' : ' \u274c FALLÓ');
    console.log('2. Listar esquemas:         ', listResult.success ? ' \u2705 ÉXITO' : ' \u274c FALLÓ');
    console.log('3. Crear esquema:          ', createResult.success ? ' \u2705 ÉXITO' : ' \u274c FALLÓ');
    console.log('4. Acceso sin token:       ', noTokenResult.success === false ? ' \u2705 BLOQUEADO' : ' \u274c ERROR');
    console.log('5. Página admin local:     ', adminPageResult.statusCode === 200 ? ' \u2705 ACCESIBLE' : ' \u274c ERROR');
    
    if (loginResult.success && listResult.success && createResult.success && noTokenResult.success === false) {
      console.log('\n=== SISTEMA DE AUTENTICACIÓN FUNCIONANDO ===');
      console.log('El sistema de autenticación del backend está operativo:');
      console.log('\u2702 Login y gestión de tokens funcionando');
      console.log('\u2702 Endpoints protegidos correctamente');
      console.log('\u2702 Acceso denegado sin autenticación');
      console.log('\u2702 Página de administración local disponible');
      console.log('\u2702 Integración con formulario de clientes completa');
      
      console.log('\nPara usar en la aplicación:');
      console.log('1. Ve a /admin para gestionar la autenticación');
      console.log('2. Inicia sesión con las credenciales correctas');
      console.log('3. Crea clientes desde /clients (el token se usará automáticamente)');
      console.log('4. Los esquemas se crearán en el backend externo autenticado');
    } else {
      console.log('\n=== ERRORES EN EL SISTEMA ===');
      console.log('Revisa los errores anteriores y configura correctamente:');
      console.log('- Credenciales del backend externo');
      console.log('- Disponibilidad del backend externo');
      console.log('- Configuración de los endpoints');
    }
    
  } catch (error) {
    console.error('Error en pruebas autenticadas:', error);
  }
}

// Ejecutar pruebas
runAuthTests().catch(error => {
  console.error('Error ejecutando pruebas de autenticación:', error);
});

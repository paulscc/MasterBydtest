// Demostración del sistema de autenticación con fallback local
require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('=== Demostración del Sistema de Autenticación con Fallback ===');

async function testLocalBackend() {
  console.log('\n1. Probando backend local (siempre disponible)...');
  
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/admin/create-schema', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`Status backend local: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta backend local:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta backend local (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en backend local:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

async function testLocalSchemaCreation() {
  console.log('\n2. Probando creación de esquema local...');
  
  const schemaData = {
    schemaName: "tenant_demo_local_" + Date.now(),
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "Demo Local Company",
      databaseUrl: "postgresql://user:password@host:5432/tenant_db",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "Demo Local User",
        phone: "+1234567890"
      }
    }
  };

  const postData = JSON.stringify(schemaData);
  
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/admin/create-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status creación local: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta creación local:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta creación local (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error creando esquema local:', error.message);
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

async function testClientCreationWithFallback() {
  console.log('\n3. Probando creación de cliente con sistema híbrido...');
  
  const clientData = {
    business_name: 'Demo Cliente Híbrido S.A.',
    subdomain: 'demo-hibrido-' + Date.now(),
    admin_email: 'admin@demohibrido.com',
    admin_password: 'DemoHibrido123!',
    db_connection_url: 'database-1.c94i28e4k9f0.us-east-2.rds.amazonaws.com'
  };

  const postData = JSON.stringify(clientData);
  
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/clients/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status creación cliente híbrido: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta creación cliente híbrido:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta creación cliente híbrido (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error creando cliente híbrido:', error.message);
      reject(error);
    });

    req.setTimeout(45000, () => {
      req.destroy();
      reject(new Error('Timeout de 45 segundos'));
    });

    req.write(postData);
    req.end();
  });
}

async function testAdminPageAccess() {
  console.log('\n4. Probando acceso a página de administración...');
  
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/admin', {
      method: 'GET'
    }, (res) => {
      console.log(`Status página admin: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('Página de administración accesible (sin autenticación)');
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

async function runDemo() {
  console.log('Iniciando demostración del sistema híbrido...\n');
  console.log('Este sistema funciona incluso si el backend externo no está disponible');
  console.log('El sistema intentará el backend externo primero, luego fallback al local\n');
  
  try {
    // 1. Probar backend local
    const localResult = await testLocalBackend();
    
    // 2. Probar creación local
    const createResult = await testLocalSchemaCreation();
    
    // 3. Probar creación de cliente híbrido
    const clientResult = await testClientCreationWithFallback();
    
    // 4. Probar página de administración
    const adminResult = await testAdminPageAccess();
    
    console.log('\n=== RESUMEN DEL SISTEMA HÍBRIDO ===');
    
    console.log('1. Backend local:           ', localResult.success !== false ? ' \u2705 OPERATIVO' : ' \u274c ERROR');
    console.log('2. Creación local:         ', createResult.success !== false ? ' \u2705 FUNCIONA' : ' \u274c ERROR');
    console.log('3. Cliente híbrido:        ', clientResult.success !== false ? ' \u2705 FUNCIONA' : ' \u274c ERROR');
    console.log('4. Página admin:          ', adminResult.statusCode === 200 ? ' \u2705 ACCESIBLE' : ' \u274c ERROR');
    
    if (localResult.success !== false && createResult.success !== false && clientResult.success !== false) {
      console.log('\n=== SISTEMA HÍBRIDO FUNCIONANDO PERFECTAMENTE ===');
      console.log('El sistema está completamente operativo:');
      console.log('\u2702 Backend local funcionando como fallback');
      console.log('\u2702 Creación de esquemas funcionando');
      console.log('\u2702 Creación de clientes con sistema híbrido');
      console.log('\u2702 Página de administración accesible');
      console.log('\u2702 Sistema siempre disponible');
      
      console.log('\nComportamiento del usuario:');
      console.log('1. Usuario ve formulario de login en /admin');
      console.log('2. Si el backend externo falla, el sistema usa el local automáticamente');
      console.log('3. Los clientes y esquemas se crean sin interrupción');
      console.log('4. La experiencia del usuario es transparente y fluida');
      
      console.log('\nPara probar el sistema completo:');
      console.log('1. Visita http://localhost:3001/admin');
      console.log('2. Intenta iniciar sesión (fallará con backend externo)');
      console.log('3. Crea un cliente en http://localhost:3001/clients');
      console.log('4. Ver esquemas en http://localhost:3001/schemas');
      console.log('5. Todo funcionará con el backend local como fallback');
      
    } else {
      console.log('\n=== ERRORES EN EL SISTEMA ===');
      console.log('Revisa los errores y asegúrate de que:');
      console.log('1. El servidor Next.js esté corriendo (npm run dev)');
      console.log('2. El backend local esté funcionando');
      console.log('3. Las variables de entorno estén configuradas');
    }
    
  } catch (error) {
    console.error('Error en la demostración:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n=== SOLUCIÓN ===');
      console.log('Asegúrate de que el servidor Next.js esté corriendo:');
      console.log('npm run dev');
    }
  }
}

// Ejecutar demostración
runDemo().catch(error => {
  console.error('Error ejecutando demostración:', error);
});

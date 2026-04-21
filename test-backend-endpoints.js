// Script para probar endpoints específicos del backend externo
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Probando Endpoints Específicos del Backend Externo ===');

const CREDENTIALS = {
  email: 'admin@company.com',
  password: 'password'
};

let authToken = null;

// Obtener token
async function getToken() {
  console.log('\n1. OBTENER TOKEN');
  console.log('================');
  
  const postData = JSON.stringify(CREDENTIALS);
  
  return new Promise((resolve, reject) => {
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success && response.data.token) {
            authToken = response.data.token;
            console.log('Token obtenido exitosamente');
            resolve(authToken);
          } else {
            console.log('Error obteniendo token:', response);
            resolve(null);
          }
        } catch (error) {
          console.log('Error parseando respuesta:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error en login:', error.message);
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Probar endpoint de creación de esquemas (POST)
async function testCreateSchemaEndpoint() {
  console.log('\n2. PROBAR CREACIÓN DE ESQUEMA (POST)');
  console.log('====================================');
  
  if (!authToken) {
    console.log('Error: No hay token');
    return false;
  }

  const schemaData = {
    schemaName: `tenant_test_${Date.now()}`,
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "Test Company",
      databaseUrl: "postgresql://user:password@host:5432/tenant_db",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "Test User",
        phone: "+1234567890"
      }
    };

  const postData = JSON.stringify(schemaData);
  
  console.log('Enviando solicitud POST...');
  console.log('Schema:', schemaData.schemaName);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/admin/create-schema',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('¡Esquema creado exitosamente!');
            resolve(true);
          } else {
            console.log('Error creando esquema:', response);
            resolve(false);
          }
        } catch (error) {
          console.log('Error parseando respuesta:', error.message);
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error en request:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Probar endpoint de listado de esquemas (GET) con timeout más corto
async function testListSchemasEndpoint() {
  console.log('\n3. PROBAR LISTADO DE ESQUEMAS (GET)');
  console.log('===================================');
  
  if (!authToken) {
    console.log('Error: No hay token');
    return false;
  }

  console.log('Enviando solicitud GET...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/admin/create-schema',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('Esquemas listados exitosamente!');
            console.log('Total:', response.schemas?.length || 0);
            resolve(true);
          } else {
            console.log('Error listando esquemas:', response);
            resolve(false);
          }
        } catch (error) {
          console.log('Error parseando respuesta:', error.message);
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error en request:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('Timeout después de 10 segundos');
      resolve(false);
    });

    req.end();
  });
}

// Verificar el sistema híbrido actual
async function testHybridSystem() {
  console.log('\n4. VERIFICAR SISTEMA HÍBRIDO ACTUAL');
  console.log('===================================');
  
  try {
    // Probar creación de cliente local
    const clientData = {
      business_name: 'Test Hybrid System',
      subdomain: 'test-hybrid-' + Date.now(),
      admin_email: 'admin@testhybrid.com',
      admin_password: 'TestHybrid123!',
      db_connection_url: 'database-1.c94i28e4k9f0.us-east-2.rds.amazonaws.com'
    };

    const postData = JSON.stringify(clientData);
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/clients/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = require('http').request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('Status:', res.statusCode);
            console.log('Response:', JSON.stringify(response, null, 2));
            
            if (response.success) {
              console.log('¡Cliente creado exitosamente!');
              console.log('Schema:', response.data.schemaName);
              console.log('Backend:', response.data.message.includes('fallback') ? 'Local' : 'Externo');
              resolve(true);
            } else {
              console.log('Error creando cliente:', response);
              resolve(false);
            }
          } catch (error) {
            console.log('Error parseando respuesta:', error.message);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.log('Error en request:', error.message);
        reject(error);
      });

      req.setTimeout(45000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.log('Error verificando sistema híbrido:', error.message);
    return false;
  }
}

// Función principal
async function runTests() {
  try {
    // 1. Obtener token
    const token = await getToken();
    if (!token) {
      console.log('No se pudo obtener token. Abortando pruebas.');
      return;
    }
    
    // 2. Probar creación de esquema
    const createResult = await testCreateSchemaEndpoint();
    
    // 3. Probar listado de esquemas
    const listResult = await testListSchemasEndpoint();
    
    // 4. Verificar sistema híbrido
    const hybridResult = await testHybridSystem();
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    
    console.log('\n1. Login Admin:');
    console.log('   Estado: EXITOSO');
    console.log('   Token: Obtenido');
    
    console.log('\n2. Crear Esquema:');
    console.log('   Estado:', createResult ? 'EXITOSO' : 'FALLIDO');
    
    console.log('\n3. Listar Esquemas:');
    console.log('   Estado:', listResult ? 'EXITOSO' : 'FALLIDO');
    
    console.log('\n4. Sistema Híbrido:');
    console.log('   Estado:', hybridResult ? 'EXITOSO' : 'FALLIDO');
    
    console.log('\nConclusión:');
    if (createResult && hybridResult) {
      console.log('¡El sistema funciona correctamente!');
      console.log('- Login: Funcionando');
      console.log('- Creación de esquemas: Funcionando');
      console.log('- Sistema híbrido: Funcionando');
      console.log('- Listado de esquemas: Puede tener problemas de timeout');
    } else {
      console.log('Hay problemas que necesitan ser resueltos.');
    }
    
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

// Ejecutar pruebas
runTests();

// Script para probar el flujo completo con el backend externo
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

console.log('=== Prueba del Flujo con Backend Externo ===');

async function testAdminLogin() {
  console.log('\n1. Probando login como administrador...');
  
  const loginData = {
    email: process.env.ADMIN_EMAIL || 'admin@company.com',
    password: process.env.ADMIN_PASSWORD || 'password123'
  };

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

async function testCreateSchemaWithToken(token) {
  console.log('\n2. Probando creación de esquema con token...');
  
  const schemaData = {
    schemaName: "tenant_external_test_" + Date.now(),
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "External Backend Test Company",
      databaseUrl: "postgresql://user:password@host:5432/tenant_db",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "External Test User",
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
      console.log(`Status creación esquema: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta creación esquema:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta creación esquema (no JSON):', data);
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

async function testLocalClientCreation() {
  console.log('\n3. Probando creación de cliente local (que usa backend externo)...');
  
  const clientData = {
    business_name: 'Cliente con Backend Externo S.A.',
    subdomain: 'backend-externo-' + Date.now(),
    admin_email: 'admin@backendexterno.com',
    admin_password: 'BackendExterno123!',
    db_connection_url: process.env.DATABASE_URL || 'database-1.c94i28e4k9f0.us-east-2.rds.amazonaws.com'
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
      console.log(`Status creación cliente: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta creación cliente:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta creación cliente (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error creando cliente:', error.message);
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

async function runExternalBackendTest() {
  console.log('Iniciando prueba completa con backend externo...\n');
  
  try {
    // 1. Probar login de administrador
    const loginResult = await testAdminLogin();
    
    if (!loginResult.success || !loginResult.token) {
      console.log('\n=== ERROR DE AUTENTICACIÓN ===');
      console.log('No se pudo obtener token de administrador');
      console.log('Verifica las credenciales en las variables de entorno:');
      console.log('- ADMIN_EMAIL');
      console.log('- ADMIN_PASSWORD');
      return;
    }
    
    // 2. Probar creación directa de esquema con token
    const schemaResult = await testCreateSchemaWithToken(loginResult.token);
    
    // 3. Probar flujo completo local (que usa backend externo)
    const clientResult = await testLocalClientCreation();
    
    console.log('\n=== RESUMEN DEL FLUJO CON BACKEND EXTERNO ===');
    
    console.log('1. Login administrador:     ', loginResult.success ? ' \u2705 ÉXITO' : ' \u274c FALLÓ');
    console.log('2. Creación esquema:       ', schemaResult.success ? ' \u2705 ÉXITO' : ' \u274c FALLÓ');
    console.log('3. Creación cliente:       ', clientResult.success ? ' \u2705 ÉXITO' : ' \u274c FALLÓ');
    
    if (clientResult.success) {
      console.log('\n=== FLUJO COMPLETO FUNCIONANDO ===');
      console.log('El sistema está integrado con el backend externo:');
      console.log(`- Cliente: ${clientResult.data.businessName}`);
      console.log(`- Schema: ${clientResult.data.schemaName}`);
      console.log(`- Tablas: ${clientResult.data.tablesCreated}`);
      console.log(`- Backend: https://d2o45auo4j2cpf.cloudfront.net`);
    } else {
      console.log('\n=== ERRORES ENCONTRADOS ===');
      if (loginResult.error) console.log('Login:', loginResult.error);
      if (schemaResult.error) console.log('Schema:', schemaResult.error);
      if (clientResult.error) console.log('Cliente:', clientResult.error);
    }
    
  } catch (error) {
    console.error('Error en la prueba:', error.message);
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\n=== SOLUCIÓN POSIBLE ===');
      console.log('1. Verifica conexión a internet');
      console.log('2. Asegúrate de que el servidor Next.js esté corriendo');
      console.log('3. Verifica las credenciales del backend externo');
    }
  }
}

// Ejecutar prueba
runExternalBackendTest().catch(error => {
  console.error('Error ejecutando prueba del backend externo:', error);
});

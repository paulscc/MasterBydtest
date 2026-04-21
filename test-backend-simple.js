// Script simple para probar el backend externo
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Prueba Simple del Backend Externo ===');

const CREDENTIALS = {
  email: 'admin@company.com',
  password: 'password'
};

// 1. Login
async function login() {
  console.log('\n1. LOGIN');
  console.log('========');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(CREDENTIALS);
    
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
            console.log('Login exitoso');
            console.log('Token:', response.data.token.substring(0, 50) + '...');
            resolve(response.data.token);
          } else {
            console.log('Login fallido:', response);
            resolve(null);
          }
        } catch (error) {
          console.log('Error:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error:', error.message);
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

// 2. Crear esquema
async function createSchema(token) {
  console.log('\n2. CREAR ESQUEMA');
  console.log('===============');
  
  if (!token) {
    console.log('No hay token');
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
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/admin/create-schema',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log('Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('Esquema creado exitosamente');
            resolve(true);
          } else {
            console.log('Error creando esquema:', response);
            resolve(false);
          }
        } catch (error) {
          console.log('Error parseando:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error:', error.message);
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

// 3. Verificar sistema híbrido
async function testHybrid() {
  console.log('\n3. SISTEMA HÍBRIDO');
  console.log('==================');
  
  try {
    const clientData = {
      business_name: 'Test Hybrid',
      subdomain: 'test-hybrid-' + Date.now(),
      admin_email: 'admin@testhybrid.com',
      admin_password: 'TestHybrid123',
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
            console.log('Response:', JSON.stringify(response, null, 2));
            
            if (response.success) {
              console.log('Cliente creado exitosamente');
              console.log('Schema:', response.data.schemaName);
              console.log('Backend:', response.data.message.includes('fallback') ? 'Local' : 'Externo');
              resolve(true);
            } else {
              console.log('Error creando cliente:', response);
              resolve(false);
            }
          } catch (error) {
            console.log('Error parseando:', error.message);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.log('Error:', error.message);
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
    console.log('Error:', error.message);
    return false;
  }
}

// Ejecutar pruebas
async function main() {
  try {
    const token = await login();
    const createResult = await createSchema(token);
    const hybridResult = await testHybrid();
    
    console.log('\n=== RESUMEN ===');
    console.log('1. Login:', token ? 'EXITOSO' : 'FALLIDO');
    console.log('2. Crear Esquema:', createResult ? 'EXITOSO' : 'FALLIDO');
    console.log('3. Sistema Híbrido:', hybridResult ? 'EXITOSO' : 'FALLIDO');
    
    console.log('\n=== CONCLUSIÓN ===');
    if (token && createResult && hybridResult) {
      console.log('¡El sistema funciona correctamente!');
      console.log('Login admin: Funcionando');
      console.log('Crear esquemas: Funcionando');
      console.log('Sistema híbrido: Funcionando');
      console.log('Automatización: Implementada');
    } else {
      console.log('Hay problemas que necesitan ser resueltos');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

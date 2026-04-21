// Prueba rápida del backend externo
const https = require('https');

console.log('=== Prueba Rápida Backend Externo ===');

async function testBackend() {
  // 1. Login
  console.log('\n1. Login...');
  const loginData = JSON.stringify({
    email: 'admin@company.com',
    password: 'password'
  });
  
  const token = await new Promise((resolve) => {
    const req = https.request({
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success && response.data.token) {
            console.log('Login OK');
            resolve(response.data.token);
          } else {
            console.log('Login failed:', response);
            resolve(null);
          }
        } catch (e) {
          console.log('Parse error:', e.message);
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(null);
    });
    
    req.write(loginData);
    req.end();
  });
  
  if (!token) {
    console.log('No se pudo obtener token');
    return;
  }
  
  // 2. Crear esquema
  console.log('\n2. Crear esquema...');
  const schemaData = JSON.stringify({
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
    });
  
  const createResult = await new Promise((resolve) => {
    const req = https.request({
      hostname: 'd2o45auo4j2cpf.cloudfront.net',
      port: 443,
      path: '/api/admin/create-schema',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': schemaData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Status:', res.statusCode);
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(res.statusCode === 200 && response.success);
        } catch (e) {
          console.log('Parse error:', e.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(30000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.write(schemaData);
    req.end();
  });
  
  // 3. Sistema híbrido
  console.log('\n3. Sistema híbrido...');
  const hybridResult = await new Promise((resolve) => {
    const clientData = JSON.stringify({
      business_name: 'Test Hybrid',
      subdomain: 'test-hybrid-' + Date.now(),
      admin_email: 'admin@testhybrid.com',
      admin_password: 'TestHybrid123',
      db_connection_url: 'database-1.c94i28e4k9f0.us-east-2.rds.amazonaws.com'
    });
    
    const req = require('http').request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/clients/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': clientData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Status:', res.statusCode);
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(res.statusCode === 200 && response.success);
        } catch (e) {
          console.log('Parse error:', e.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(45000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.write(clientData);
    req.end();
  });
  
  // Resumen
  console.log('\n=== RESUMEN ===');
  console.log('1. Login Admin:', token ? 'EXITOSO' : 'FALLIDO');
  console.log('2. Crear Esquema:', createResult ? 'EXITOSO' : 'FALLIDO');
  console.log('3. Sistema Híbrido:', hybridResult ? 'EXITOSO' : 'FALLIDO');
  
  console.log('\n=== CONCLUSIÓN ===');
  if (token && createResult && hybridResult) {
    console.log('¡El sistema funciona correctamente!');
    console.log('Login admin: Funcionando');
    console.log('Crear esquemas: Funcionando');
    console.log('Sistema híbrido: Funcionando');
    console.log('Automatización: Implementada');
    console.log('\nSí, con estas credenciales se puede:');
    console.log('- Conectarse al admin');
    console.log('- Ver y crear esquemas');
    console.log('- La creación de esquemas está automatizada al crear usuarios');
  } else {
    console.log('Hay problemas que necesitan ser resueltos');
  }
}

testBackend().catch(console.error);

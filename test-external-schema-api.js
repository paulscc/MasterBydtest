// Script para probar el endpoint externo de creación de esquemas
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

console.log('=== Prueba de Endpoint Externo para Creación de Esquemas ===');

const API_BASE_URL = 'https://d2o45auo4j2cpf.cloudfront.net/api/admin';

async function testGetSchemas() {
  console.log('\n1. Probando GET /api/admin/create-schema (listar esquemas)...');
  
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/create-schema`;
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Multi-Tenant-System/1.0'
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta GET:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta GET (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en GET:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

async function testCreateSchema() {
  console.log('\n2. Probando POST /api/admin/create-schema (crear esquema)...');
  
  const schemaData = {
    schemaName: "tenant_test_external_001",
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "External Test Company",
      databaseUrl: process.env.DATABASE_URL || "database-1.c94i28e4k9f0.us-east-2.rds.amazonaws.com",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "External Test User",
        phone: "+1234567890"
      }
    }
  };

  const postData = JSON.stringify(schemaData);
  
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/create-schema`;
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Multi-Tenant-System/1.0'
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta POST:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta POST (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en POST:', error.message);
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

async function testSchemaValidation() {
  console.log('\n3. Probando validaciones con datos inválidos...');
  
  // Probar con nombre de schema inválido
  const invalidSchemaData = {
    schemaName: "tenant@invalid#name", // Caracteres no permitidos
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "Invalid Test Company",
      databaseUrl: process.env.DATABASE_URL
    }
  };

  const postData = JSON.stringify(invalidSchemaData);
  
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/create-schema`;
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Multi-Tenant-System/1.0'
      }
    }, (res) => {
      console.log(`Status (validación): ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta validación:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta validación (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en validación:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.write(postData);
    req.end();
  });
}

async function runExternalAPITests() {
  console.log('Iniciando pruebas del endpoint externo...\n');
  
  try {
    // 1. Probar GET para listar esquemas
    const getSchemasResult = await testGetSchemas();
    
    // 2. Probar POST para crear esquema
    const createSchemaResult = await testCreateSchema();
    
    // 3. Probar validaciones
    const validationResult = await testSchemaValidation();
    
    console.log('\n=== RESUMEN DE PRUEBAS ===');
    console.log('GET Listar esquemas:', getSchemasResult.success !== false ? '✅ Funciona' : '❌ Error');
    console.log('POST Crear esquema:', createSchemaResult.success !== false ? '✅ Funciona' : '❌ Error');
    console.log('Validaciones:', validationResult.success !== false ? '✅ Funciona' : '❌ Error');
    
    if (createSchemaResult.success !== false) {
      console.log('\n=== ESQUEMA CREADO EXITOSAMENTE ===');
      console.log('Puedes ahora usar este esquema en tu sistema local.');
    }
    
  } catch (error) {
    console.error('Error en las pruebas:', error.message);
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\n=== SOLUCIÓN POSIBLE ===');
      console.log('El endpoint externo no está accesible.');
      console.log('Puedes implementar la misma funcionalidad localmente usando:');
      console.log('1. El script test-tenant-creation.js existente');
      console.log('2. Adaptando el endpoint local /api/clients/create');
      console.log('3. Implementando las validaciones requeridas');
    }
  }
}

// Ejecutar pruebas
runExternalAPITests().catch(error => {
  console.error('Error ejecutando pruebas del endpoint externo:', error);
});

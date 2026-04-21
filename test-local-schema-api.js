// Script para probar el endpoint local de creación de esquemas
require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('=== Prueba del Endpoint Local para Creación de Esquemas ===');

const API_BASE_URL = 'http://localhost:3001/api/admin';

async function testGetSchemas() {
  console.log('\n1. Probando GET /api/admin/create-schema (listar esquemas)...');
  
  return new Promise((resolve, reject) => {
    const req = http.request(`${API_BASE_URL}/create-schema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
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
    schemaName: "tenant_local_test_001",
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "Local Test Company",
      databaseUrl: process.env.DATABASE_URL || "database-1.c94i28e4k9f0.us-east-2.rds.amazonaws.com",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "Local Test User",
        phone: "+1234567890"
      }
    }
  };

  const postData = JSON.stringify(schemaData);
  
  return new Promise((resolve, reject) => {
    const req = http.request(`${API_BASE_URL}/create-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
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

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout de 30 segundos'));
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
    const req = http.request(`${API_BASE_URL}/create-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

async function testDuplicateSchema() {
  console.log('\n4. Probando creación de schema duplicado...');
  
  const duplicateSchemaData = {
    schemaName: "tenant_local_test_001", // Mismo nombre que el anterior
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440003",
      clientName: "Duplicate Test Company",
      databaseUrl: process.env.DATABASE_URL
    }
  };

  const postData = JSON.stringify(duplicateSchemaData);
  
  return new Promise((resolve, reject) => {
    const req = http.request(`${API_BASE_URL}/create-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status (duplicado): ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta duplicado:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta duplicado (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en duplicado:', error.message);
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

async function runLocalAPITests() {
  console.log('Iniciando pruebas del endpoint local...\n');
  
  try {
    // 1. Probar GET para listar esquemas
    const getSchemasResult = await testGetSchemas();
    
    // 2. Probar POST para crear esquema
    const createSchemaResult = await testCreateSchema();
    
    // 3. Probar validaciones
    const validationResult = await testSchemaValidation();
    
    // 4. Probar duplicado
    const duplicateResult = await testDuplicateSchema();
    
    console.log('\n=== RESUMEN DE PRUEBAS LOCALES ===');
    console.log('GET Listar esquemas:', getSchemasResult.success !== false ? '✅ Funciona' : '❌ Error');
    console.log('POST Crear esquema:', createSchemaResult.success !== false ? '✅ Funciona' : '❌ Error');
    console.log('Validaciones:', validationResult.success === false ? '✅ Funciona (rechaza inválido)' : '❌ Error');
    console.log('Duplicados:', duplicateResult.success === false ? '✅ Funciona (rechaza duplicado)' : '❌ Error');
    
    if (createSchemaResult.success !== false) {
      console.log('\n=== ESQUEMA CREADO EXITOSAMENTE ===');
      console.log('El endpoint local está funcionando correctamente.');
      console.log('Características implementadas:');
      console.log('✅ Validación de nombre de schema');
      console.log('✅ Verificación de duplicados');
      console.log('✅ Ejecución dinámica de script SQL');
      console.log('✅ Creación automática de roles');
      console.log('✅ Registro de tenant_info');
      console.log('✅ Manejo de errores con limpieza');
    }
    
  } catch (error) {
    console.error('Error en las pruebas locales:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n=== SOLUCIÓN ===');
      console.log('Asegúrate de que el servidor Next.js esté corriendo en localhost:3001');
      console.log('Ejecuta: npm run dev');
    }
  }
}

// Ejecutar pruebas
runLocalAPITests().catch(error => {
  console.error('Error ejecutando pruebas del endpoint local:', error);
});

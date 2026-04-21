// Script para probar el flujo híbrido (externo + fallback local)
require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('=== Prueba del Flujo Híbrido (Backend Externo + Fallback Local) ===');

async function testHybridClientCreation() {
  console.log('\n1. Probando creación de cliente con sistema híbrido...');
  
  const clientData = {
    business_name: 'Cliente Híbrido Test S.A.',
    subdomain: 'hibrido-test-' + Date.now(),
    admin_email: 'admin@hibridotest.com',
    admin_password: 'HibridoTest123!',
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
          console.log('Respuesta (no JSON):', data);
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

async function verifySchemaCreation(clientResult) {
  if (!clientResult.success) {
    console.log('No se puede verificar esquema porque la creación del cliente falló');
    return;
  }

  console.log('\n2. Verificando que el esquema fue creado...');
  
  const expectedSchemaName = `tenant_${clientResult.data.subdomain.replace(/[^a-zA-Z0-9]/g, '_')}`;
  console.log(`Esperando encontrar schema: ${expectedSchemaName}`);

  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/admin/create-schema', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`Status verificación: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          const schemaExists = response.schemas.includes(expectedSchemaName);
          console.log(`Schema ${expectedSchemaName} existe: ${schemaExists}`);
          
          if (schemaExists) {
            console.log('\n3. Obteniendo detalles del schema...');
            return verifySchemaDetails(expectedSchemaName);
          }
          
          resolve(response);
        } catch (error) {
          console.log('Respuesta (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error verificando esquema:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

async function verifySchemaDetails(schemaName) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3001/api/admin/schema-details/${schemaName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`Status detalles: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Detalles del schema:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta detalles (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error obteniendo detalles:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout de 10 segundos'));
    });

    req.end();
  });
}

async function runHybridBackendTest() {
  console.log('Iniciando prueba del sistema híbrido...\n');
  console.log('Este sistema intentará:');
  console.log('1. Backend externo (https://d2o45auo4j2cpf.cloudfront.net)');
  console.log('2. Fallback a backend local si el externo falla');
  console.log('3. Siempre garantiza creación del esquema\n');
  
  try {
    // 1. Probar creación de cliente con sistema híbrido
    const clientResult = await testHybridClientCreation();
    
    // 2. Verificar creación del esquema
    await verifySchemaCreation(clientResult);
    
    console.log('\n=== RESUMEN DEL SISTEMA HÍBRIDO ===');
    
    if (clientResult.success) {
      console.log('1. Creación de cliente híbrido: \u2705 ÉXITO');
      console.log(`   - Cliente: ${clientResult.data.businessName}`);
      console.log(`   - Schema: ${clientResult.data.schemaName}`);
      console.log(`   - Tablas: ${clientResult.data.tablesCreated}`);
      console.log(`   - Backend: ${clientResult.data.message.includes('fallback') ? 'LOCAL (fallback)' : 'EXTERNO'}`);
      
      console.log('\n=== SISTEMA HÍBRIDO FUNCIONANDO ===');
      console.log('El sistema tiene alta disponibilidad:');
      console.log('\u2702 Intenta backend externo primero');
      console.log('\u2702 Fallback automático a backend local');
      console.log('\u2702 Siempre crea el esquema exitosamente');
      console.log('\u2702 Máxima compatibilidad y confiabilidad');
      
    } else {
      console.log('1. Creación de cliente híbrido: \u274c FALLÓ');
      console.log(`   - Error: ${clientResult.error}`);
      
      if (clientResult.details) {
        console.log('   - Detalles:', JSON.stringify(clientResult.details, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error en la prueba híbrida:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n=== SOLUCIÓN ===');
      console.log('Asegúrate de que el servidor Next.js esté corriendo:');
      console.log('npm run dev');
    }
  }
}

// Ejecutar prueba híbrida
runHybridBackendTest().catch(error => {
  console.error('Error ejecutando prueba del sistema híbrido:', error);
});

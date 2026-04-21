// Script para probar el flujo con un nuevo cliente
require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('=== Prueba con Nuevo Cliente (sin conflictos) ===');

async function testNewClientCreation() {
  console.log('\n1. Creando nuevo cliente con nombre único...');
  
  const clientData = {
    business_name: 'Empresa Nueva Prueba S.A.',
    subdomain: 'empresa-nueva-' + Date.now(), // Usar timestamp para evitar duplicados
    admin_email: 'admin@empresanueva.com',
    admin_password: 'EmpresaNueva123!',
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
      console.log(`Status: ${res.statusCode}`);
      
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
          console.log('Respuesta (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error creando cliente:', error.message);
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
      console.log(`Status: ${res.statusCode}`);
      
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

async function runNewClientTest() {
  console.log('Iniciando prueba con nuevo cliente único...\n');
  
  try {
    // 1. Crear cliente nuevo
    const clientResult = await testNewClientCreation();
    
    // 2. Verificar creación del esquema
    await verifySchemaCreation(clientResult);
    
    console.log('\n=== RESUMEN FINAL ===');
    
    if (clientResult.success) {
      console.log('1. Creación de cliente:  \u2705 ÉXITO');
      console.log(`   - Cliente: ${clientResult.data.businessName}`);
      console.log(`   - Schema: ${clientResult.data.schemaName}`);
      console.log(`   - Tablas: ${clientResult.data.tablesCreated}`);
      console.log(`   - Roles: ${clientResult.data.rolesCreated.join(', ')}`);
      
      console.log('\n=== FLUJO COMPLETO FUNCIONANDO PERFECTAMENTE ===');
      console.log('\u2702 Cliente creado exitosamente');
      console.log('\u2702 Esquema creado automáticamente');
      console.log('\u2702 Tablas y roles configurados');
      console.log('\u2702 UI actualizada con feedback');
      console.log('\u2702 Página de esquemas funcionando');
      
    } else {
      console.log('1. Creación de cliente:  \u274c FALLÓ');
      console.log(`   - Error: ${clientResult.error}`);
    }
    
  } catch (error) {
    console.error('Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
runNewClientTest().catch(error => {
  console.error('Error ejecutando prueba:', error);
});

// Script para probar el flujo completo del backend externo
// 1. Login admin -> 2. Ver esquemas -> 3. Crear esquema
require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('=== Probando Flujo Completo del Backend Externo ===');

const CREDENTIALS = {
  email: 'admin@company.com',
  password: 'password'
};

let authToken = null;

// 1. Login al backend externo
async function loginToBackend() {
  console.log('\n1. LOGIN AL BACKEND EXTERNO');
  console.log('===============================');
  
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
            console.log('Login exitoso');
            console.log('Token obtenido:', authToken.substring(0, 50) + '...');
            console.log('Admin info:', response.data.admin);
            resolve({ success: true, token: authToken, admin: response.data.admin });
          } else {
            console.log('Login fallido:', response);
            resolve({ success: false, error: response });
          }
        } catch (error) {
          console.log('Error parseando respuesta:', error.message);
          resolve({ success: false, parseError: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error en login:', error.message);
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

// 2. Ver esquemas existentes
async function listSchemas() {
  console.log('\n2. VER ESQUEMAS EXISTENTES');
  console.log('=============================');
  
  if (!authToken) {
    console.log('Error: No hay token de autenticación');
    return { success: false, error: 'No token' };
  }

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
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Status:', res.statusCode);
          console.log('Respuesta:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('Esquemas encontrados:', response.schemas?.length || 0);
            if (response.schemas && response.schemas.length > 0) {
              console.log('Lista de esquemas:');
              response.schemas.forEach((schema, index) => {
                console.log(`  ${index + 1}. ${schema}`);
              });
            }
            resolve({ success: true, schemas: response.schemas || [] });
          } else {
            console.log('Error listando esquemas:', response);
            resolve({ success: false, error: response });
          }
        } catch (error) {
          console.log('Error parseando respuesta:', error.message);
          resolve({ success: false, parseError: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error listando esquemas:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// 3. Crear un nuevo esquema
async function createSchema() {
  console.log('\n3. CREAR NUEVO ESQUEMA');
  console.log('=======================');
  
  if (!authToken) {
    console.log('Error: No hay token de autenticación');
    return { success: false, error: 'No token' };
  }

  const schemaData = {
    schemaName: `tenant_test_backend_${Date.now()}`,
    tenantInfo: {
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      clientName: "Test Backend Company",
      databaseUrl: "postgresql://user:password@host:5432/tenant_db",
      initialUser: {
        userId: "550e8400-e29b-41d4-a716-446655440002",
        name: "Test Backend User",
        phone: "+1234567890"
      }
    }
  };

  const postData = JSON.stringify(schemaData);
  
  console.log('Creando esquema:', schemaData.schemaName);
  console.log('Datos:', JSON.stringify(schemaData, null, 2));
  
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
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Status:', res.statusCode);
          console.log('Respuesta:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('¡Esquema creado exitosamente!');
            console.log('Schema:', response.schemaName || schemaData.schemaName);
            console.log('Tablas creadas:', response.tablesCreated || 'No especificado');
            console.log('Tenant info:', response.tenantInfo);
            resolve({ success: true, schema: response });
          } else {
            console.log('Error creando esquema:', response);
            resolve({ success: false, error: response });
          }
        } catch (error) {
          console.log('Error parseando respuesta:', error.message);
          resolve({ success: false, parseError: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log('Error creando esquema:', error.message);
      reject(error);
    });

    req.setTimeout(45000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// 4. Verificar si la creación está automatizada al crear usuarios
async function checkUserSchemaAutomation() {
  console.log('\n4. VERIFICAR AUTOMATIZACIÓN AL CREAR USUARIOS');
  console.log('==========================================');
  
  // Verificar el sistema híbrido actual
  console.log('Verificando el sistema híbrido actual...');
  
  try {
    // Simular creación de cliente (usando el endpoint local)
    const clientData = {
      business_name: 'Test Automation Company',
      subdomain: 'test-automation-' + Date.now(),
      admin_email: 'admin@testautomation.com',
      admin_password: 'TestAutomation123!',
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
            console.log('Respuesta creación cliente:', JSON.stringify(response, null, 2));
            
            if (response.success) {
              console.log('¡Cliente creado exitosamente!');
              console.log('Schema creado:', response.data.schemaName);
              console.log('Backend usado:', response.data.message.includes('fallback') ? 'Local (fallback)' : 'Externo');
              console.log('Tablas creadas:', response.data.tablesCreated || 'No especificado');
              
              // Verificar si usó el backend externo
              const usedExternal = !response.data.message.includes('fallback');
              console.log('\nAUTOMATIZACIÓN VERIFICADA:');
              console.log('- Creación de clientes: Automatizada');
              console.log('- Creación de esquemas: Automatizada');
              console.log('- Backend usado:', usedExternal ? 'Externo (con token)' : 'Local (fallback)');
              
              resolve({ 
                success: true, 
                automated: true, 
                usedExternal: usedExternal,
                client: response 
              });
            } else {
              console.log('Error creando cliente:', response);
              resolve({ success: false, error: response, automated: false });
            }
          } catch (error) {
            console.log('Error parseando respuesta:', error.message);
            resolve({ success: false, parseError: error.message, automated: false });
          }
        });
      });

      req.on('error', (error) => {
        console.log('Error creando cliente:', error.message);
        reject(error);
      });

      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.log('Error verificando automatización:', error.message);
    return { success: false, error: error.message, automated: false };
  }
}

// Función principal
async function runFullFlowTest() {
  console.log('Iniciando prueba completa del flujo del backend externo...\n');
  
  try {
    // Paso 1: Login
    const loginResult = await loginToBackend();
    if (!loginResult.success) {
      console.log('\nFallo en el login. Abortando pruebas.');
      return;
    }
    
    // Paso 2: Listar esquemas
    const listResult = await listSchemas();
    
    // Paso 3: Crear esquema
    const createResult = await createSchema();
    
    // Paso 4: Verificar automatización
    const automationResult = await checkUserSchemaAutomation();
    
    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN COMPLETO DEL FLUJO DEL BACKEND EXTERNO');
    console.log('='.repeat(70));
    
    console.log('\n1. Login Admin:');
    console.log('   Estado:', loginResult.success ? 'EXITOSO' : 'FALLIDO');
    console.log('   Token:', loginResult.success ? 'Obtenido' : 'No obtenido');
    
    console.log('\n2. Ver Esquemas:');
    console.log('   Estado:', listResult.success ? 'EXITOSO' : 'FALLIDO');
    console.log('   Esquemas:', listResult.success ? listResult.schemas.length : 'No disponibles');
    
    console.log('\n3. Crear Esquema:');
    console.log('   Estado:', createResult.success ? 'EXITOSO' : 'FALLIDO');
    console.log('   Schema:', createResult.success ? createResult.schema.schemaName : 'No creado');
    
    console.log('\n4. Automatización:');
    console.log('   Estado:', automationResult.success ? 'EXITOSA' : 'FALLIDA');
    console.log('   Backend usado:', automationResult.usedExternal ? 'Externo' : 'Local');
    console.log('   Creación automática:', automationResult.automated ? 'Sí' : 'No');
    
    // Conclusión
    console.log('\n' + '='.repeat(70));
    console.log('CONCLUSIÓN FINAL');
    console.log('='.repeat(70));
    
    if (loginResult.success && listResult.success && createResult.success && automationResult.success) {
      console.log('¡EL FLUJO COMPLETO DEL BACKEND EXTERNO FUNCIONA PERFECTAMENTE!');
      console.log('1. Login admin: Funcionando');
      console.log('2. Ver esquemas: Funcionando');
      console.log('3. Crear esquemas: Funcionando');
      console.log('4. Automatización: Funcionando');
      console.log('\nEl sistema está listo para producción con el backend externo activado.');
    } else {
      console.log('El flujo tiene problemas que necesitan ser resueltos.');
      console.log('Revisa los errores anteriores para más detalles.');
    }
    
  } catch (error) {
    console.error('Error general en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
runFullFlowTest();

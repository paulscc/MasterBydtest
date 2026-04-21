// Script para probar el endpoint de API para crear tenant
require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('=== Prueba de API para Crear Tenant ===');

// Datos del nuevo tenant para prueba vía API
const newTenant = {
  business_name: 'Empresa API Test Ltda.',
  subdomain: 'api-test-company',
  admin_email: 'admin@apitest.com',
  admin_password: 'ApiTest123456!',
  db_connection_url: process.env.DATABASE_URL
};

async function testTenantAPI() {
  const postData = JSON.stringify(newTenant);
  
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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\nRespuesta del servidor:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Respuesta (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en la petición:', error.message);
      reject(error);
    });

    // Escribir los datos
    req.write(postData);
    req.end();
  });
}

// Verificar si existe el endpoint de creación
async function checkAPIEndpoint() {
  console.log('\n1. Verificando endpoints disponibles...');
  
  try {
    const response = await testTenantAPI();
    
    if (response.success) {
      console.log('\n=== TENANT CREADO VÍA API ===');
      console.log(`Schema: ${response.data.schemaName}`);
      console.log(`Cliente ID: ${response.data.clientId}`);
      console.log(`Mensaje: ${response.data.message}`);
      
      // Verificar que el schema fue creado
      await verifyTenantSchema(response.data.schemaName);
      
    } else if (response.error) {
      console.log('\n=== ERROR EN LA API ===');
      console.log('Error:', response.error);
      
      // Intentar con endpoint alternativo
      console.log('\nIntentando con endpoint alternativo...');
      await testAlternativeEndpoint();
      
    } else {
      console.log('\nRespuesta inesperada de la API');
    }
    
  } catch (error) {
    console.error('Error probando la API:', error.message);
    
    // Crear un endpoint de prueba si no existe
    console.log('\nCreando endpoint de prueba...');
    await createTestEndpoint();
  }
}

async function verifyTenantSchema(schemaName) {
  const { Client } = require('pg');
  
  const rdsConfig = {
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE,
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    ssl: { rejectUnauthorized: false }
  };

  const client = new Client(rdsConfig);
  
  try {
    console.log('\n2. Verificando schema creado...');
    await client.connect();
    
    // Verificar que el schema existe
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);

    if (schemaCheck.rows.length > 0) {
      console.log(`Schema ${schemaName} verificado exitosamente`);
      
      // Contar tablas en el schema
      const tableCount = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = $1
      `, [schemaName]);
      
      console.log(`Tablas en schema ${schemaName}: ${tableCount.rows[0].count}`);
      
      // Listar primeras 10 tablas
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        ORDER BY table_name 
        LIMIT 10
      `, [schemaName]);
      
      console.log('Primeras 10 tablas:');
      tables.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
      
    } else {
      console.log(`Schema ${schemaName} no encontrado`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('Error verificando schema:', error.message);
  }
}

async function testAlternativeEndpoint() {
  console.log('Probando endpoint POST /api/clients...');
  
  const postData = JSON.stringify(newTenant);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/clients',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Respuesta:', response);
          resolve(response);
        } catch (error) {
          console.log('Respuesta (no JSON):', data);
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function createTestEndpoint() {
  console.log('Creando endpoint de prueba para crear tenant...');
  
  const fs = require('fs');
  const path = require('path');
  
  const endpointContent = `import { NextResponse } from 'next/server';
import { createClient } from '@/actions/clients';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Convertir JSON a FormData si viene como JSON
    const body = await request.json().catch(() => null);
    if (body) {
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }
    
    const result = await createClient(formData);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error en endpoint /api/clients/create:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}`;
  
  const endpointDir = path.join(__dirname, 'src', 'app', 'api', 'clients', 'create');
  const endpointPath = path.join(endpointDir, 'route.ts');
  
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(endpointDir)) {
      fs.mkdirSync(endpointDir, { recursive: true });
    }
    
    fs.writeFileSync(endpointPath, endpointContent);
    console.log('Endpoint creado en:', endpointPath);
    console.log('Reinicia el servidor Next.js y prueba nuevamente');
    
  } catch (error) {
    console.error('Error creando endpoint:', error.message);
  }
}

// Ejecutar la prueba
checkAPIEndpoint().then(() => {
  console.log('\nPrueba de API completada');
}).catch(error => {
  console.error('Error en prueba de API:', error);
});

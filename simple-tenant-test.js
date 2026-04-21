// Script simple para probar la creación de tenant vía API
require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('=== Prueba Simple de API Tenant ===');

const newTenant = {
  business_name: 'Empresa Simple Test',
  subdomain: 'simple-test',
  admin_email: 'admin@simpletest.com',
  admin_password: 'SimpleTest123!',
  db_connection_url: process.env.DATABASE_URL
};

async function testTenantCreation() {
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
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response Body:', data);
        
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          resolve({ rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Ejecutar prueba
testTenantCreation().then(result => {
  console.log('\n=== RESULTADO ===');
  if (result.success) {
    console.log('Tenant creado exitosamente:');
    console.log(`- Schema: ${result.data.schemaName}`);
    console.log(`- Cliente ID: ${result.data.clientId}`);
    console.log(`- Mensaje: ${result.data.message}`);
  } else if (result.error) {
    console.log('Error:', result.error);
  } else {
    console.log('Respuesta inesperada:', result);
  }
}).catch(error => {
  console.error('Error en la prueba:', error);
});

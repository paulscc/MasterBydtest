import { NextResponse } from 'next/server';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Configuración de conexión a AWS RDS
const rdsConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

// Validación de nombre de schema: solo letras, números y guiones bajos
function validateSchemaName(schemaName: string): boolean {
  const schemaRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  return schemaRegex.test(schemaName) && schemaName.length >= 3 && schemaName.length <= 50;
}

// Validación de tenantInfo
function validateTenantInfo(tenantInfo: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!tenantInfo.clientId || typeof tenantInfo.clientId !== 'string') {
    errors.push('clientId es requerido y debe ser un string');
  }
  
  if (!tenantInfo.clientName || typeof tenantInfo.clientName !== 'string') {
    errors.push('clientName es requerido y debe ser un string');
  }
  
  if (!tenantInfo.databaseUrl || typeof tenantInfo.databaseUrl !== 'string') {
    errors.push('databaseUrl es requerido y debe ser un string');
  }
  
  // Validación opcional de initialUser
  if (tenantInfo.initialUser) {
    if (!tenantInfo.initialUser.userId || typeof tenantInfo.initialUser.userId !== 'string') {
      errors.push('initialUser.userId es requerido si se proporciona initialUser');
    }
    
    if (!tenantInfo.initialUser.name || typeof tenantInfo.initialUser.name !== 'string') {
      errors.push('initialUser.name es requerido si se proporciona initialUser');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Adaptar script SQL dinámicamente al nombre del esquema
function adaptScriptToSchema(scriptContent: string, schemaName: string): string {
  // Reemplazar referencias al schema si existen
  return scriptContent.replace(/SET search_path TO\s+\w+/g, `SET search_path TO "${schemaName}"`);
}

// Crear roles básicos automáticamente
async function createBasicRoles(client: Client, schemaName: string): Promise<void> {
  const roles = [
    { name: 'admin', display_name: 'Administrator', description: 'Full system access' },
    { name: 'manager', display_name: 'Manager', description: 'Can manage most operations' },
    { name: 'user', display_name: 'User', description: 'Basic user access' }
  ];
  
  for (const role of roles) {
    await client.query(`
      INSERT INTO "${schemaName}".roles (id, name, display_name, description, is_system, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, true, true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `, [role.name, role.display_name, role.description]);
  }
}

// Registrar información del tenant en tabla tenant_info
async function registerTenantInfo(client: Client, schemaName: string, tenantInfo: any): Promise<void> {
  // Verificar si existe la tabla tenant_info en el schema public
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tenant_info (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      schema_name VARCHAR(100) UNIQUE NOT NULL,
      client_id VARCHAR(100) NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      database_url TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  
  // Insertar o actualizar información del tenant
  await client.query(`
    INSERT INTO public.tenant_info (schema_name, client_id, client_name, database_url, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, true, NOW(), NOW())
    ON CONFLICT (schema_name) 
    DO UPDATE SET 
      client_id = EXCLUDED.client_id,
      client_name = EXCLUDED.client_name,
      database_url = EXCLUDED.database_url,
      updated_at = NOW()
  `, [schemaName, tenantInfo.clientId, tenantInfo.clientName, tenantInfo.databaseUrl]);
}

// GET: Listar todos los esquemas existentes (excepto los del sistema)
export async function GET() {
  const client = new Client(rdsConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'topology')
      AND schema_name NOT LIKE 'pg_%'
      ORDER BY schema_name
    `);
    
    const schemas = result.rows.map(row => row.schema_name);
    
    await client.end();
    
    return NextResponse.json({
      success: true,
      schemas,
      count: schemas.length
    });
    
  } catch (error) {
    console.error('Error listing schemas:', error);
    
    try {
      await client.end();
    } catch (endError) {
      // Ignorar error al cerrar
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST: Crear nuevo esquema con validaciones
export async function POST(request: Request) {
  const client = new Client(rdsConfig);
  let schemaCreated = false;
  let body: any = null;
  
  try {
    body = await request.json();
    
    // Validar datos de entrada
    if (!body.schemaName) {
      return NextResponse.json({
        success: false,
        error: 'schemaName es requerido'
      }, { status: 400 });
    }
    
    if (!body.tenantInfo) {
      return NextResponse.json({
        success: false,
        error: 'tenantInfo es requerido'
      }, { status: 400 });
    }
    
    // Validar nombre del schema
    if (!validateSchemaName(body.schemaName)) {
      return NextResponse.json({
        success: false,
        error: 'schemaName solo puede contener letras, números y guiones bajos. Debe empezar con letra y tener entre 3-50 caracteres'
      }, { status: 400 });
    }
    
    // Validar tenantInfo
    const tenantValidation = validateTenantInfo(body.tenantInfo);
    if (!tenantValidation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Validación de tenantInfo fallida',
        details: tenantValidation.errors
      }, { status: 400 });
    }
    
    await client.connect();
    
    // Verificar que el esquema no exista previamente
    const existingSchema = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [body.schemaName]);
    
    if (existingSchema.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: `El esquema ${body.schemaName} ya existe`
      }, { status: 409 });
    }
    
    // Crear el esquema
    await client.query(`CREATE SCHEMA "${body.schemaName}"`);
    schemaCreated = true;
    
    // Leer y adaptar el script SQL
    const scriptPath = path.join(process.cwd(), 'script_corrected++.sql');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`No se encuentra el archivo ${scriptPath}`);
    }
    
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    scriptContent = adaptScriptToSchema(scriptContent, body.schemaName);
    
    // Establecer search_path y ejecutar el script
    await client.query(`SET search_path TO "${body.schemaName}", public`);
    await client.query(scriptContent);
    
    // Crear roles básicos
    await createBasicRoles(client, body.schemaName);
    
    // Crear usuario inicial si se proporciona
    if (body.tenantInfo.initialUser) {
      await client.query(`
        INSERT INTO "${body.schemaName}".users (id, name, phone, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          updated_at = NOW()
      `, [
        body.tenantInfo.initialUser.userId,
        body.tenantInfo.initialUser.name,
        body.tenantInfo.initialUser.phone || null,
        true
      ]);
    }
    
    // Registrar información del tenant
    await registerTenantInfo(client, body.schemaName, body.tenantInfo);
    
    // Verificar creación exitosa
    const tableCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, [body.schemaName]);
    
    await client.end();
    
    return NextResponse.json({
      success: true,
      message: `Esquema ${body.schemaName} creado exitosamente`,
      schemaName: body.schemaName,
      tenantInfo: {
        clientId: body.tenantInfo.clientId,
        clientName: body.tenantInfo.clientName,
        initialUserCreated: !!body.tenantInfo.initialUser
      },
      tablesCreated: parseInt(tableCount.rows[0].count),
      rolesCreated: ['admin', 'manager', 'user']
    });
    
  } catch (error) {
    console.error('Error creating schema:', error);
    
    // Manejo de errores con limpieza: eliminar esquema parcialmente creado
    if (schemaCreated && body?.schemaName) {
      try {
        await client.query(`DROP SCHEMA IF EXISTS "${body.schemaName}" CASCADE`);
        console.log(`Esquema ${body.schemaName} eliminado debido a error`);
      } catch (cleanupError) {
        console.error('Error limpiando esquema:', cleanupError);
      }
    }
    
    try {
      await client.end();
    } catch (endError) {
      // Ignorar error al cerrar
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

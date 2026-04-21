import { NextResponse } from 'next/server';
import { Client } from 'pg';

// Configuración de conexión a AWS RDS
const rdsConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

// GET: Obtener detalles de un schema específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ schemaName: string }> }
) {
  const client = new Client(rdsConfig);
  
  try {
    await client.connect();
    
    const { schemaName } = await params;
    
    // Validar que el schema exista
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);

    if (schemaCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Schema ${schemaName} not found`
      }, { status: 404 });
    }

    // Contar tablas en el schema
    const tableCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, [schemaName]);

    // Contar usuarios si existe tabla users
    let userCount = 0;
    try {
      const usersTableCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'users'
      `, [schemaName]);
      
      if (parseInt(usersTableCheck.rows[0].count) > 0) {
        const userResult = await client.query(`
          SELECT COUNT(*) as count
          FROM "${schemaName}".users
        `);
        userCount = parseInt(userResult.rows[0].count);
      }
    } catch (error) {
      // Ignorar error si no hay tabla users
    }

    // Obtener fecha de creación (approximada)
    let createdAt = 'Unknown';
    try {
      if (schemaName.startsWith('tenant_')) {
        // Intentar obtener de tenant_info
        const tenantInfo = await client.query(`
          SELECT created_at 
          FROM public.tenant_info 
          WHERE schema_name = $1
        `, [schemaName]);

        if (tenantInfo.rows.length > 0) {
          createdAt = new Date(tenantInfo.rows[0].created_at).toLocaleDateString();
        }
      }
    } catch (error) {
      // Ignorar error
    }

    // Listar algunas tablas clave
    const keyTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name 
      LIMIT 10
    `, [schemaName]);

    await client.end();

    return NextResponse.json({
      success: true,
      schemaName,
      tableCount: parseInt(tableCount.rows[0].count),
      userCount,
      createdAt,
      keyTables: keyTables.rows.map(row => row.table_name)
    });

  } catch (error) {
    console.error('Error getting schema details:', error);
    
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

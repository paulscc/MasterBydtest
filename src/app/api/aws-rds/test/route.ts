import { NextResponse } from 'next/server';
import { rdsService } from '@/lib/aws-rds';

export async function GET() {
  try {
    const isConnected = await rdsService.testConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected 
        ? 'AWS RDS connection successful' 
        : 'AWS RDS connection failed',
      config: {
        host: process.env.AWS_RDS_HOST ? 'configured' : 'missing',
        port: process.env.AWS_RDS_PORT || '5432',
        database: process.env.AWS_RDS_DATABASE ? 'configured' : 'missing',
        user: process.env.AWS_RDS_USER ? 'configured' : 'missing',
        password: process.env.AWS_RDS_PASSWORD ? 'configured' : 'missing'
      }
    });
  } catch (error) {
    console.error('AWS RDS test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing AWS RDS connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

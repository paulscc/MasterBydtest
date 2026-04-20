import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Leer package.json para obtener la versión
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Obtener fecha de build (puedes personalizar esto según tu CI/CD)
    const buildDate = process.env.BUILD_DATE || new Date().toISOString().split('T')[0];
    
    // Obtener entorno
    const environment = process.env.NODE_ENV || 'development';
    
    // Obtener información adicional del git si está disponible
    let gitCommit = 'unknown';
    try {
      const { execSync } = require('child_process');
      gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      // Git no disponible o no es un repositorio git
    }

    const versionInfo = {
      version: packageJson.version || '1.0.0',
      buildDate,
      environment,
      gitCommit,
      name: packageJson.name || 'LicenseMaster',
      description: packageJson.description || 'Master system for managing licenses and tenants'
    };

    return NextResponse.json(versionInfo);
  } catch (error) {
    // Si hay error, devolver información por defecto
    return NextResponse.json({
      version: '1.0.0',
      buildDate: new Date().toISOString().split('T')[0],
      environment: process.env.NODE_ENV || 'development',
      gitCommit: 'unknown',
      name: 'LicenseMaster',
      description: 'Master system for managing licenses and tenants'
    });
  }
}

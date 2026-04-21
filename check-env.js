// Script para verificar las variables de entorno configuradas
require('dotenv').config({ path: '.env.local' });

console.log('=== Verificación de Variables de Entorno ===');
console.log('Variables configuradas en .env.local:');

// Listar todas las variables de entorno que comienzan con ciertos prefijos
const prefixes = ['NEXT_PUBLIC_', 'AWS_', 'SUPABASE_', 'DATABASE_', 'NODE_ENV'];

prefixes.forEach(prefix => {
  const vars = Object.keys(process.env)
    .filter(key => key.startsWith(prefix))
    .sort();
  
  if (vars.length > 0) {
    console.log(`\n${prefix}:`);
    vars.forEach(key => {
      const value = process.env[key];
      if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')) {
        console.log(`  ${key}: ${value ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
      } else {
        console.log(`  ${key}: ${value || 'NO CONFIGURADO'}`);
      }
    });
  }
});

// Verificar variables específicas para AWS RDS
console.log('\n=== Estado de Configuración AWS RDS ===');
const awsVars = {
  'AWS_RDS_HOST': process.env.AWS_RDS_HOST,
  'AWS_RDS_PORT': process.env.AWS_RDS_PORT,
  'AWS_RDS_DATABASE': process.env.AWS_RDS_DATABASE,
  'AWS_RDS_USER': process.env.AWS_RDS_USER,
  'AWS_RDS_PASSWORD': process.env.AWS_RDS_PASSWORD,
  'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
  'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
  'AWS_REGION': process.env.AWS_REGION
};

let awsConfigured = true;
Object.entries(awsVars).forEach(([key, value]) => {
  const status = value ? 'CONFIGURADO' : 'NO CONFIGURADO';
  console.log(`${key}: ${status}`);
  if (!value && !key.includes('AWS_ACCESS_KEY_ID') && !key.includes('AWS_SECRET_ACCESS_KEY') && !key.includes('AWS_REGION')) {
    awsConfigured = false;
  }
});

console.log(`\nEstado AWS RDS: ${awsConfigured ? 'COMPLETAMENTE CONFIGURADO' : 'INCOMPLETO'}`);

// Verificar variables de Supabase
console.log('\n=== Estado de Configuración Supabase ===');
const supabaseVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

let supabaseConfigured = true;
Object.entries(supabaseVars).forEach(([key, value]) => {
  const status = value ? 'CONFIGURADO' : 'NO CONFIGURADO';
  console.log(`${key}: ${status}`);
  if (!value) {
    supabaseConfigured = false;
  }
});

console.log(`\nEstado Supabase: ${supabaseConfigured ? 'COMPLETAMENTE CONFIGURADO' : 'INCOMPLETO'}`);

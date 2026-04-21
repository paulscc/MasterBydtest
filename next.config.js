/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para optimizar el build
  serverExternalPackages: ['pg'],
  
  // Configuración de Turbopack para evitar problemas de memoria
  turbopack: {
    // Configuración vacía para silenciar advertencias
  },
  
  // Configuración de output
  output: 'standalone',
};

module.exports = nextConfig;

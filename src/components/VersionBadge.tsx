'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

interface VersionInfo {
  version: string;
  buildDate: string;
  environment: string;
}

export default function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    version: '1.0.0',
    buildDate: new Date().toISOString().split('T')[0],
    environment: process.env.NODE_ENV || 'development'
  });

  useEffect(() => {
    // Obtener información del package.json
    const getVersionInfo = async () => {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        }
      } catch (error) {
        // Usar valores por defecto si el endpoint no existe
        console.log('Using default version info');
      }
    };

    getVersionInfo();
  }, []);

  return (
    <div className="version-badge">
      <button 
        className="icon-btn version-btn"
        title={`Versión ${versionInfo.version} - ${versionInfo.environment}`}
        onClick={() => {
          alert(`
Sistema Maestro de Licencias
Versión: ${versionInfo.version}
Entorno: ${versionInfo.environment}
Build: ${versionInfo.buildDate}
          `.trim());
        }}
      >
        <Info size={16} />
        <span className="version-text">v{versionInfo.version}</span>
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { LogIn, LogOut, Shield, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { backendAuthService, AdminCredentials } from '@/lib/auth-backend';

export default function BackendLogin() {
  const [credentials, setCredentials] = useState<AdminCredentials>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Restaurar sesión al montar el componente
    const restored = backendAuthService.restoreSession();
    setIsAuthenticated(restored);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await backendAuthService.login(credentials);
      
      if (result.success) {
        setIsAuthenticated(true);
        setCredentials({ email: '', password: '' });
      } else {
        setError(result.error || 'Error en el login');
      }
    } catch (error) {
      setError('Error de conexión con el backend');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    backendAuthService.logout();
    setIsAuthenticated(false);
    setError(null);
  };

  const user = backendAuthService.getUser();
  const timeRemaining = backendAuthService.getTimeRemainingFormatted();

  if (isAuthenticated) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        border: '1px solid #22c55e',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} style={{ color: '#22c55e' }} />
            <h4 style={{ margin: 0, color: '#22c55e', fontSize: '1rem' }}>
              Autenticado en Backend Externo
            </h4>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
        
        <div style={{ fontSize: '0.875rem', color: '#16a34a', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>Usuario: <strong>{user?.email}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} />
            Tiempo restante: <strong>{timeRemaining}</strong>
          </div>
          <div>Backend: <strong>https://d2o45auo4j2cpf.cloudfront.net</strong></div>
        </div>

        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#15803d' }}>
          Ahora puedes usar los endpoints de creación de esquemas y visualización con autenticación.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <AlertCircle size={20} style={{ color: '#ef4444' }} />
        <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1rem' }}>
          No Autenticado en Backend Externo
        </h4>
      </div>

      <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#991b1b' }}>
        Para usar los endpoints de creación de esquemas y visualización del backend externo, 
        necesitas iniciar sesión como administrador.
      </p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="Email de administrador"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            required
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#9ca3af' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                Conectando...
              </>
            ) : (
              <>
                <LogIn size={16} /> Iniciar Sesión
              </>
            )}
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.5rem',
            backgroundColor: '#fecaca',
            border: '1px solid #f87171',
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}
      </form>

      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#7f1d1d' }}>
        <div>Backend: <strong>https://d2o45auo4j2cpf.cloudfront.net</strong></div>
        <div>Credenciales por defecto: admin@company.com / password123</div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

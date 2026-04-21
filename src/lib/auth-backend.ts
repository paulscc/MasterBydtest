// Sistema de autenticación para el backend externo

const EXTERNAL_API_BASE = 'https://d2o45auo4j2cpf.cloudfront.net';

interface AdminCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  message?: string;
  expiresAt?: string;
}

class BackendAuthService {
  private static instance: BackendAuthService;
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private user: { email: string } | null = null;

  private constructor() {}

  static getInstance(): BackendAuthService {
    if (!BackendAuthService.instance) {
      BackendAuthService.instance = new BackendAuthService();
    }
    return BackendAuthService.instance;
  }

  // Login al backend externo
  async login(credentials: AdminCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/api/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.token = data.token;
        // El token expira en 1 hora por defecto
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
        this.user = { email: credentials.email };
        
        // Guardar en localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('backend_token', this.token!);
          localStorage.setItem('backend_token_expiry', this.tokenExpiry!.toString());
          localStorage.setItem('backend_user', JSON.stringify(this.user!));
        }

        console.log('Login exitoso al backend externo');
        return {
          success: true,
          token: this.token!,
          expiresAt: new Date(this.tokenExpiry!).toISOString()
        };
      }

      return {
        success: false,
        error: data.error || 'Login failed',
        message: data.message
      };

    } catch (error) {
      console.error('Error en login de backend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  }

  // Logout
  logout(): void {
    this.token = null;
    this.tokenExpiry = null;
    this.user = null;

    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('backend_token');
      localStorage.removeItem('backend_token_expiry');
      localStorage.removeItem('backend_user');
    }

    console.log('Sesión de backend cerrada');
  }

  // Verificar si el token es válido
  isAuthenticated(): boolean {
    return this.token !== null && 
           this.tokenExpiry !== null && 
           Date.now() < this.tokenExpiry;
  }

  // Obtener token válido
  getToken(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.token;
  }

  // Obtener información del usuario
  getUser(): { email: string } | null {
    return this.user;
  }

  // Tiempo restante del token en segundos
  getTimeRemaining(): number {
    if (!this.tokenExpiry) return 0;
    return Math.max(0, Math.floor((this.tokenExpiry - Date.now()) / 1000));
  }

  // Formatear tiempo restante
  getTimeRemainingFormatted(): string {
    const seconds = this.getTimeRemaining();
    if (seconds === 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Restaurar sesión desde localStorage
  restoreSession(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const token = localStorage.getItem('backend_token');
      const expiry = localStorage.getItem('backend_token_expiry');
      const userStr = localStorage.getItem('backend_user');

      if (token && expiry && userStr) {
        const expiryTime = parseInt(expiry);
        if (Date.now() < expiryTime) {
          this.token = token;
          this.tokenExpiry = expiryTime;
          this.user = JSON.parse(userStr);
          console.log('Sesión de backend restaurada');
          return true;
        } else {
          // Token expirado, limpiar
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error restaurando sesión:', error);
      this.logout();
    }

    return false;
  }

  // Obtener headers de autorización
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No autenticado');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

// Exportar singleton
export const backendAuthService = BackendAuthService.getInstance();

// Exportar tipos
export type { AdminCredentials, LoginResponse };

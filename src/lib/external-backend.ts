// Cliente para el backend externo de creación de esquemas

const EXTERNAL_API_BASE = 'https://d2o45auo4j2cpf.cloudfront.net';

interface AdminCredentials {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  message?: string;
}

interface CreateSchemaRequest {
  schemaName: string;
  tenantInfo: {
    clientId: string;
    clientName: string;
    databaseUrl: string;
    initialUser?: {
      userId: string;
      name: string;
      phone?: string;
      avatarUrl?: string;
    };
  };
}

interface CreateSchemaResponse {
  success: boolean;
  data?: {
    schemaName: string;
    tenantInfo: {
      clientId: string;
      clientName: string;
      schemaName: string;
      isActive: boolean;
    };
  };
  message?: string;
  meta?: {
    timestamp: string;
    tablesCreated: number;
  };
  error?: string;
}

class ExternalBackendService {
  private adminToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Login como administrador
  async adminLogin(credentials: AdminCredentials): Promise<AdminLoginResponse> {
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
        this.adminToken = data.token;
        // Token expira en 1 hora por defecto
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
        console.log('Login exitoso como administrador');
      }

      return data;
    } catch (error) {
      console.error('Error en login de administrador:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Verificar si el token es válido
  private isTokenValid(): boolean {
    return this.adminToken !== null && 
           this.tokenExpiry !== null && 
           Date.now() < this.tokenExpiry;
  }

  // Obtener token válido (login automático si es necesario)
  private async getValidToken(): Promise<string | null> {
    if (!this.isTokenValid()) {
      // Intentar login automático con credenciales por defecto
      const defaultCredentials = {
        email: process.env.ADMIN_EMAIL || 'admin@company.com',
        password: process.env.ADMIN_PASSWORD || 'password123'
      };

      const loginResult = await this.adminLogin(defaultCredentials);
      return loginResult.token || null;
    }

    return this.adminToken;
  }

  // Crear esquema en el backend externo con fallback a local
  async createSchema(request: CreateSchemaRequest): Promise<CreateSchemaResponse> {
    try {
      // Intentar primero con backend externo
      const token = await this.getValidToken();
      
      if (token) {
        try {
          const response = await fetch(`${EXTERNAL_API_BASE}/api/admin/create-schema`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(request),
          });

          const data = await response.json();

          if (data.success) {
            console.log(`Esquema ${request.schemaName} creado exitosamente en backend externo`);
            return data;
          } else {
            console.log(`Backend externo falló: ${data.error}, intentando fallback local`);
          }
        } catch (externalError) {
          console.log(`Error en backend externo: ${externalError}, intentando fallback local`);
        }
      } else {
        console.log('No se pudo obtener token de backend externo, usando fallback local');
      }

      // Fallback a backend local
      return await this.createSchemaLocal(request);
      
    } catch (error) {
      console.error('Error en createSchema:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Crear esquema local (fallback)
  private async createSchemaLocal(request: CreateSchemaRequest): Promise<CreateSchemaResponse> {
    try {
      console.log(`Creando esquema ${request.schemaName} localmente (fallback)`);
      
      const localResponse = await fetch('http://localhost:3001/api/admin/create-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await localResponse.json();

      if (data.success) {
        console.log(`Esquema ${request.schemaName} creado exitosamente en backend local (fallback)`);
        return {
          success: true,
          data: {
            schemaName: data.schemaName,
            tenantInfo: {
              clientId: request.tenantInfo.clientId,
              clientName: request.tenantInfo.clientName,
              schemaName: data.schemaName,
              isActive: true
            }
          },
          message: 'Schema created successfully (local fallback)',
          meta: {
            timestamp: new Date().toISOString(),
            tablesCreated: data.tablesCreated || 0
          }
        };
      } else {
        return {
          success: false,
          error: `Error en backend local: ${data.error}`
        };
      }
    } catch (error) {
      console.error('Error en backend local:', error);
      return {
        success: false,
        error: `Error en backend local: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  // Listar esquemas (si el endpoint está disponible)
  async listSchemas(): Promise<{ success: boolean; schemas?: string[]; error?: string }> {
    try {
      const token = await this.getValidToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No se pudo obtener token de autenticación'
        };
      }

      const response = await fetch(`${EXTERNAL_API_BASE}/api/admin/create-schema`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listando esquemas en backend externo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Logout
  logout(): void {
    this.adminToken = null;
    this.tokenExpiry = null;
    console.log('Sesión de administrador cerrada');
  }
}

// Exportar singleton
export const externalBackendService = new ExternalBackendService();

// Exportar tipos
export type { AdminCredentials, CreateSchemaRequest, CreateSchemaResponse };

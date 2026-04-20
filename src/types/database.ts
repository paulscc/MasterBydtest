// Tipos para la base de datos del sistema maestro multi-tenant

export interface MasterClient {
  id: string; // UUID
  business_name: string;
  subdomain: string;
  schema_name: string; // IMPORTANTE para Lambda
  db_connection_url?: string | null;
  is_active: boolean;
  created_at: string; // TIMESTAMPTZ
}

export interface MasterUser {
  id: string; // UUID
  email: string;
  password_hash: string;
  client_id: string; // UUID - Relación con MasterClient
  is_active: boolean;
  created_at: string; // TIMESTAMPTZ
}

export interface License {
  id: string; // UUID
  client_id: string; // UUID - Relación con MasterClient
  api_key: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  modules: string[]; // JSONB
  max_users: number;
  expires_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Mantener compatibilidad con código existente (alias)
export interface Client extends MasterClient {}
export interface User extends MasterUser {}

// Tipos para formularios
export interface MasterClientFormData {
  business_name: string;
  subdomain: string;
  schema_name: string;
  db_connection_url?: string;
  is_active: boolean;
}

// Mantener compatibilidad con código existente (alias)
export interface ClientFormData extends MasterClientFormData {
  name?: string; // Para compatibilidad, mapear a business_name
  slug?: string; // Para compatibilidad, mapear a subdomain
}

export interface LicenseFormData {
  client_id: string;
  api_key: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  modules: string[];
  max_users: number;
  expires_at: string;
}

export interface MasterUserFormData {
  client_id: string;
  email: string;
  password?: string;
  is_active: boolean;
}

// Mantener compatibilidad con código existente (alias)
export interface UserFormData extends MasterUserFormData {
  full_name?: string; // Para compatibilidad, aunque no existe en master_users
  role?: 'admin' | 'manager' | 'staff'; // Para compatibilidad, aunque no existe en master_users
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

// Tipos para módulos del sistema
export type SystemModule = 'inventory' | 'slabs' | 'bids' | 'reports' | 'users' | 'settings';

-- ==========================================================
-- MIGRACIÓN PARA SISTEMA MAESTRO MULTI-TENANT COMPLETO
-- ==========================================================
-- Ejecutar este script en Supabase SQL Editor para actualizar la BD

-- 1. EXTENSIONES (Asegura que podamos generar UUIDs aleatorios)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. TABLA DE CLIENTES MAESTROS (TENANTS)
CREATE TABLE IF NOT EXISTS public.master_clients (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_name character varying NOT NULL,
    subdomain character varying NOT NULL UNIQUE,
    db_connection_url text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT master_clients_pkey PRIMARY KEY (id)
);

-- 3. TABLA DE MÓDULOS MAESTROS
CREATE TABLE IF NOT EXISTS public.master_modules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key_name character varying NOT NULL UNIQUE,
    display_name character varying NOT NULL,
    description text,
    min_software_version character varying DEFAULT '1.0.0'::character varying,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT master_modules_pkey PRIMARY KEY (id)
);

-- 4. TABLA DE RELACIÓN CLIENTE-MÓDULOS
CREATE TABLE IF NOT EXISTS public.master_client_modules (
    client_id uuid NOT NULL,
    module_id uuid NOT NULL,
    activated_at timestamp with time zone DEFAULT now(),
    is_trial boolean DEFAULT false,
    CONSTRAINT master_client_modules_pkey PRIMARY KEY (client_id, module_id),
    CONSTRAINT master_client_modules_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.master_clients(id),
    CONSTRAINT master_client_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.master_modules(id)
);

-- 5. TABLA DE RELEASES DE SOFTWARE
CREATE TABLE IF NOT EXISTS public.master_software_releases (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    version_number character varying NOT NULL,
    release_date timestamp with time zone DEFAULT now(),
    download_url text NOT NULL,
    is_critical boolean DEFAULT false,
    changelog text,
    is_public boolean DEFAULT true,
    CONSTRAINT master_software_releases_pkey PRIMARY KEY (id)
);

-- 6. TABLA DE USUARIOS MAESTROS (Centraliza el Login)
CREATE TABLE IF NOT EXISTS public.master_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email character varying NOT NULL UNIQUE,
    password_hash text NOT NULL,
    client_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT master_users_pkey PRIMARY KEY (id),
    CONSTRAINT fk_master_client FOREIGN KEY (client_id) REFERENCES public.master_clients(id)
);

-- 7. TABLA DE LOGS DE SINCRONIZACIÓN
CREATE TABLE IF NOT EXISTS public.master_sync_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid,
    sync_type character varying,
    status character varying,
    error_message text,
    finished_at timestamp with time zone DEFAULT now(),
    CONSTRAINT master_sync_logs_pkey PRIMARY KEY (id),
    CONSTRAINT master_sync_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.master_clients(id)
);

-- 8. TABLA DE LICENCIAS (Mantiene compatibilidad con código existente)
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID UNIQUE REFERENCES public.master_clients(id) ON DELETE CASCADE,
    api_key TEXT UNIQUE NOT NULL,               -- Clave única para el backend del cliente
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED')),
    modules JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ej: ["inventory", "slabs", "bids"]
    max_users INTEGER DEFAULT 5,                -- Límite de empleados que pueden crear
    expires_at TIMESTAMPTZ NOT NULL,            -- Fecha de vencimiento
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ÍNDICES (Para que el sistema sea rápido al buscar datos)
CREATE INDEX IF NOT EXISTS idx_licenses_api_key ON public.licenses(api_key);
CREATE INDEX IF NOT EXISTS idx_master_users_email ON public.master_users(email);
CREATE INDEX IF NOT EXISTS idx_master_clients_subdomain ON public.master_clients(subdomain);
CREATE INDEX IF NOT EXISTS idx_master_users_client_id ON public.master_users(client_id);
CREATE INDEX IF NOT EXISTS idx_master_modules_key_name ON public.master_modules(key_name);
CREATE INDEX IF NOT EXISTS idx_master_client_modules_client_id ON public.master_client_modules(client_id);
CREATE INDEX IF NOT EXISTS idx_master_client_modules_module_id ON public.master_client_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_master_sync_logs_client_id ON public.master_sync_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_master_sync_logs_status ON public.master_sync_logs(status);

-- 7. AUTOMATIZACIÓN DE 'UPDATED_AT'
-- Función que actualiza la fecha automáticamente cuando editas una licencia.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger existente si hay uno para evitar errores
DROP TRIGGER IF EXISTS update_license_modtime ON public.licenses;

-- Crear trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_license_modtime
    BEFORE UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 8. MIGRACIÓN DE DATOS (Si hay datos existentes)
-- Este bloque migra datos de tablas antiguas si existen
DO $$
BEGIN
    -- Migrar clients si existe tabla antigua
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
        INSERT INTO public.master_clients (business_name, subdomain, schema_name, db_connection_url, is_active)
        SELECT 
            name,
            slug,
            'tenant_' || REPLACE(slug, '-', '_'),
            db_connection_string,
            is_active
        FROM public.clients;
    END IF;

    -- Migrar users si existe tabla antigua
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        INSERT INTO public.master_users (email, password_hash, client_id, is_active)
        SELECT 
            u.email,
            u.password_hash,
            mc.id,
            u.is_active
        FROM public.users u
        JOIN public.clients c ON u.client_id = c.id
        JOIN public.master_clients mc ON mc.business_name = c.name;
    END IF;
END $$;

-- 9. POLÍTICAS DE SEGURIDAD (RLS) - Opcional, descomentar si se necesita
/*
-- Habilitar RLS en todas las tablas
ALTER TABLE public.master_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Políticas para master_clients
CREATE POLICY "Master clients are viewable by authenticated users" ON public.master_clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para master_users
CREATE POLICY "Master users can view their own profile" ON public.master_users
    FOR SELECT USING (auth.uid() = id);

-- Políticas para licenses
CREATE POLICY "Licenses are viewable by authenticated users" ON public.licenses
    FOR SELECT USING (auth.role() = 'authenticated');
*/

-- 10. VERIFICACIÓN
-- Consultas para verificar que todo se creó correctamente
SELECT 'master_clients' as table_name, count(*) as row_count FROM public.master_clients
UNION ALL
SELECT 'master_users' as table_name, count(*) as row_count FROM public.master_users
UNION ALL
SELECT 'licenses' as table_name, count(*) as row_count FROM public.licenses;

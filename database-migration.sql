-- ==========================================================
-- MIGRACIÓN PARA SISTEMA MAESTRO MULTI-TENANT
-- ==========================================================
-- Ejecutar este script en Supabase SQL Editor para actualizar la BD

-- 1. EXTENSIONES (Asegura que podamos generar UUIDs aleatorios)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- 1. Intentamos activar la extensión por si acaso (opcional en versiones nuevas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE CLIENTES MAESTROS (TENANTS)
CREATE TABLE IF NOT EXISTS public.master_clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name character varying(255) NOT NULL,
    subdomain character varying(100) UNIQUE NOT NULL,
    schema_name character varying(63) UNIQUE NOT NULL, -- IMPORTANTE para tu Lambda
    db_connection_url text, -- Por si en el futuro escalas a otra instancia
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. TABLA DE USUARIOS MAESTROS (Centraliza el Login)
-- Usamos gen_random_uuid() que es nativo de Postgres 13+
CREATE TABLE IF NOT EXISTS public.master_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying(255) UNIQUE NOT NULL,
    password_hash text NOT NULL,
    client_id uuid NOT NULL, -- Relación con master_clients
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Agregar la llave foránea (después de crear ambas tablas)
ALTER TABLE public.master_users 
ADD CONSTRAINT IF NOT EXISTS fk_master_client 
FOREIGN KEY (client_id) REFERENCES public.master_clients(id) ON DELETE CASCADE;

-- 5. TABLA DE LICENCIAS (Mantiene compatibilidad con código existente)
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

-- 6. ÍNDICES (Para que el sistema sea rápido al buscar licencias o correos)
CREATE INDEX IF NOT EXISTS idx_licenses_api_key ON public.licenses(api_key);
CREATE INDEX IF NOT EXISTS idx_master_users_email ON public.master_users(email);
CREATE INDEX IF NOT EXISTS idx_master_clients_subdomain ON public.master_clients(subdomain);
CREATE INDEX IF NOT EXISTS idx_master_users_client_id ON public.master_users(client_id);

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

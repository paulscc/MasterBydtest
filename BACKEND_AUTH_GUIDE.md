# Guía del Sistema de Autenticación del Backend

## Overview

El sistema ahora incluye un módulo completo de autenticación para el backend externo `https://d2o45auo4j2cpf.cloudfront.net`, permitiendo acceso seguro a los endpoints de creación y visualización de esquemas.

## Componentes del Sistema

### 1. BackendAuthService (`src/lib/auth-backend.ts`)
- **Función:** Gestión centralizada de autenticación
- **Características:**
  - Login y logout al backend externo
  - Gestión automática de tokens (expiran en 1 hora)
  - Persistencia en localStorage
  - Restauración automática de sesión
  - Verificación de validez de tokens

### 2. BackendLogin Component (`src/components/BackendLogin.tsx`)
- **Función:** Interfaz de usuario para autenticación
- **Características:**
  - Formulario de login elegante
  - Indicadores de estado (autenticado/no autenticado)
  - Tiempo restante del token
  - Manejo de errores
  - Botón de logout

### 3. Página de Administración (`src/app/admin/page.tsx`)
- **Función:** Panel de control del backend externo
- **Características:**
  - Estado de autenticación
  - Listado de esquemas del backend externo
  - Estadísticas de esquemas
  - Integración con BackendLogin

## Flujo de Autenticación

### 1. Login
```typescript
const credentials = {
  email: 'admin@company.com',
  password: 'password123'
};

const result = await backendAuthService.login(credentials);
```

### 2. Verificación
```typescript
if (backendAuthService.isAuthenticated()) {
  const token = backendAuthService.getToken();
  const user = backendAuthService.getUser();
  const timeRemaining = backendAuthService.getTimeRemainingFormatted();
}
```

### 3. Uso en Endpoints
```typescript
const headers = backendAuthService.getAuthHeaders();
const response = await fetch('https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema', {
  method: 'GET',
  headers
});
```

## Integración en la UI

### 1. Formulario de Clientes
- El componente `BackendLogin` está integrado en el modal de creación de clientes
- Los usuarios deben autenticarse antes de crear clientes con el backend externo
- El estado de autenticación se muestra claramente

### 2. Sidebar
- Nuevo enlace "Admin" con ícono de escudo (`Shield`)
- Acceso directo a la página de administración del backend

### 3. Dashboard
- Muestra información del sistema híbrido
- Indica estado del backend externo

## Endpoints Protegidos

### 1. Creación de Esquemas
```
POST https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema
Authorization: Bearer <token>
```

### 2. Listado de Esquemas
```
GET https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema
Authorization: Bearer <token>
```

## Comportamiento del Sistema

### Con Autenticación Exitosa
- Los esquemas se crean en el backend externo
- Acceso completo a todos los endpoints protegidos
- Token válido por 1 hora
- Sesión persistente en localStorage

### Sin Autenticación
- Fallback automático al backend local
- Los esquemas se crean localmente
- Funcionalidad completa garantizada

### Token Expirado
- Logout automático
- Requiere nuevo login
- Limpieza de localStorage

## Configuración Requerida

### Variables de Entorno
```env
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=password123
```

### Credenciales por Defecto
- **Email:** admin@company.com
- **Password:** password123

## Uso Práctico

### 1. Para Administradores
1. Ir a `/admin`
2. Iniciar sesión con credenciales de administrador
3. Ver esquemas del backend externo
4. Gestionar autenticación

### 2. Para Creación de Clientes
1. Ir a `/clients`
2. Hacer clic en "Add Client"
3. Autenticarse en el formulario (si es necesario)
4. Crear cliente (usará backend externo si está autenticado)

### 3. Para Visualización
1. Ir a `/schemas`
2. Ver esquemas locales y externos
3. Monitorear estado del sistema

## Seguridad

### Token Management
- Tokens JWT con expiración de 1 hora
- Almacenamiento seguro en localStorage
- Limpieza automática al expirar

### Endpoint Protection
- Todos los endpoints del backend externo requieren token
- Validación automática de Authorization header
- Respuesta 401 para tokens inválidos

### Session Management
- Restauración automática al recargar página
- Logout manual disponible
- Sesión persistente entre navegaciones

## Troubleshooting

### Problemas Comunes

#### 1. Login Fallido
- **Causa:** Credenciales incorrectas o backend no disponible
- **Solución:** Verificar credenciales y conexión a internet

#### 2. Token Expirado
- **Causa:** Token de 1 hora expirado
- **Solución:** Hacer logout y login nuevamente

#### 3. Acceso Denegado
- **Causa:** Sin autenticación o token inválido
- **Solución:** Iniciar sesión en `/admin` o formulario de clientes

#### 4. Backend No Disponible
- **Causa:** Problemas de conexión con backend externo
- **Solución:** Sistema usa fallback local automáticamente

### Logs y Depuración

El sistema incluye logging automático:
- Login exitoso/fracasado
- Creación de esquemas (externo vs local)
- Errores de autenticación
- Expiración de tokens

## Pruebas del Sistema

### Script de Pruebas
```bash
node test-backend-auth.js
```

### Pruebas Manuales
1. Login en `/admin`
2. Crear cliente en `/clients`
3. Ver esquemas en `/schemas`
4. Probar logout y login

## Resumen

El sistema de autenticación proporciona:
- **Seguridad:** Acceso protegido al backend externo
- **Flexibilidad:** Fallback automático al backend local
- **Transparencia:** Estado claro de autenticación
- **Persistencia:** Sesiones mantenidas entre navegaciones
- **Usabilidad:** Integración fluida en la UI existente

El sistema garantiza que siempre puedas crear y gestionar esquemas, ya sea con el backend externo autenticado o con el fallback local.

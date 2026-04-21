# Guía de Login al Backend Externo

## ¿Cómo Ingresar al Backend Externo?

### Opción 1: Página de Administración (Recomendada)

1. **Visita:** `http://localhost:3001/admin`
2. **Verás:** La interfaz de login mejorada con credenciales predefinidas
3. **Botón "Usar Credenciales Correctas":** Haz clic para autocompletar
4. **Botón "Iniciar Sesión":** Haz clic para conectar

### Opción 2: Formulario de Creación de Clientes

1. **Visita:** `http://localhost:3001/clients`
2. **Haz clic en:** "Add Client"
3. **Verás:** El componente de login integrado
4. **Usa:** El botón de acceso rápido o ingresa manualmente

## Credenciales Correctas

```
Email: admin@company.com
Password: password
```

## Características de la UI

### QuickBackendLogin (Nuevo Componente)

#### Botón de Acceso Rápido
- **Texto:** "Usar Credenciales Correctas"
- **Función:** Autocompleta los campos con las credenciales correctas
- **Icono:** Llave (Key) para fácil identificación

#### Indicadores Visuales
- **Estado no autenticado:** Fondo rojo con mensaje de alerta
- **Estado autenticado:** Fondo verde con información del usuario
- **Tiempo restante:** Muestra cuánto tiempo queda el token (24 horas)

#### Información Contextual
- **Backend URL:** Muestra la URL del backend externo
- **Estado:** Indica si el backend está operativo
- **Instrucciones:** Guía paso a paso para el usuario

### Ubicación en la Aplicación

#### 1. Página de Administración (/admin)
- **Componente:** QuickBackendLogin
- **Contexto:** Panel principal de administración
- **Funciones:** Login, gestión de esquemas, monitoreo

#### 2. Formulario de Clientes (/clients)
- **Componente:** QuickBackendLogin (integrado)
- **Contexto:** Modal de creación de clientes
- **Funciones:** Login previo a la creación de clientes

## Flujo de Usuario

### Paso 1: Acceder a la UI
1. Navega a `/admin` o `/clients` y haz clic en "Add Client"
2. Verás el componente QuickBackendLogin

### Paso 2: Login Rápido
1. Haz clic en **"Usar Credenciales Correctas"**
2. Los campos se autocompletarán con:
   - Email: `admin@company.com`
   - Password: `password`

### Paso 3: Conectar
1. Haz clic en **"Iniciar Sesión"**
2. El sistema se conectará al backend externo
3. Verás el estado cambiar a "Autenticado"

### Paso 4: Confirmación
1. **Estado verde:** Confirmación de autenticación
2. **Información del usuario:** Email y tiempo restante
3. **Backend URL:** Confirmación de conexión

## Características Técnicas

### Gestión de Tokens
- **JWT Token:** Válido por 24 horas
- **Persistencia:** Guardado en localStorage
- **Restauración:** Automática al recargar la página
- **Expiración:** Logout automático al expirar

### Sistema Híbrido
- **Backend Externo:** Usado preferentemente cuando está autenticado
- **Backend Local:** Fallback automático si externo falla
- **Transparencia:** El usuario no nota el cambio

### Seguridad
- **HTTPS:** Conexión segura al backend externo
- **Token Validation:** Verificación automática de validez
- **Logout Manual:** Botón para cerrar sesión cuando se desee

## Problemas Comunes y Soluciones

### Problema: Login fallido
- **Causa:** Credenciales incorrectas
- **Solución:** Usa el botón "Usar Credenciales Correctas"

### Problema: Token expirado
- **Causa:** Pasaron 24 horas desde el último login
- **Solución:** Haz login nuevamente

### Problema: Backend no disponible
- **Causa:** El backend externo está caído
- **Solución:** El sistema usa automáticamente el backend local

### Problema: No veo el botón de acceso rápido
- **Causa:** Estás usando el componente antiguo
- **Solución:** Refresca la página para cargar el nuevo componente

## Resumen

### Para Conectar al Backend Externo:

1. **Ve a:** `/admin` o crea un cliente en `/clients`
2. **Haz clic en:** "Usar Credenciales Correctas"
3. **Haz clic en:** "Iniciar Sesión"
4. **¡Listo!** Estás conectado al backend externo

### No necesitas:
- Recordar las credenciales
- Digitar manualmente
- Configurar nada adicional

### El sistema:
- Autocompleta las credenciales correctas
- Muestra el estado de autenticación
- Gestiona los tokens automáticamente
- Usa fallback si el backend externo falla

**¡El acceso al backend externo ahora es más fácil que nunca!**

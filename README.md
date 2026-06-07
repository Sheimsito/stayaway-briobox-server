# 🏗️ Arquitectura del Proyecto — Brio Box API

Este documento describe la arquitectura, patrones de diseño y decisiones técnicas del backend de Brio Box API.

---

## 📐 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Arquitectura en Capas](#-arquitectura-en-capas)
3. [Flujo de Datos](#-flujo-de-datos)
4. [Patrones de Diseño](#-patrones-de-diseño)
5. [Estructura de Carpetas](#-estructura-de-carpetas)
6. [Base de Datos](#-base-de-datos)
7. [Decisiones Técnicas](#-decisiones-técnicas)
8. [Seguridad](#-seguridad)

---

## 🎯 Visión General

Brio Box API es una API RESTful construida con **arquitectura en capas** que separa las responsabilidades en diferentes niveles, facilitando el mantenimiento, testing y escalabilidad.

### Principios Arquitectónicos

- ✅ **Separation of Concerns (SoC):** Cada capa tiene una responsabilidad específica
- ✅ **Single Responsibility Principle (SRP):** Cada clase/módulo tiene un propósito único
- ✅ **Dependency Injection:** Las dependencias se inyectan, no se instancian
- ✅ **DRY (Don't Repeat Yourself):** Código reutilizable mediante abstracciones
- ✅ **Type Safety:** TypeScript garantiza tipos en tiempo de compilación

---

## 🧱 Arquitectura en Capas

```
┌─────────────────────────────────────────────┐
│           CLIENT (Frontend/Mobile)           │
└─────────────────────────────────────────────┘
                     ↕ HTTPS
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER (Express)         │
│  ┌──────────────────────────────────────┐   │
│  │   Routes → Controllers → Middleware   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     ↕
┌─────────────────────────────────────────────┐
│              SERVICES LAYER                  │
│  ┌──────────────────────────────────────┐   │
│  │  External Services Integration       │   │
│  │  • Email (Resend)                    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     ↕
┌─────────────────────────────────────────────┐
│          DATA ACCESS LAYER (DAO)             │
│  ┌──────────────────────────────────────┐   │
│  │    BaseDAO → SpecificDAO → Supabase  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     ↕
┌─────────────────────────────────────────────┐
│            DATABASE (Supabase)               │
└─────────────────────────────────────────────┘
```

### Descripción de Capas

#### 1. Presentation Layer (Capa de Presentación)

**Responsabilidad:** Manejar las peticiones HTTP y respuestas.

**Componentes:**
- **Routes:** Definen los endpoints de la API
- **Controllers:** Procesan las peticiones y delegan la lógica — Auth, User controllers
- **Middleware:** Interceptan peticiones (autenticación, validación, manejo de errores)

**Ubicación:** `src/routes/`, `src/controllers/`, `src/middleware/`

#### 2. Business Logic & Services Layer (Capa de Servicios & Tareas)

**Responsabilidad:** Integrar servicios externos y orquestar tareas programadas o lógica compleja de negocio.

**Componentes:**
- **Email Service (Resend):** Envío de emails transaccionales (recuperación de contraseña, notificaciones de membresía, cumpleaños).
- **Cron Jobs (Node-Cron):** Automatización diaria de recordatorios de pago e email de cumpleaños.

**Ubicación:** `src/service/`, `src/jobs/`

#### 3. Data Access Layer (Capa de Acceso a Datos)

**Responsabilidad:** Abstraer las operaciones de base de datos.

**Componentes:**
- **DAOs (Data Access Objects):** Encapsulan consultas a la base de datos
- **BaseDAO:** Clase genérica con operaciones CRUD comunes
- **UserDAO:** Operaciones específicas de usuarios (`findByEmail`, `updateResetPasswordJti`)

**Ubicación:** `src/dao/`

#### 4. Database Layer (Capa de Base de Datos)

**Responsabilidad:** Almacenar y gestionar datos persistentes.

**Tecnología:** Supabase (PostgreSQL)

---

## 🔄 Flujo de Datos

### Ejemplo 1: Registro de Usuario

```
1. CLIENT
   └─> POST /api/auth/register
       Body: { name, lastName, age, email, password }
       ↓
2. ROUTE (routes/index.ts → authRoutes.ts)
   └─> router.post('/register', authController.register)
       ↓
3. CONTROLLER (authController.ts)
   ├─> Valida campos requeridos (name, lastName, age, email, password)
   ├─> Valida formato de email (regex)
   ├─> Valida formato de contraseña (min 8 chars, mayúscula, número, especial)
   ├─> Verifica que el email no exista (userDAO.findByEmail)
   └─> Llama a userDAO.create(userData)
       ↓
4. DAO (userDAO.ts → baseDAO.ts)
   ├─> userDAO.create() hashea la contraseña con bcrypt
   ├─> BaseDAO.create() ejecuta:
   │   └─> supabase.from('users').insert([payload]).select('*').single()
   └─> Retorna el usuario creado
       ↓
5. DATABASE (Supabase)
   ├─> Valida constraints (unique email, not null, check constraints)
   ├─> Inserta registro con valores por defecto (isDeleted: false, timestamps)
   └─> Retorna datos insertados
       ↓
6. RESPONSE
   └─> Status: 201 Created
       Body: { userId: "uuid" }
```

### Ejemplo 2: Recuperación de Contraseña

```
1. CLIENT
   └─> POST /api/auth/forgot-password
       Body: { email: "user@example.com" }
       ↓
2. CONTROLLER (authController.forgotPassword)
   ├─> Busca usuario por email (userDAO.findByEmail)
   ├─> Si no existe: retorna 202 (por seguridad, no revelar si existe)
   ├─> Genera jwtid único (random string)
   ├─> Crea JWT con userId y jwtid, expiración 1h
   └─> Guarda jwtid en DB (userDAO.updateResetPasswordJti)
       ↓
3. EXTERNAL SERVICE (resendService)
   ├─> Genera link: ${FRONTEND_URL}/reset-password?token=${resetToken}
   ├─> En desarrollo: envía a email verificado
   ├─> En producción: envía al email del usuario
   └─> Email: "Haz clic para restablecer tu contraseña"
       ↓
4. CLIENT (Usuario hace click en el link)
   └─> POST /api/auth/reset-password
       Body: { token: "jwt...", newPassword: "NewPass123!" }
       ↓
5. CONTROLLER (authController.resetPassword)
   ├─> Verifica JWT (jwt.verify)
   ├─> Busca usuario (userDAO.findById)
   ├─> Verifica que user.resetPasswordJti === decoded.jti
   ├─> Valida nueva contraseña (min 8, mayúscula, número, especial)
   ├─> Invalida el token (updateResetPasswordJti con "")
   └─> Actualiza contraseña hasheada (userDAO.updateById)
       ↓
6. RESPONSE
   └─> Status: 200 OK
       Body: { success: true, message: "Contraseña actualizada." }
```

### Ejemplo 3: Verificación de Autenticación

```
1. CLIENT
   └─> GET /api/auth/verify-auth
       Headers: Authorization: Bearer <token>  o  Cookie: access_token
       ↓
2. MIDDLEWARE (authenticateToken)
   ├─> Extrae token del header o cookie
   ├─> Verifica firma del JWT (jwt.verify)
   ├─> Verifica expiración
   ├─> Inyecta user.userId en req.user
   └─> Pasa al controlador
       ↓
3. CONTROLLER (authController.verifyAuth)
   ├─> Lee req.user.userId (inyectado por middleware)
   └─> Retorna información del usuario
       ↓
4. RESPONSE
   └─> Status: 200 OK
       Body: { success: true, user: { id: "uuid" } }
       // Si el token es inválido o expiró:
       // MIDDLEWARE → 401 Unauthorized: { message: "No autorizado." }
```

---

## 🎨 Patrones de Diseño

### 1. DAO Pattern (Data Access Object)

Abstrae y encapsula todo el acceso a la fuente de datos.

**Ventajas:**
- Separa la lógica de persistencia de la lógica de negocio
- Facilita el cambio de base de datos sin afectar otras capas
- Permite testing mediante mocks

**Implementación:**

```typescript
// Base genérico
class BaseDAO<Row, Insert, Update> {
  async create(payload: Insert): Promise<Row> { }
  async findById(id: string): Promise<Row> { }
  async list(params): Promise<Paginated<Row>> { }
  async updateById(id: string, payload: Update): Promise<Row> { }
  async deleteById(id: string): Promise<boolean> { }
}

// Implementación específica
class UserDAO extends BaseDAO<UserRow, UserInsert, UserUpdate> {
  constructor() {
    super('users'); // nombre de la tabla
  }

  // Métodos adicionales específicos de usuarios
  async findByEmail(email: string): Promise<UserRow | null> { }
}
```

### 2. Singleton Pattern

El cliente de Supabase se instancia una sola vez:

```typescript
// supabaseClient.ts
export const supabase = createClient(...); // Una sola instancia

// Uso en múltiples archivos
import { supabase } from './lib/supabaseClient';
```

### 3. MVC Pattern (Model-View-Controller)

Aunque no hay "vistas" (es una API), se sigue una variante:

- **Model:** `src/types/database.ts` (tipos de datos)
- **Controller:** `src/controllers/`
- **"View":** JSON responses

### 4. Middleware Pattern

Interceptan peticiones antes de llegar al controlador:

```typescript
app.use(express.json());          // Parse JSON
app.use('/api/users', userRoutes); // Routing
app.use(errorHandler);             // Error handling
```

---

## 📂 Estructura de Carpetas

```
src/
├── config/                   # 🔧 Configuración
│   ├── config.ts             # Variables de entorno centralizadas
│   └── server.ts             # Configuración de Express (CORS, cookies, middlewares)
│
├── controllers/              # 🎮 Controladores
│   ├── authController.ts     # Registro, login, logout, recuperación de contraseña, verificación
│   ├── cashRegisterController.ts # Gestión de caja (apertura, cierre, movimientos)
│   ├── membershipController.ts   # Operaciones de membresía (creación, renovación)
│   ├── membershipFreezeController.ts # Congelamiento temporal de membresías
│   ├── membershipPlanController.ts # Administración de planes de membresía
│   ├── paymentController.ts  # Registro y control de pagos de clientes
│   ├── productController.ts  # Control de stock y precios de productos
│   ├── supplierController.ts # Gestión de proveedores
│   ├── userController.ts     # Perfil, listados y eliminación lógica de usuarios
│   └── userPermissionController.ts # Asignación y control de permisos de usuario
│
├── dao/                      # 🗄️ Data Access Objects
│   ├── baseDAO.ts            # DAO genérico con operaciones CRUD y soft delete
│   ├── cashRegisterDAO.ts    # DAO para sesiones y movimientos de caja
│   ├── clientDAO.ts          # DAO para clientes del gimnasio/box
│   ├── membershipDAO.ts      # DAO para membresías de clientes
│   ├── membershipFreezeDAO.ts # DAO para congelamiento de membresías
│   ├── membershipPlanDAO.ts  # DAO para planes de membresía
│   ├── paymentDAO.ts         # DAO para pagos y splits
│   ├── productDAO.ts         # DAO para productos
│   ├── supplierDAO.ts        # DAO para proveedores
│   ├── userDAO.ts            # DAO específico de usuarios
│   └── userPermissionDAO.ts  # DAO para permisos de usuarios
│
├── jobs/                     # ⏰ Tareas Programadas (Cron Jobs)
│   └── cronJobs.ts           # Envío automático de notificaciones de pago y cumpleaños
│
├── lib/                      # 📚 Librerías externas
│   └── supabaseClient.ts     # Clientes de Supabase (tipado y genérico)
│
├── middleware/               # 🛡️ Middlewares
│   ├── auth.ts               # Autenticación JWT + rate limiting
│   ├── errorHandler.ts       # Manejo centralizado de errores
│   ├── logger.ts             # Registro de peticiones HTTP
│   └── notFound.ts           # Manejo de rutas 404
│
├── routes/                   # 🛣️ Definición de rutas
│   ├── index.ts              # Router principal (punto de entrada de endpoints)
│   ├── routes.ts             # Agrupador de rutas protegidas y públicas
│   ├── authRoutes.ts         # Rutas de autenticación (públicas)
│   ├── cashRegisterRoutes.ts # Rutas de caja (protegidas)
│   ├── membershipRoutes.ts   # Rutas de membresías (protegidas)
│   ├── paymentRoutes.ts      # Rutas de pagos (protegidas)
│   ├── productRoutes.ts      # Rutas de productos (protegidas)
│   ├── supplierRoutes.ts     # Rutas de proveedores (protegidas)
│   ├── testJobRoutes.ts      # Rutas de prueba para forzar ejecución de cron jobs (desarrollo)
│   ├── userPermissionRoutes.ts # Rutas de permisos de usuario
│   └── userRoutes.ts         # Rutas de usuarios (protegidas)
│
├── service/                  # 🌐 Servicios externos e integraciones
│   ├── resendService.ts      # Integración con la API de Resend para envío de emails
│   └── emailTemplates.ts     # Plantillas HTML responsivas para emails
│
├── types/                    # 🏷️ Tipos TypeScript compartidos
│   ├── database.ts           # Tipos de base de datos (Supabase) - Single Source of Truth
│   └── express.d.ts          # Extensiones para el objeto Request de Express (req.user)
│
└── server.ts                 # 🌐 Punto de entrada principal (Servidor HTTP + Init Cron Jobs)
```

---

## 🗄️ Base de Datos

### Tecnología: Supabase (PostgreSQL)

**Características:**
- Base de datos PostgreSQL gestionada
- Row Level Security (RLS)
- Realtime subscriptions
- API REST automática
- Storage para archivos

### Tipos de Base de Datos

Todos los tipos están centralizados en `src/types/database.ts` como **single source of truth**.

```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row:    { /* campos de la tabla */ };
        Insert: { /* campos requeridos para insert */ };
        Update: { /* campos opcionales para update */ };
      };
    };
  };
}

// Helper types exportados
export type UserRow    = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
```

**Ventajas:**
- ✅ Single source of truth
- ✅ Puede generarse automáticamente desde Supabase
- ✅ No hay duplicación de tipos
- ✅ Consistencia garantizada

### Esquema de Base de Datos

Las principales tablas del sistema en Supabase:

#### Tabla: `users`
| Columna          | Tipo      | Descripción                              |
|------------------|-----------|------------------------------------------|
| id               | UUID      | Clave Primaria (auto-generado)           |
| name             | VARCHAR   | Nombre del usuario del sistema           |
| email            | VARCHAR   | Email único (credencial de acceso)       |
| password         | VARCHAR   | Hash de contraseña (bcrypt)              |
| resetPasswordJti | VARCHAR   | ID único de token de restablecimiento    |
| is_deleted       | BOOLEAN   | Eliminación lógica                       |
| role             | UserRole  | Rol del usuario (admin, empleado, etc.)  |
| created_at       | TIMESTAMP | Fecha de registro                        |
| updated_at       | TIMESTAMP | Última actualización                    |

#### Tabla: `clients`
| Columna            | Tipo      | Descripción                              |
|--------------------|-----------|------------------------------------------|
| id                 | UUID      | Clave Primaria                           |
| first_name         | VARCHAR   | Nombre(s)                                |
| paternal_last_name | VARCHAR   | Apellido Paterno                         |
| maternal_last_name | VARCHAR   | Apellido Materno                         |
| email              | VARCHAR   | Correo electrónico del cliente           |
| phone              | VARCHAR   | Teléfono de contacto                     |
| birth_date         | DATE      | Fecha de cumpleaños                      |
| is_deleted         | BOOLEAN   | Eliminación lógica                       |

#### Tabla: `membership`
| Columna     | Tipo      | Descripción                              |
|-------------|-----------|------------------------------------------|
| id          | UUID      | Clave Primaria                           |
| customer_id | UUID      | Referencia al cliente                    |
| plan_id     | UUID      | Referencia al plan de membresía          |
| status      | VARCHAR   | Estado de la membresía (activa, etc.)    |
| start_date  | DATE      | Fecha de inicio                          |
| end_date    | DATE      | Fecha de vencimiento                     |
| is_deleted  | BOOLEAN   | Eliminación lógica                       |

#### Tabla: `payments`
| Columna      | Tipo      | Descripción                              |
|--------------|-----------|------------------------------------------|
| id           | INTEGER   | Clave Primaria                           |
| customer_id  | UUID      | Referencia al cliente                    |
| total_amount | NUMERIC   | Monto total pagado                       |
| created_at   | TIMESTAMP | Fecha de pago                            |

#### Tabla: `email_logs`
| Columna    | Tipo      | Descripción                              |
|------------|-----------|------------------------------------------|
| id         | UUID      | Clave Primaria                           |
| client_id  | UUID      | Cliente a quien se le envió el email     |
| email_type | VARCHAR   | Tipo (upcoming_payment, birthday, etc.)  |
| sent_at    | TIMESTAMP | Fecha de envío                           |

*Nota: Existen otras tablas adicionales como `membership_plans`, `membership_freeze`, `payment_splits`, `cash_register_sessions`, `cash_register_movements`, `products`, `suppliers` y `user_permissions` completamente tipadas.*

### Conexión

```typescript
// Dos clientes según necesidad:
// 1. Cliente tipado (para uso específico)
export const supabase = createClient<Database>(url, key);

// 2. Cliente genérico (para BaseDAO)
export const supabaseGeneric = createClient(url, key);
```

**¿Por qué dos clientes?**
- El cliente tipado requiere que las tablas estén definidas en `Database`
- El `BaseDAO` es genérico y trabaja con cualquier tabla
- Esto evita conflictos de tipos en TypeScript

---

## 🧠 Decisiones Técnicas

### 1. TypeScript sobre JavaScript

**Razón:** Type-safety, mejor DX, menos bugs en producción.

### 2. ESM (ES Modules) en lugar de CommonJS

**Configuración:**
- `"type": "module"` en `package.json`
- `moduleResolution: "Node"` en `tsconfig.json`

**Ventajas:**
- Estándar moderno de JavaScript
- Mejor tree-shaking
- Sintaxis import/export consistente

### 3. Email Service (Resend) para mensajería transaccional

**Razón:**
- Separa la lógica de integración con el proveedor de email
- Facilita el testing mediante mocks
- Permite cambiar de proveedor sin afectar controladores
- Centraliza configuración y plantillas de email

**Casos de uso:**
- Recuperación de contraseña (reset password link)
- Emails transaccionales generales

**Ventajas:**
- Un solo lugar para cambiar el proveedor de email
- Fácil mockear en tests
- Plantillas centralizadas en `emailTemplates.ts`

### 4. tsx en lugar de ts-node

**Razón:**
- `ts-node` tiene problemas con ESM
- `tsx` es más rápido y maneja ESM perfectamente
- No requiere extensiones `.js` en imports

### 5. Supabase sobre ORM tradicional

**Ventajas:**
- Backend-as-a-Service completo
- Cliente JavaScript nativo
- Realtime integrado
- Menos boilerplate que Prisma/TypeORM

**Trade-off:**
- Vendor lock-in (pero PostgreSQL estándar debajo)

### 6. DAO Pattern sobre Active Record

**Razón:**
- Mejor separación de responsabilidades
- Más fácil de testear (mocking)
- No mezcla lógica de negocio con persistencia

### 7. Tareas Programadas con Node-Cron

**Razón:**
- Automatiza notificaciones recurrentes sin intervención humana.
- Configuración en zona horaria local (`America/Bogota`).
- Idempotencia integrada mediante la tabla `email_logs` para evitar envíos múltiples el mismo día en caso de reinicios del servidor.

---

## 🔐 Seguridad

### Implementadas

✅ **Variables de entorno para secrets**  
✅ **CORS configurado** (múltiples orígenes, credentials habilitados)  
✅ **Express JSON body parser** (límite de 10mb)  
✅ **Hash de contraseñas** (bcrypt con 10 salt rounds)  
✅ **Rate limiting** (express-rate-limit en login: 3-5 intentos/5min)  
✅ **JWT authentication** (tokens con expiración de 24h)  
✅ **Validación de input** (validación manual en controllers)  
✅ **SQL injection prevention** (Supabase maneja prepared statements)  
✅ **Middleware de autenticación** (verifica JWT en rutas protegidas)  
✅ **Soft delete** (no elimina datos físicamente)  
✅ **Cookie seguras** (httpOnly, secure en producción, sameSite)

### Medidas de Seguridad Específicas

**Contraseñas:**
- Hash con bcrypt (10 salt rounds)
- Validación: mínimo 8 caracteres, mayúscula, minúscula, número, carácter especial
- Nunca retornadas en responses

**JWT:**
- Tokens firmados con secret seguro
- Expiración de 24h para access tokens
- Expiración de 1h para reset password tokens
- JTI (JWT ID) único para reset tokens (previene reutilización)

**Rate Limiting:**
- Login: 3-5 intentos por 5 minutos
- Skip en desarrollo para facilitar testing
- Headers estándar de rate limit incluidos

**CORS:**
- Lista blanca de orígenes permitidos
- Credentials habilitados para cookies
- En desarrollo: permite todos los orígenes

### Pendientes

⚠️ Helmet.js para headers de seguridad  
⚠️ Input sanitization (DOMPurify para contenido HTML)  
⚠️ CSRF protection  
⚠️ Refresh tokens (para sessions de larga duración)  
⚠️ Account lockout después de múltiples intentos fallidos

---

## 📊 Componentes Implementados

| Componente                    | Descripción                                                             | Estado          |
|-------------------------------|-------------------------------------------------------------------------|-----------------|
| **AuthController**            | Registro, login, logout, forgot/reset password, verify auth             | ✅ Implementado |
| **UserController**            | Perfil, listados de usuarios, actualización, soft delete                | ✅ Implementado |
| **MembershipController**      | Creación, listado y edición de membresías de clientes                   | ✅ Implementado |
| **MembershipFreezeController**| Congelamientos temporales e indefinidos de membresías                   | ✅ Implementado |
| **MembershipPlanController**  | CRUD de planes de membresía y asignación de precios                     | ✅ Implementado |
| **CashRegisterController**    | Control de aperturas, cierres e historial de caja                       | ✅ Implementado |
| **PaymentController**         | Registro de pagos y splits en múltiples métodos de pago                 | ✅ Implementado |
| **ProductController**         | Gestión de inventario de productos y stock                              | ✅ Implementado |
| **SupplierController**        | CRUD de proveedores asociados a productos                               | ✅ Implementado |
| **UserPermissionController**  | Gestión granular de permisos a usuarios                                 | ✅ Implementado |
| **BaseDAO**                   | CRUD genérico, paginación y soft delete sobre Supabase                  | ✅ Implementado |
| **UserDAO** / **ClientDAO**...| DAOs específicos que heredan del BaseDAO                                 | ✅ Implementado |
| **Auth Middleware**           | JWT verification, inyección de usuario + rate limiting                  | ✅ Implementado |
| **Error Handler**             | Manejo unificado de excepciones de DB, negocio y Express                | ✅ Implementado |
| **Logger Middleware**         | Logging de peticiones HTTP entrantes                                    | ✅ Implementado |
| **Resend Service**            | Integración de Resend para envío confiable de emails                    | ✅ Implementado |
| **Cron Jobs (Email)**         | Envío programado de cumpleaños y cobros (upcoming, due, overdue)         | ✅ Implementado |

---

## 📚 Recursos Adicionales

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Resend Documentation](https://resend.com/docs)
- [Node-cron Documentation](https://www.npmjs.com/package/node-cron)

---

**Última actualización:** Junio 2026  
**Versión de arquitectura:** 2.0  
**Estado:** Producción Ready (Módulos de Negocio Completos)

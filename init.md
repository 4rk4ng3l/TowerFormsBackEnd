# TowerFormsBackEnd - Documentacion del Proyecto

## Resumen Ejecutivo

**TowerFormsBackEnd** es un backend robusto para gestion de formularios offline-first, disenado para tecnicos de torres de telecomunicaciones. Implementa arquitectura hexagonal con patron CQRS, autenticacion JWT con RBAC, y sincronizacion bidireccional.

---

## 1. Tecnologias Principales

| Categoria | Tecnologia | Version |
|-----------|------------|---------|
| Runtime | Node.js | - |
| Framework | Express | 4.21.2 |
| Lenguaje | TypeScript | 5.7.2 |
| Base de Datos | PostgreSQL | >= 14 |
| ORM | Prisma | 5.22.0 |
| Autenticacion | JWT | 9.0.2 |
| Hash Passwords | bcryptjs | 2.4.3 |
| Inyeccion DI | tsyringe | 4.8.0 |
| Validacion | Zod | 3.24.1 |

---

## 2. Estructura del Proyecto

```
TowerFormsBackEnd/
├── src/
│   ├── application/              # Capa de aplicacion (CQRS)
│   │   ├── commands/             # Operaciones de escritura
│   │   │   ├── auth/            (login, register, refresh, logout)
│   │   │   ├── export/          (excel, images, packages)
│   │   │   ├── files/           (add-file-to-submission)
│   │   │   ├── forms/           (create-form)
│   │   │   ├── submissions/     (create, update, complete)
│   │   │   ├── sync/            (sync-submissions)
│   │   │   └── users/           (create, approve, change-password)
│   │   └── queries/              # Operaciones de lectura
│   │       ├── auth/            (get-current-user)
│   │       ├── export/          (get-submission-for-export)
│   │       ├── files/           (get-file)
│   │       ├── forms/           (get-form, list-forms)
│   │       ├── roles/           (list-roles)
│   │       ├── submissions/     (get, list)
│   │       ├── sync/            (get-pending-sync-data)
│   │       └── users/           (get, list, list-pending)
│   │
│   ├── domain/                   # Capa de dominio (logica pura)
│   │   ├── entities/            (13 entidades)
│   │   ├── value-objects/       (email, status, sync-status, role-type)
│   │   ├── repositories/        (interfaces/contratos)
│   │   ├── services/            (7 servicios de dominio)
│   │   └── events/              (eventos de dominio)
│   │
│   ├── infrastructure/           # Capa de infraestructura
│   │   ├── persistence/
│   │   │   └── postgresql/
│   │   │       ├── repositories/ (8 implementaciones)
│   │   │       └── connection.ts
│   │   └── http/
│   │       ├── controllers/     (9 controladores)
│   │       ├── routes/          (9 routers)
│   │       ├── middlewares/     (auth, validacion)
│   │       └── validation/      (esquemas Zod)
│   │
│   ├── shared/                   # Codigo compartido
│   │   ├── interfaces/          (ICommand, IQuery, IRepository)
│   │   ├── exceptions/          (excepciones personalizadas)
│   │   └── utils/               (Logger, Result)
│   │
│   └── main.ts                   # Entry point
│
├── prisma/
│   ├── schema.prisma             # Esquema de BD (13 modelos)
│   ├── seed.ts                   # Seeding de datos
│   └── seeds/                    # Archivos de seed
│
├── uploads/                      # Archivos subidos
├── dist/                         # Codigo compilado
├── package.json
├── tsconfig.json
├── .env / .env.production
└── ecosystem.config.js           # PM2 config
```

---

## 3. Arquitectura - Hexagonal + CQRS

```
┌─────────────────────────────────────────────────────────┐
│                APPLICATION LAYER (CQRS)                 │
│  Commands (Escritura)  ←→  Queries (Lectura)           │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│                    DOMAIN LAYER                         │
│  Entities │ Value Objects │ Services │ Repository Ports │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│              INFRASTRUCTURE LAYER                        │
│  PostgreSQL Repos │ HTTP Controllers │ File Storage     │
└─────────────────────────────────────────────────────────┘
```

### Patron CQRS

**Commands** (Escritura):
- `CreateSubmissionCommand` → `CreateSubmissionHandler`
- `LoginCommand` → `LoginHandler`
- `SyncSubmissionsCommand` → `SyncSubmissionsHandler`

**Queries** (Lectura):
- `GetSubmissionQuery` → `GetSubmissionHandler`
- `ListFormsQuery` → `ListFormsHandler`

### Path Aliases (tsconfig.json)

```json
{
  "@domain/*": "src/domain/*",
  "@application/*": "src/application/*",
  "@infrastructure/*": "src/infrastructure/*",
  "@shared/*": "src/shared/*"
}
```

---

## 4. Funcionalidades Principales

### A. Gestion de Formularios
- Crear formularios con multiples pasos
- Preguntas con tipos: text, multiple_choice, single_choice, number, date, file_upload
- Metadata schema flexible por formulario
- Versionamiento de formularios

### B. Envio de Respuestas (Submissions)
- Crear envios offline desde dispositivos moviles
- Completar formularios paso a paso
- Subir archivos/imagenes asociados
- Marcar como completado

### C. Sincronizacion Offline-First
- POST `/api/sync` - Sincronizar datos al servidor
- GET `/api/sync/pending` - Obtener datos pendientes
- GET `/api/sync/status` - Estado de sincronizacion
- Estados: pending → syncing → synced | failed

### D. Gestion de Inventario
- **InventoryEE**: Elementos en Estructura (Antenas, RRUs, MW)
- **InventoryEP**: Equipos en Piso (Cabinets, Generadores)
- Importable desde Excel

### E. Gestion de Sitios
- Tipos: GREENFIELD, ROOFTOP, POSTEVIA
- Ubicacion geografica (lat/lng)
- Datos tecnicos y contactos

### F. Exportacion de Datos
- Excel: Submisiones con respuestas estructuradas
- ZIP: Imagenes agrupadas por paso
- Package: Exportacion completa

### G. Autenticacion y Usuarios
- Registro con aprobacion requerida
- Login/Logout con JWT
- Refresh tokens
- RBAC (Role-Based Access Control)

---

## 5. Modelos de Datos (Prisma)

### Site
```prisma
- id (UUID)
- codigoTowernex (Unique) - "CO-ATL0031"
- codigoSitio - "ATL0031"
- name
- siteType (GREENFIELD, ROOFTOP, POSTEVIA)
- latitud, longitud
- direccion, regional
- contratistaOM, empresaAuditora, tecnicoEA
```

### Form
```prisma
- id (UUID)
- name, description
- siteId (FK, opcional)
- siteType
- version (default: 1)
- metadataSchema (JSON)
- sections (JSON)
- Relations: steps[], submissions[]
```

### FormStep
```prisma
- id (UUID)
- formId (FK)
- stepNumber
- title
- Relations: questions[], files[]
```

### Question
```prisma
- id (UUID)
- stepId (FK)
- questionText
- type (text, multiple_choice, single_choice, number, date, file_upload)
- options (JSON)
- isRequired
- orderNumber
- metadata (JSON)
```

### Submission
```prisma
- id (UUID)
- formId (FK)
- userId (FK, opcional)
- metadata (JSON)
- startedAt, completedAt
- syncStatus (pending, syncing, synced, failed)
- syncedAt
- Relations: answers[], files[]
```

### Answer
```prisma
- id (UUID)
- submissionId (FK)
- questionId (FK)
- answerValue (JSON)
- answerText
- answerComment
```

### File
```prisma
- id (UUID)
- submissionId (FK)
- stepId (FK)
- questionId (FK, opcional)
- localPath, remotePath
- fileName, fileSize, mimeType
- syncStatus
```

### User
```prisma
- id (UUID)
- email (Unique)
- passwordHash
- firstName, lastName
- status (PENDING_APPROVAL, ACTIVE, INACTIVE)
- roleId (FK)
- approvedAt, approvedBy
```

### Role & Permission
```prisma
Role: id, name, description, isSystem
Permission: id, resource, action, description
RolePermission: roleId, permissionId (many-to-many)
```

### InventoryEE & InventoryEP
```prisma
InventoryEE: idEE, tipoSoporte, tipoEE, situacion, modelo, fabricante,
             alturaAntena, azimut, epaM2, operadorPropietario...

InventoryEP: idEP, tipoPiso, ubicacionEquipo, estadoPiso,
             usoEP, superficieOcupada, dimensiones...
```

---

## 6. API Endpoints

### Health Check
```
GET /health → Estado del servidor
```

### Authentication (Publicas)
```
POST /api/auth/register   → Registrar usuario
POST /api/auth/login      → Login (retorna tokens)
POST /api/auth/refresh    → Renovar access token
POST /api/auth/logout     → Revocar refresh token
GET  /api/auth/me         → Usuario actual (autenticado)
```

### Forms (Autenticado)
```
POST /api/forms           → Crear formulario
GET  /api/forms           → Listar formularios
GET  /api/forms/:id       → Obtener formulario
```

### Submissions (Autenticado)
```
POST /api/submissions           → Crear envio
GET  /api/submissions           → Listar envios
GET  /api/submissions/:id       → Obtener envio
PUT  /api/submissions/:id       → Actualizar respuestas
PUT  /api/submissions/:id/complete → Completar envio
```

### Files (Autenticado)
```
POST /api/files/upload          → Subir archivo
GET  /api/files/:id             → Metadata del archivo
GET  /api/files/:id/download    → Descargar archivo
GET  /api/files/exports/:filename → Descargar exportacion
```

### Sync (Autenticado)
```
POST /api/sync                  → Sincronizar desde dispositivo
GET  /api/sync/pending          → Datos pendientes para dispositivo
GET  /api/sync/status           → Estado de sincronizacion
```

### Export (Autenticado)
```
GET /api/export/submissions/:id/excel           → Excel
GET /api/export/submissions/:id/images/step/:n  → ZIP imagenes
GET /api/export/submissions/:id/package         → Paquete completo
```

### Users (Autenticado)
```
POST /api/users                 → Crear usuario
GET  /api/users                 → Listar usuarios
GET  /api/users/:id             → Obtener usuario
GET  /api/users/pending         → Usuarios pendientes aprobacion
PUT  /api/users/:id/approve     → Aprobar usuario
PUT  /api/users/:id/password    → Cambiar contrasena
PUT  /api/users/:id/status      → Actualizar estado
```

### Roles (Autenticado)
```
GET /api/roles                  → Listar roles con permisos
```

### Sites (Autenticado)
```
GET  /api/sites                       → Listar sitios
POST /api/sites                       → Crear sitio
GET  /api/sites/:id                   → Obtener sitio
PUT  /api/sites/:id                   → Actualizar sitio
GET  /api/sites/:id/inventory/ee      → Inventario EE
GET  /api/sites/:id/inventory/ep      → Inventario EP
POST /api/sites/:id/inventory/ee      → Agregar elemento EE
POST /api/sites/:id/inventory/ep      → Agregar elemento EP
```

---

## 7. Autenticacion JWT + RBAC

### Access Token
- Tipo: JWT
- Expiracion: 7 dias (configurable)
- Payload: `{ userId, email, role, iat, exp }`
- Header: `Authorization: Bearer <token>`

### Refresh Token
- Tipo: UUID v4
- Expiracion: 30 dias
- Almacenamiento: Base de datos
- Revocable

### Roles del Sistema
- Admin
- Technician
- Consultant

### Estructura de Permisos
- **Recursos**: forms, submissions, users, files, sync, roles
- **Acciones**: read, create, update, delete, approve, change_password

### Middlewares
- `authenticate`: Verifica JWT y extrae payload
- `authorize(resource, action)`: Verifica permisos RBAC

---

## 8. Servicios de Dominio (7)

| Servicio | Proposito |
|----------|-----------|
| TokenService | Generacion/verificacion JWT |
| PasswordHashingService | Hash con bcryptjs |
| AuthorizationService | Verificacion de permisos |
| FormValidationService | Validacion de formularios |
| AnswerValidationService | Validacion de respuestas |
| ExcelGeneratorService | Generacion de Excel |
| ZipGeneratorService | Compresion ZIP |

---

## 9. Repositorios (8)

| Repositorio | Entidad |
|-------------|---------|
| UserRepository | User |
| FormRepository | Form, FormStep, Question |
| SubmissionRepository | Submission, Answer |
| FileRepository | File |
| RoleRepository | Role |
| PermissionRepository | Permission |
| RefreshTokenRepository | RefreshToken |
| SiteRepository | Site, InventoryEE, InventoryEP |

---

## 10. Configuracion

### Variables de Entorno (.env)
```env
NODE_ENV=development
PORT=3000
HOST=localhost

DATABASE_URL="postgresql://postgres:password@localhost:5432/forms_alexia"

JWT_SECRET=AlexiaForms2026
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

UPLOAD_DIR=./uploads
EXPORTS_DIR=./uploads/exports
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
LOG_LEVEL=debug
```

### Produccion (.env.production)
```env
HOST=0.0.0.0
BASE_URL=http://3.208.180.76:3000
UPLOAD_DIR=/var/www/towerforms/uploads
```

---

## 11. Scripts NPM

```bash
npm run dev              # Hot reload con tsx
npm run build            # Compilar TypeScript
npm run start            # Produccion
npm run test             # Tests con Jest
npm run lint             # Linting
npm run format           # Formateo Prettier

# Prisma
npm run migration:generate   # Generar migracion
npm run migration:run        # Ejecutar migraciones
npm run prisma:seed          # Seed de datos
npm run prisma:studio        # GUI de Prisma
```

---

## 12. Dependencias Principales

### Produccion
```json
{
  "@prisma/client": "^5.22.0",
  "express": "^4.21.2",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "tsyringe": "^4.8.0",
  "zod": "^3.24.1",
  "multer": "^1.4.5-lts.1",
  "exceljs": "^4.4.0",
  "archiver": "^7.0.1",
  "helmet": "^8.0.0",
  "cors": "^2.8.5",
  "uuid": "^11.0.5",
  "dotenv": "^16.4.7"
}
```

### Desarrollo
```json
{
  "prisma": "^5.22.0",
  "typescript": "^5.7.2",
  "tsx": "^4.19.2",
  "jest": "^29.7.0",
  "ts-jest": "^29.2.5",
  "eslint": "^9.17.0",
  "prettier": "^3.4.2"
}
```

---

## 13. Caracteristicas Avanzadas

### Offline-First
- Sincronizacion bidireccional
- Estado `syncStatus` en Submission y File
- Control de conflictos por timestamps

### Validacion Robusta
- Zod en capa HTTP
- Domain Services para logica de negocio
- JSON Schema en base de datos

### Exportacion Multiple
- Excel con respuestas estructuradas
- ZIP de imagenes por paso
- Paquete completo

### Manejo de Errores
- AuthenticationException
- AuthorizationException
- NotFoundException
- ValidationException
- Mapeo a codigos HTTP

### Seguridad
- Helmet para headers HTTP
- CORS configurable
- bcryptjs (salt rounds: 10)
- JWT con secret configurable

---

## 14. Metricas del Proyecto

| Metrica | Valor |
|---------|-------|
| Archivos TypeScript | 146 |
| Controladores | 9 |
| Entidades de dominio | 13 |
| Repositorios | 8 |
| Servicios de dominio | 7 |
| Commands | ~20 |
| Queries | ~15 |
| Endpoints API | 40+ |

---

## 15. Deployment

### PM2 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'towerforms-backend',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
```

### Comandos de Deploy
```bash
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 16. Base de Datos

### Motor
PostgreSQL >= 14

### Comandos Prisma
```bash
npx prisma generate      # Generar cliente
npx prisma migrate dev   # Desarrollo
npx prisma migrate deploy # Produccion
npx prisma db seed       # Seed
npx prisma studio        # GUI
```

### Indices Principales
- `users.email` - Busqueda por email
- `users.status` - Filtrado por estado
- `submissions.syncStatus` - Pendientes de sync
- `submissions.formId`, `submissions.userId`
- `files.syncStatus`
- `sites.codigoTowernex`, `sites.codigoSitio`

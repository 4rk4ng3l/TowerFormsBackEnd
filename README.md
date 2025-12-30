# FormsAlexia Backend

Backend API REST con arquitectura hexagonal, CQRS y principios SOLID.

## Arquitectura

### Capas

#### 1. Domain Layer (Capa de Dominio)
Contiene la lógica de negocio pura, independiente de frameworks:

- **Entities**: Objetos de negocio (Form, Submission, Question, Answer, Image)
- **Value Objects**: Objetos inmutables (QuestionType, SyncStatus, AnswerValue)
- **Repository Interfaces**: Contratos (puertos) para persistencia
- **Domain Services**: Lógica de dominio compleja (FormValidationService, AnswerValidationService)
- **Domain Events**: Eventos de negocio (SubmissionCreated, SubmissionSynced)

#### 2. Application Layer (Capa de Aplicación)
Orquesta los casos de uso usando CQRS:

- **Commands**: Operaciones de escritura (CreateForm, CreateSubmission, SyncSubmission)
- **Queries**: Operaciones de lectura (GetForm, ListForms, GetSubmission)
- **Handlers**: Implementan la lógica de cada comando/query
- **Services**: Servicios de aplicación (SyncService, ImageProcessingService)
- **Use Cases**: Orquestadores de flujos complejos

#### 3. Infrastructure Layer (Capa de Infraestructura)
Implementa los adaptadores (implementaciones concretas):

- **Persistence**: Repositorios PostgreSQL con Prisma
- **HTTP**: Controladores, rutas, middlewares
- **Storage**: Manejo de archivos (FileStorage)
- **Config**: Configuraciones de BD, servidor, etc.

#### 4. Shared Layer
Código compartido entre capas:

- **Interfaces**: ICommand, IQuery, IRepository
- **Exceptions**: Excepciones personalizadas
- **Utils**: Logger, Result

### Principios SOLID

1. **SRP**: Cada handler maneja un solo comando/query
2. **OCP**: Extensible mediante nuevos handlers sin modificar código existente
3. **LSP**: Implementaciones de repositorios intercambiables
4. **ISP**: Interfaces segregadas por responsabilidad
5. **DIP**: Application depende de interfaces del dominio

### CQRS Pattern

Separación de operaciones:
- **Commands**: Modifican estado (Create, Update, Delete)
- **Queries**: Solo lectura, sin efectos secundarios

## Instalación

### Requisitos
- Node.js >= 18
- PostgreSQL >= 14
- npm o yarn

### Pasos

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/forms_alexia"
PORT=3000
JWT_SECRET=your-secret-key
```

3. Generar cliente de Prisma:
```bash
npx prisma generate
```

4. Ejecutar migraciones:
```bash
npm run migration:generate
npm run migration:run
```

5. Iniciar servidor en desarrollo:
```bash
npm run dev
```

## Scripts Disponibles

- `npm run dev` - Inicia servidor en modo desarrollo con hot-reload
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia servidor de producción
- `npm test` - Ejecuta tests
- `npm run lint` - Ejecuta linter
- `npm run format` - Formatea código con Prettier
- `npm run migration:generate` - Genera migración de Prisma
- `npm run prisma:studio` - Abre Prisma Studio (UI para la BD)

## API Endpoints

### Health Check
```
GET /health
```

### Forms
```
POST   /api/forms       - Crear formulario
GET    /api/forms/:id   - Obtener formulario por ID
GET    /api/forms       - Listar todos los formularios
```

### Submissions (TODO)
```
POST   /api/submissions       - Crear envío
GET    /api/submissions/:id   - Obtener envío
GET    /api/submissions       - Listar envíos
```

### Sync (TODO)
```
POST   /api/sync              - Sincronizar datos offline
```

### Images (TODO)
```
POST   /api/images            - Subir imagen
GET    /api/images/:id        - Obtener imagen
```

## Ejemplo de Uso

### Crear un Formulario

```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Encuesta de Satisfacción",
    "description": "Formulario para medir satisfacción del cliente",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Información Personal",
        "questions": [
          {
            "questionText": "¿Cuál es tu nombre?",
            "type": "text",
            "isRequired": true,
            "orderNumber": 1
          },
          {
            "questionText": "¿Cómo nos conociste?",
            "type": "single_choice",
            "options": ["Redes sociales", "Recomendación", "Búsqueda web"],
            "isRequired": true,
            "orderNumber": 2
          }
        ]
      },
      {
        "stepNumber": 2,
        "title": "Satisfacción",
        "questions": [
          {
            "questionText": "¿Qué aspectos te gustaron?",
            "type": "multiple_choice",
            "options": ["Precio", "Calidad", "Atención", "Rapidez"],
            "isRequired": false,
            "orderNumber": 1
          }
        ]
      }
    ]
  }'
```

## Estructura de Directorios

```
backend/
├── src/
│   ├── application/
│   │   ├── commands/          # Commands y handlers (CQRS)
│   │   ├── queries/           # Queries y handlers (CQRS)
│   │   ├── services/          # Servicios de aplicación
│   │   └── use-cases/         # Casos de uso complejos
│   │
│   ├── domain/
│   │   ├── entities/          # Entidades de dominio
│   │   ├── value-objects/     # Value objects
│   │   ├── repositories/      # Interfaces de repositorios
│   │   ├── services/          # Servicios de dominio
│   │   └── events/            # Eventos de dominio
│   │
│   ├── infrastructure/
│   │   ├── persistence/       # Repositorios PostgreSQL
│   │   ├── http/              # Controllers, routes, middlewares
│   │   ├── storage/           # File storage
│   │   └── config/            # Configuraciones
│   │
│   ├── shared/
│   │   ├── interfaces/        # Interfaces compartidas
│   │   ├── exceptions/        # Excepciones personalizadas
│   │   └── utils/             # Utilidades (logger, result)
│   │
│   └── main.ts                # Entry point
│
├── prisma/
│   └── schema.prisma          # Esquema de BD
│
└── tests/                     # Tests unitarios e integración
```

## Próximos Pasos

1. Implementar repositorios de PostgreSQL completos
2. Completar todos los comandos y queries CQRS
3. Agregar validaciones con Zod
4. Implementar autenticación JWT
5. Agregar tests unitarios
6. Configurar CI/CD
7. Documentación con Swagger

## Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage
```

## Deployment

```bash
# Build para producción
npm run build

# Ejecutar en producción
NODE_ENV=production npm start
```

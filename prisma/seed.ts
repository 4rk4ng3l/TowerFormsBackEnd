import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Crear Roles
  console.log('Creating roles...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: {
      name: 'Administrador',
      description: 'Administrador del sistema con acceso total',
      isSystem: true,
    },
  });

  const technicianRole = await prisma.role.upsert({
    where: { name: 'Técnico de Campo' },
    update: {},
    create: {
      name: 'Técnico de Campo',
      description: 'Técnico que llena formularios en campo',
      isSystem: true,
    },
  });

  const consultantRole = await prisma.role.upsert({
    where: { name: 'Consultor' },
    update: {},
    create: {
      name: 'Consultor',
      description: 'Consultor con acceso de solo lectura a todos los submissions',
      isSystem: true,
    },
  });

  console.log('Roles created successfully');

  // Crear Permisos
  console.log('Creating permissions...');

  const permissions = [
    // Forms permissions
    { resource: 'forms', action: 'create', description: 'Crear formularios' },
    { resource: 'forms', action: 'read', description: 'Ver formularios' },
    { resource: 'forms', action: 'update', description: 'Editar formularios' },
    { resource: 'forms', action: 'delete', description: 'Eliminar formularios' },

    // Submissions permissions
    { resource: 'submissions', action: 'create', description: 'Crear submissions (llenar formularios)' },
    { resource: 'submissions', action: 'read', description: 'Ver submissions' },
    { resource: 'submissions', action: 'read_all', description: 'Ver todos los submissions de todos los usuarios' },
    { resource: 'submissions', action: 'read_own', description: 'Ver solo sus propios submissions' },
    { resource: 'submissions', action: 'update', description: 'Editar submissions' },
    { resource: 'submissions', action: 'delete', description: 'Eliminar submissions' },
    { resource: 'submissions', action: 'export', description: 'Exportar/descargar submissions' },

    // Users permissions
    { resource: 'users', action: 'create', description: 'Crear usuarios' },
    { resource: 'users', action: 'read', description: 'Ver usuarios' },
    { resource: 'users', action: 'update', description: 'Editar usuarios' },
    { resource: 'users', action: 'delete', description: 'Eliminar usuarios' },
    { resource: 'users', action: 'approve', description: 'Aprobar usuarios pendientes' },
    { resource: 'users', action: 'change_password', description: 'Cambiar contraseña de otros usuarios' },

    // Roles permissions
    { resource: 'roles', action: 'create', description: 'Crear roles' },
    { resource: 'roles', action: 'read', description: 'Ver roles' },
    { resource: 'roles', action: 'update', description: 'Editar roles' },
    { resource: 'roles', action: 'delete', description: 'Eliminar roles' },

    // Images permissions
    { resource: 'images', action: 'create', description: 'Subir imágenes' },
    { resource: 'images', action: 'read', description: 'Ver imágenes' },
    { resource: 'images', action: 'delete', description: 'Eliminar imágenes' },

    // Files permissions
    { resource: 'files', action: 'create', description: 'Subir archivos' },
    { resource: 'files', action: 'read', description: 'Ver archivos' },
    { resource: 'files', action: 'delete', description: 'Eliminar archivos' },

    // Sync permissions
    { resource: 'sync', action: 'read', description: 'Obtener datos pendientes de sincronización' },
    { resource: 'sync', action: 'write', description: 'Sincronizar datos desde dispositivo' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log(`${createdPermissions.length} permissions created successfully`);

  // Asignar permisos a roles
  console.log('Assigning permissions to roles...');

  // ADMINISTRADOR - Todos los permisos
  const adminPermissions = createdPermissions;
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`Assigned ${adminPermissions.length} permissions to Administrador role`);

  // TÉCNICO DE CAMPO - Solo permisos de lectura de forms, crear submissions, ver sus propios submissions
  const technicianPermissionNames = [
    { resource: 'forms', action: 'read' },
    { resource: 'submissions', action: 'create' },
    { resource: 'submissions', action: 'read_own' },
    { resource: 'images', action: 'create' },
    { resource: 'images', action: 'read' },
    { resource: 'files', action: 'create' },
    { resource: 'files', action: 'read' },
    { resource: 'sync', action: 'read' },
    { resource: 'sync', action: 'write' },
  ];

  for (const permName of technicianPermissionNames) {
    const permission = createdPermissions.find(
      (p) => p.resource === permName.resource && p.action === permName.action
    );
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: technicianRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: technicianRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(`Assigned ${technicianPermissionNames.length} permissions to Técnico de Campo role`);

  // CONSULTOR - Ver todos los submissions, exportar, ver forms
  const consultantPermissionNames = [
    { resource: 'forms', action: 'read' },
    { resource: 'submissions', action: 'read_all' },
    { resource: 'submissions', action: 'export' },
    { resource: 'images', action: 'read' },
  ];

  for (const permName of consultantPermissionNames) {
    const permission = createdPermissions.find(
      (p) => p.resource === permName.resource && p.action === permName.action
    );
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: consultantRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: consultantRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(`Assigned ${consultantPermissionNames.length} permissions to Consultor role`);

  // Crear usuario admin
  console.log('Creating admin user...');

  const passwordHash = await bcrypt.hash('admin', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'System',
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
      approvedAt: new Date(),
    },
  });

  console.log('Admin user created successfully');
  console.log('Email: admin@admin.com');
  console.log('Password: admin');

  // Crear formulario de Mantenimiento Preventivo
  console.log('Creating Maintenance Preventive Form...');

  // Delete existing maintenance form if it exists
  await prisma.form.deleteMany({
    where: { name: 'Mantenimiento Preventivo Torre' }
  });

  const maintenanceForm = await prisma.form.create({
    data: {
      name: 'Mantenimiento Preventivo Torre',
      description: 'Formulario para inspección y mantenimiento preventivo de torres de telecomunicaciones',
      version: 1,
      metadataSchema: {
        ubicacion: { type: 'text', required: true, label: 'Ubicación' },
        tipoSitio: {
          type: 'select',
          required: true,
          label: 'Tipo de Sitio',
          options: ['Greenfield', 'Rooftop', 'Monopolo', 'Autosoportada']
        },
        nombreTecnico: { type: 'text', required: true, label: 'Nombre del Técnico' },
        fechaInspeccion: { type: 'date', required: true, label: 'Fecha de Inspección' },
        horaInicio: { type: 'time', required: true, label: 'Hora de Inicio' },
        horaFin: { type: 'time', required: true, label: 'Hora de Finalización' }
      }
    }
  });

  // Paso 1: Acceso y Perímetro
  const step1 = await prisma.formStep.create({
    data: {
      formId: maintenanceForm.id,
      title: 'Acceso y Perímetro',
      stepNumber: 1,
      questions: {
        create: [
          {
            questionText: 'Estado del camino de acceso',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 1,
            options: ['Bueno', 'Regular', 'Malo', 'N/A']
          },
          {
            questionText: 'Estado de la cerca perimetral',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['Bueno', 'Regular', 'Malo', 'N/A']
          },
          {
            questionText: 'Estado de la puerta de acceso',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 3,
            options: ['Bueno', 'Regular', 'Malo', 'N/A']
          },
          {
            questionText: 'Fotografía del acceso',
            type: 'file_upload',
            isRequired: false,
            orderNumber: 4,
            metadata: { fileTypes: ['image/jpeg', 'image/png'], maxFileSize: 5242880 }
          }
        ]
      }
    }
  });

  // Paso 2: Puesta a Tierra
  const step2 = await prisma.formStep.create({
    data: {
      formId: maintenanceForm.id,
      title: 'Sistema de Puesta a Tierra',
      stepNumber: 2,
      questions: {
        create: [
          {
            questionText: 'Medición de resistencia de tierra (Ohms)',
            type: 'number',
            isRequired: true,
            orderNumber: 1,
            metadata: { unit: 'Ω', minValue: 0, maxValue: 25 }
          },
          {
            questionText: 'Estado de los conectores de tierra',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['Bueno', 'Regular', 'Malo', 'Oxidado']
          },
          {
            questionText: 'Estado del conductor de tierra',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 3,
            options: ['Bueno', 'Regular', 'Malo', 'Corroído']
          },
          {
            questionText: 'Fotografía del sistema de tierra',
            type: 'file_upload',
            isRequired: false,
            orderNumber: 4,
            metadata: { fileTypes: ['image/jpeg', 'image/png'], maxFileSize: 5242880 }
          }
        ]
      }
    }
  });

  // Paso 3: Estructura de la Torre
  const step3 = await prisma.formStep.create({
    data: {
      formId: maintenanceForm.id,
      title: 'Estructura de la Torre',
      stepNumber: 3,
      questions: {
        create: [
          {
            questionText: 'Estado general de la estructura',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 1,
            options: ['Bueno', 'Regular', 'Malo', 'Crítico']
          },
          {
            questionText: 'Presencia de corrosión',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['No', 'Leve', 'Moderada', 'Severa']
          },
          {
            questionText: 'Estado de pernos y tuercas (0-6m)',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 3,
            options: ['Bueno', 'Regular', 'Malo', 'Faltantes']
          },
          {
            questionText: 'Estado de pernos y tuercas (6-12m)',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 4,
            options: ['Bueno', 'Regular', 'Malo', 'Faltantes']
          },
          {
            questionText: 'Torque aplicado (N⋅m)',
            type: 'number',
            isRequired: false,
            orderNumber: 5,
            metadata: { unit: 'N⋅m', minValue: 0, maxValue: 1000 }
          },
          {
            questionText: 'Fotografías de la estructura',
            type: 'file_upload',
            isRequired: false,
            orderNumber: 6,
            metadata: { fileTypes: ['image/jpeg', 'image/png'], maxFileSize: 5242880 }
          }
        ]
      }
    }
  });

  // Paso 4: Seguridad y Salud en el Trabajo (SST)
  const step4 = await prisma.formStep.create({
    data: {
      formId: maintenanceForm.id,
      title: 'SST - Seguridad y Salud en el Trabajo',
      stepNumber: 4,
      questions: {
        create: [
          {
            questionText: 'Estado de la línea de vida',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 1,
            options: ['Bueno', 'Regular', 'Malo', 'No existe']
          },
          {
            questionText: 'Estado de señalización de seguridad',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['Bueno', 'Regular', 'Malo', 'Faltante']
          },
          {
            questionText: 'Elementos de protección personal verificados',
            type: 'multiple_choice',
            isRequired: true,
            orderNumber: 3,
            options: ['Casco', 'Arnés', 'Guantes', 'Calzado de seguridad', 'Lentes', 'Todos']
          },
          {
            questionText: 'Observaciones de seguridad',
            type: 'text',
            isRequired: false,
            orderNumber: 4,
            metadata: { placeholder: 'Ingrese observaciones adicionales sobre seguridad...' }
          }
        ]
      }
    }
  });

  // Paso 5: Inspección Final y Observaciones
  const step5 = await prisma.formStep.create({
    data: {
      formId: maintenanceForm.id,
      title: 'Inspección Final',
      stepNumber: 5,
      questions: {
        create: [
          {
            questionText: 'Control de plagas realizado',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 1,
            options: ['Sí', 'No', 'No aplica']
          },
          {
            questionText: 'Limpieza general realizada',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['Sí', 'No', 'Parcial']
          },
          {
            questionText: 'Estado general del sitio',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 3,
            options: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Crítico']
          },
          {
            questionText: 'Observaciones generales',
            type: 'text',
            isRequired: false,
            orderNumber: 4,
            metadata: { placeholder: 'Ingrese observaciones generales del mantenimiento...' }
          },
          {
            questionText: 'Evidencias fotográficas adicionales',
            type: 'file_upload',
            isRequired: false,
            orderNumber: 5,
            metadata: { fileTypes: ['image/jpeg', 'image/png', 'application/pdf'], maxFileSize: 10485760 }
          }
        ]
      }
    }
  });

  console.log('Maintenance Preventive Form created successfully');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

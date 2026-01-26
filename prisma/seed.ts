import { PrismaClient, UserStatus, SiteType } from '@prisma/client';
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
      siteType: SiteType.GREENFIELD,
      metadataSchema: {
        ubicacion: { type: 'text', required: true, label: 'Ubicación' },
        nombreTecnico: { type: 'text', required: true, label: 'Nombre del Técnico' },
        fechaInspeccion: { type: 'date', required: true, label: 'Fecha de Inspección' },
        horaInicio: { type: 'time', required: true, label: 'Hora de Inicio' },
        horaFin: { type: 'time', required: true, label: 'Hora de Finalización' }
      },
      sections: {
        security: { required: true, label: 'Seguridad SST' },
        inventory: { required: true, label: 'Inventario' },
        torque: { required: true, label: 'Torque' }
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

  // Crear formulario de Inspección Rooftop (sin torque)
  console.log('Creating Rooftop Inspection Form...');

  await prisma.form.deleteMany({
    where: { name: 'Inspección Rooftop' }
  });

  const rooftopForm = await prisma.form.create({
    data: {
      name: 'Inspección Rooftop',
      description: 'Formulario para inspección de sitios en azotea',
      version: 1,
      siteType: SiteType.ROOFTOP,
      metadataSchema: {
        ubicacion: { type: 'text', required: true, label: 'Ubicación' },
        nombreTecnico: { type: 'text', required: true, label: 'Nombre del Técnico' },
        fechaInspeccion: { type: 'date', required: true, label: 'Fecha de Inspección' }
      },
      sections: {
        security: { required: true, label: 'Seguridad SST' },
        inventory: { required: true, label: 'Inventario' },
        torque: { required: false }  // No aplica para rooftop
      }
    }
  });

  // Paso 1 para Rooftop: Acceso al Edificio
  await prisma.formStep.create({
    data: {
      formId: rooftopForm.id,
      title: 'Acceso al Edificio',
      stepNumber: 1,
      questions: {
        create: [
          {
            questionText: 'Estado del acceso al edificio',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 1,
            options: ['Bueno', 'Regular', 'Malo', 'Restringido']
          },
          {
            questionText: 'Estado de la escalera/ascensor',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['Bueno', 'Regular', 'Malo', 'N/A']
          },
          {
            questionText: 'Fotografía del acceso',
            type: 'file_upload',
            isRequired: false,
            orderNumber: 3,
            metadata: { fileTypes: ['image/jpeg', 'image/png'], maxFileSize: 5242880 }
          }
        ]
      }
    }
  });

  // Paso 2 para Rooftop: Inspección de Azotea
  await prisma.formStep.create({
    data: {
      formId: rooftopForm.id,
      title: 'Inspección de Azotea',
      stepNumber: 2,
      questions: {
        create: [
          {
            questionText: 'Estado de la superficie de la azotea',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 1,
            options: ['Bueno', 'Regular', 'Malo', 'Con filtraciones']
          },
          {
            questionText: 'Estado de los soportes de equipos',
            type: 'single_choice',
            isRequired: true,
            orderNumber: 2,
            options: ['Bueno', 'Regular', 'Malo', 'Corroído']
          },
          {
            questionText: 'Observaciones generales',
            type: 'text',
            isRequired: false,
            orderNumber: 3
          },
          {
            questionText: 'Fotografías de la azotea',
            type: 'file_upload',
            isRequired: false,
            orderNumber: 4,
            metadata: { fileTypes: ['image/jpeg', 'image/png'], maxFileSize: 5242880 }
          }
        ]
      }
    }
  });

  console.log('Rooftop Inspection Form created successfully');

  // =====================================================
  // SITIOS E INVENTARIO
  // =====================================================
  console.log('Creating sites and inventory...');

  // Datos de sitios extraídos del Excel
  const sitesData = [
    { codigoTowernex: "CO-ANT0051", codigoSitio: "ANT1044", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ANT0054", codigoSitio: "ANT7002", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ANT0112", codigoSitio: "ANT7133", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0001", codigoSitio: "ATL0007", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0002", codigoSitio: "ATL0013", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0003", codigoSitio: "ATL0088", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0004", codigoSitio: "ATL0117", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0006", codigoSitio: "ATL0165", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0007", codigoSitio: "ATL0174", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0008", codigoSitio: "ATL0187", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0009", codigoSitio: "ATL0192", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0010", codigoSitio: "ATL7002", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0011", codigoSitio: "ATL8106", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0012", codigoSitio: "BAR0003", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0013", codigoSitio: "BAR0004", contratistaOM: "IENERCOM", siteType: SiteType.ROOFTOP },
    { codigoTowernex: "CO-ATL0014", codigoSitio: "BAR0005", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0015", codigoSitio: "BAR0006", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0016", codigoSitio: "BAR0009", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0017", codigoSitio: "BAR0014", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
    { codigoTowernex: "CO-ATL0018", codigoSitio: "BAR0019", contratistaOM: "IENERCOM", siteType: SiteType.GREENFIELD },
  ];

  // Datos de equipos en piso extraídos del Excel
  const equipmentData = [
    { codigoTowernex: "CO-ANT0051", idEP: 1, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Indoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: "TP48200E", fabricante: "HUAWEI" },
    { codigoTowernex: "CO-ANT0051", idEP: 2, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Indoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: "TP48200E", fabricante: "HUAWEI" },
    { codigoTowernex: "CO-ANT0051", idEP: 3, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Indoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: "RACK OPTICO DMW", fabricante: "SIEMENS" },
    { codigoTowernex: "CO-ANT0051", idEP: 4, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Indoor", situacion: "Fuera de servicio", estadoPiso: "BUENO", modelo: "TP48200E", fabricante: "HUAWEI" },
    { codigoTowernex: "CO-ANT0054", idEP: 1, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: "CABAN SYSTEMS", fabricante: null },
    { codigoTowernex: "CO-ANT0112", idEP: 1, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: null, modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0001", idEP: 1, tipoPiso: null, ubicacionEquipo: null, situacion: "En servicio", estadoPiso: null, modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0002", idEP: 1, tipoPiso: "LOZA CONCRETO", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0002", idEP: 2, tipoPiso: "LOZA CONCRETO", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0003", idEP: 1, tipoPiso: "SILLETA(MONOPOLO)", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "Aceptable", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0004", idEP: 1, tipoPiso: "SOPORTE(TIPO RIEL)", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0006", idEP: 1, tipoPiso: "SOPORTE(TIPO RIEL)", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0007", idEP: 1, tipoPiso: "PLACA DE ENTREPISO", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0008", idEP: 1, tipoPiso: "PLATAFORMA", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0009", idEP: 1, tipoPiso: "PLATAFORMA", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0010", idEP: 1, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: null, modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0011", idEP: 1, tipoPiso: "GREENFIELD", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "ACEPTABLE", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0012", idEP: 1, tipoPiso: "BANCADA", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0013", idEP: 1, tipoPiso: "ROOFTOP", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0014", idEP: 1, tipoPiso: "REGLETA OUTDOOR", ubicacionEquipo: "Cabinet Outdoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0015", idEP: 1, tipoPiso: "SHELTER", ubicacionEquipo: "Cabinet Indoor", situacion: "En servicio", estadoPiso: "BUENO", modelo: null, fabricante: null },
    { codigoTowernex: "CO-ATL0016", idEP: 1, tipoPiso: "SHELTER", ubicacionEquipo: "Cabinet Indoor", situacion: "En servicio", estadoPiso: "ACEPTABLE", modelo: null, fabricante: null },
  ];

  // Limpiar sitios e inventario existentes
  await prisma.inventoryEP.deleteMany();
  await prisma.inventoryEE.deleteMany();
  await prisma.site.deleteMany();

  // Crear sitios
  const siteIdMap = new Map<string, string>();
  for (const site of sitesData) {
    const created = await prisma.site.create({
      data: {
        codigoTowernex: site.codigoTowernex,
        codigoSitio: site.codigoSitio,
        name: site.codigoTowernex,
        contratistaOM: site.contratistaOM,
        siteType: site.siteType,
        isActive: true,
      },
    });
    siteIdMap.set(site.codigoTowernex, created.id);
  }
  console.log(`${sitesData.length} sites created`);

  // Crear equipos en piso
  let epCreated = 0;
  for (const ep of equipmentData) {
    const siteId = siteIdMap.get(ep.codigoTowernex);
    if (!siteId) continue;

    await prisma.inventoryEP.create({
      data: {
        siteId,
        idEP: ep.idEP,
        tipoPiso: ep.tipoPiso,
        ubicacionEquipo: ep.ubicacionEquipo,
        situacion: ep.situacion,
        estadoPiso: ep.estadoPiso,
        modelo: ep.modelo,
        fabricante: ep.fabricante,
      },
    });
    epCreated++;
  }
  console.log(`${epCreated} inventory EP items created`);

  console.log('Sites and inventory created successfully');

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

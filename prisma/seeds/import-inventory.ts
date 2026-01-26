import { PrismaClient, SiteType } from '@prisma/client';
import ExcelJS from 'exceljs';
import path from 'path';

const prisma = new PrismaClient();

// Mapeo de tipos de sitio del Excel a enum
const mapSiteType = (tipo: string | null | undefined): SiteType => {
  if (!tipo) return SiteType.GREENFIELD;

  const tipoUpper = tipo.toUpperCase();

  if (tipoUpper.includes('ROOFTOP')) return SiteType.ROOFTOP;
  if (tipoUpper.includes('POSTE') || tipoUpper.includes('VIA')) return SiteType.POSTEVIA;

  return SiteType.GREENFIELD;
};

// Parsear valor decimal
const parseDecimal = (value: any): number | null => {
  if (value === null || value === undefined || value === '' || value === '-' || value === 'ND') {
    return null;
  }
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
};

// Parsear valor string
const parseString = (value: any): string | null => {
  if (value === null || value === undefined || value === '' || value === 'ND') {
    return null;
  }
  return String(value).trim();
};

async function importSitesFromEquiposPiso(workbook: ExcelJS.Workbook) {
  console.log('📍 Importando sitios desde EQUIPOS EN PISO...');

  const sheet = workbook.getWorksheet('EQUIPOS EN PISO');
  if (!sheet) {
    console.log('❌ Hoja EQUIPOS EN PISO no encontrada');
    return;
  }

  const sitesMap = new Map<string, any>();

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const codigoTowernex = parseString(row.getCell(3).value); // CODIGO TOWERNEX
    if (!codigoTowernex) return;

    // Solo agregar si no existe
    if (!sitesMap.has(codigoTowernex)) {
      sitesMap.set(codigoTowernex, {
        codigoTowernex,
        codIeneCombinado: parseString(row.getCell(1).value),
        codigoSitio: parseString(row.getCell(5).value),
        name: codigoTowernex, // Usar código como nombre por defecto
        contratistaOM: parseString(row.getCell(4).value),
        empresaAuditora: parseString(row.getCell(6).value),
        tecnicoEA: parseString(row.getCell(7).value),
        siteType: mapSiteType(parseString(row.getCell(9).value)), // Tipo de Piso
      });
    }
  });

  console.log(`   Encontrados ${sitesMap.size} sitios únicos`);

  // Insertar sitios
  for (const [codigo, siteData] of sitesMap) {
    try {
      await prisma.site.upsert({
        where: { codigoTowernex: codigo },
        update: {
          codIeneCombinado: siteData.codIeneCombinado,
          codigoSitio: siteData.codigoSitio,
          contratistaOM: siteData.contratistaOM,
          empresaAuditora: siteData.empresaAuditora,
          tecnicoEA: siteData.tecnicoEA,
        },
        create: siteData,
      });
    } catch (error) {
      console.log(`   ⚠️ Error insertando sitio ${codigo}:`, error);
    }
  }

  console.log(`   ✅ Sitios importados`);
}

async function importInventoryEP(workbook: ExcelJS.Workbook) {
  console.log('📦 Importando Inventario EP (Equipos en Piso)...');

  const sheet = workbook.getWorksheet('EQUIPOS EN PISO');
  if (!sheet) {
    console.log('❌ Hoja EQUIPOS EN PISO no encontrada');
    return;
  }

  let importedCount = 0;
  let errorCount = 0;

  sheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const codigoTowernex = parseString(row.getCell(3).value);
    const idEP = parseInt(String(row.getCell(2).value)) || 0;

    if (!codigoTowernex || idEP === 0) return;

    try {
      // Buscar el sitio
      const site = await prisma.site.findUnique({
        where: { codigoTowernex },
      });

      if (!site) {
        errorCount++;
        return;
      }

      await prisma.inventoryEP.upsert({
        where: {
          siteId_idEP: {
            siteId: site.id,
            idEP: idEP,
          },
        },
        update: {
          tipoPiso: parseString(row.getCell(9).value),
          ubicacionEquipo: parseString(row.getCell(10).value),
          situacion: parseString(row.getCell(11).value) || 'En servicio',
          estadoPiso: parseString(row.getCell(12).value),
          modelo: parseString(row.getCell(13).value),
          fabricante: parseString(row.getCell(14).value),
        },
        create: {
          siteId: site.id,
          idEP: idEP,
          tipoPiso: parseString(row.getCell(9).value),
          ubicacionEquipo: parseString(row.getCell(10).value),
          situacion: parseString(row.getCell(11).value) || 'En servicio',
          estadoPiso: parseString(row.getCell(12).value),
          modelo: parseString(row.getCell(13).value),
          fabricante: parseString(row.getCell(14).value),
        },
      });

      importedCount++;
    } catch (error) {
      errorCount++;
    }
  });

  // Esperar un momento para que las operaciones async terminen
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`   ✅ EP importados: ${importedCount}, errores: ${errorCount}`);
}

async function importInventoryEE(workbook: ExcelJS.Workbook) {
  console.log('📡 Importando Inventario EE (Elementos en Estructura)...');

  const sheet = workbook.getWorksheet('EQUIPOS EN ESTRUCTURA');
  if (!sheet) {
    console.log('⚠️ Hoja EQUIPOS EN ESTRUCTURA no encontrada, buscando alternativa...');

    // Intentar con otra hoja si existe
    const altSheet = workbook.getWorksheet('Inventario EE y EP');
    if (!altSheet) {
      console.log('❌ No se encontró hoja de inventario EE');
      return;
    }
  }

  // Por ahora solo log, implementar cuando tengamos la estructura exacta
  console.log('   ⚠️ Importación de EE pendiente de implementar con estructura específica');
}

async function main() {
  console.log('🚀 Iniciando importación de inventario desde Excel...\n');

  const excelPath = path.join(__dirname, '../../../Formato Mantenimiento Preventivo.xlsx');

  console.log(`📂 Leyendo archivo: ${excelPath}\n`);

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(excelPath);
  } catch (error) {
    console.log('❌ Error leyendo archivo Excel:', error);
    console.log('\n💡 Asegúrate de que el archivo existe en:', excelPath);
    return;
  }

  console.log('📋 Hojas encontradas:', workbook.worksheets.map(ws => ws.name).join(', '));
  console.log('');

  // 1. Importar sitios primero
  await importSitesFromEquiposPiso(workbook);

  // 2. Importar inventario EP
  await importInventoryEP(workbook);

  // 3. Importar inventario EE
  await importInventoryEE(workbook);

  console.log('\n✅ Importación completada');
}

main()
  .catch((e) => {
    console.error('❌ Error en importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

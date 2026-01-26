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
  if (typeof value === 'object') {
    if (value.text) return String(value.text).trim();
    if (value.result !== undefined) return String(value.result).trim();
    return null;
  }
  return String(value).trim();
};

interface SiteData {
  codigoTowernex: string;
  codIeneCombinado: string | null;
  codigoSitio: string | null;
  name: string;
  contratistaOM: string | null;
  empresaAuditora: string | null;
  tecnicoEA: string | null;
  siteType: SiteType;
}

interface InventoryEPData {
  codigoTowernex: string;
  idEP: number;
  tipoPiso: string | null;
  ubicacionEquipo: string | null;
  situacion: string;
  estadoPiso: string | null;
  modelo: string | null;
  fabricante: string | null;
}

async function importSitesAndInventory(excelPath: string) {
  console.log('🚀 Iniciando importación de inventario desde Excel...\n');
  console.log(`📂 Leyendo archivo: ${excelPath}\n`);

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(excelPath);
  } catch (error) {
    console.log('❌ Error leyendo archivo Excel:', error);
    return;
  }

  console.log('📋 Hojas encontradas:', workbook.worksheets.map(ws => ws.name).join(', '));
  console.log('');

  // =====================================================
  // PASO 1: Recolectar datos de sitios y equipos
  // =====================================================
  const sheet = workbook.getWorksheet('EQUIPOS EN PISO');
  if (!sheet) {
    console.log('❌ Hoja EQUIPOS EN PISO no encontrada');
    return;
  }

  const sitesMap = new Map<string, SiteData>();
  const inventoryEPList: InventoryEPData[] = [];

  console.log('📍 Analizando datos...');

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const codigoTowernex = parseString(row.getCell(3).value); // Columna C: CODIGO TOWERNEX
    if (!codigoTowernex) return;

    // Agregar sitio si no existe
    if (!sitesMap.has(codigoTowernex)) {
      sitesMap.set(codigoTowernex, {
        codigoTowernex,
        codIeneCombinado: parseString(row.getCell(1).value),
        codigoSitio: parseString(row.getCell(5).value),
        name: codigoTowernex,
        contratistaOM: parseString(row.getCell(4).value),
        empresaAuditora: parseString(row.getCell(6).value),
        tecnicoEA: parseString(row.getCell(7).value),
        siteType: mapSiteType(parseString(row.getCell(9).value)),
      });
    }

    // Agregar equipo EP
    const idEP = parseInt(String(row.getCell(2).value)) || 0;
    if (idEP > 0) {
      inventoryEPList.push({
        codigoTowernex,
        idEP,
        tipoPiso: parseString(row.getCell(9).value),
        ubicacionEquipo: parseString(row.getCell(10).value),
        situacion: parseString(row.getCell(11).value) || 'En servicio',
        estadoPiso: parseString(row.getCell(12).value),
        modelo: parseString(row.getCell(13).value),
        fabricante: parseString(row.getCell(14).value),
      });
    }
  });

  console.log(`   📍 Sitios únicos encontrados: ${sitesMap.size}`);
  console.log(`   📦 Equipos EP encontrados: ${inventoryEPList.length}`);
  console.log('');

  // =====================================================
  // PASO 2: Insertar sitios
  // =====================================================
  console.log('📍 Importando sitios...');

  let sitesCreated = 0;
  let sitesUpdated = 0;

  for (const [codigo, siteData] of sitesMap) {
    try {
      const existing = await prisma.site.findUnique({
        where: { codigoTowernex: codigo },
      });

      if (existing) {
        await prisma.site.update({
          where: { codigoTowernex: codigo },
          data: {
            codIeneCombinado: siteData.codIeneCombinado,
            codigoSitio: siteData.codigoSitio,
            contratistaOM: siteData.contratistaOM,
            empresaAuditora: siteData.empresaAuditora,
            tecnicoEA: siteData.tecnicoEA,
          },
        });
        sitesUpdated++;
      } else {
        await prisma.site.create({
          data: siteData,
        });
        sitesCreated++;
      }
    } catch (error: any) {
      console.log(`   ⚠️ Error con sitio ${codigo}: ${error.message}`);
    }
  }

  console.log(`   ✅ Sitios creados: ${sitesCreated}, actualizados: ${sitesUpdated}`);
  console.log('');

  // =====================================================
  // PASO 3: Insertar inventario EP
  // =====================================================
  console.log('📦 Importando inventario EP...');

  let epCreated = 0;
  let epUpdated = 0;
  let epErrors = 0;

  // Primero obtener todos los sitios para mapear códigos a IDs
  const allSites = await prisma.site.findMany();
  const siteIdMap = new Map(allSites.map(s => [s.codigoTowernex, s.id]));

  for (const ep of inventoryEPList) {
    const siteId = siteIdMap.get(ep.codigoTowernex);
    if (!siteId) {
      epErrors++;
      continue;
    }

    try {
      const existing = await prisma.inventoryEP.findUnique({
        where: {
          siteId_idEP: {
            siteId,
            idEP: ep.idEP,
          },
        },
      });

      if (existing) {
        await prisma.inventoryEP.update({
          where: { id: existing.id },
          data: {
            tipoPiso: ep.tipoPiso,
            ubicacionEquipo: ep.ubicacionEquipo,
            situacion: ep.situacion,
            estadoPiso: ep.estadoPiso,
            modelo: ep.modelo,
            fabricante: ep.fabricante,
          },
        });
        epUpdated++;
      } else {
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
    } catch (error: any) {
      epErrors++;
    }
  }

  console.log(`   ✅ EP creados: ${epCreated}, actualizados: ${epUpdated}, errores: ${epErrors}`);
  console.log('');

  // =====================================================
  // RESUMEN
  // =====================================================
  console.log('═══════════════════════════════════════════════');
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Sitios:     ${sitesCreated} creados, ${sitesUpdated} actualizados`);
  console.log(`   Equipos EP: ${epCreated} creados, ${epUpdated} actualizados`);
  console.log('═══════════════════════════════════════════════');
  console.log('\n✅ Importación completada');
}

// Ejecutar
const excelPath = process.argv[2] || '/home/usuario-hp/Desarrollos/Formato Mantenimiento Preventivo.xlsx';

importSitesAndInventory(excelPath)
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

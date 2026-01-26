import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { SiteRepository } from '@infrastructure/persistence/postgresql/repositories/site.repository';
import { SiteType } from '@prisma/client';
import { authenticate } from '../middlewares/authentication.middleware';

const router = Router();

// GET /api/sites - Obtener todos los sitios (opcionalmente filtrados por tipo)
router.get('/', authenticate, async (req: Request, res: Response) => {
  const siteRepository = container.resolve(SiteRepository);
  const { type } = req.query;

  let sites;

  if (type && Object.values(SiteType).includes(type as SiteType)) {
    sites = await siteRepository.findByType(type as SiteType);
  } else {
    sites = await siteRepository.findAll();
  }

  res.json({
    success: true,
    data: sites.map(site => ({
      id: site.id,
      codigoTowernex: site.codigoTowernex,
      codigoSitio: site.codigoSitio,
      name: site.name,
      siteType: site.siteType,
      latitud: site.latitud,
      longitud: site.longitud,
      direccion: site.direccion,
      regional: site.regional,
      contratistaOM: site.contratistaOM,
      empresaAuditora: site.empresaAuditora,
      tecnicoEA: site.tecnicoEA
    })),
    total: sites.length
  });
});

// GET /api/sites/:codigo - Obtener sitio por código
router.get('/:codigo', authenticate, async (req: Request, res: Response): Promise<void> => {
  const siteRepository = container.resolve(SiteRepository);
  const { codigo } = req.params;

  const site = await siteRepository.findByCode(codigo);

  if (!site) {
    res.status(404).json({
      success: false,
      error: { message: `Sitio con código '${codigo}' no encontrado` }
    });
    return;
  }

  res.json({
    success: true,
    data: site
  });
});

// GET /api/sites/:codigo/inventory - Obtener inventario completo del sitio
router.get('/:codigo/inventory', authenticate, async (req: Request, res: Response): Promise<void> => {
  const siteRepository = container.resolve(SiteRepository);
  const { codigo } = req.params;

  const site = await siteRepository.findByCode(codigo);

  if (!site) {
    res.status(404).json({
      success: false,
      error: { message: `Sitio con código '${codigo}' no encontrado` }
    });
    return;
  }

  const [inventoryEE, inventoryEP] = await Promise.all([
    siteRepository.findInventoryEEBySiteId(site.id),
    siteRepository.findInventoryEPBySiteId(site.id)
  ]);

  res.json({
    success: true,
    data: {
      site: {
        id: site.id,
        codigoTowernex: site.codigoTowernex,
        codigoSitio: site.codigoSitio,
        name: site.name,
        siteType: site.siteType,
        latitud: site.latitud,
        longitud: site.longitud,
        direccion: site.direccion,
        regional: site.regional
      },
      inventoryEE: inventoryEE.map(ee => ({
        id: ee.id,
        idEE: ee.idEE,
        tipoSoporte: ee.tipoSoporte,
        tipoEE: ee.tipoEE,
        situacion: ee.situacion,
        modelo: ee.modelo,
        fabricante: ee.fabricante,
        aristaCaraMastil: ee.aristaCaraMastil,
        operadorPropietario: ee.operadorPropietario,
        alturaAntena: ee.alturaAntena,
        azimut: ee.azimut,
        epaM2: ee.epaM2,
        usoCompartido: ee.usoCompartido,
        observaciones: ee.observaciones
      })),
      inventoryEP: inventoryEP.map(ep => ({
        id: ep.id,
        idEP: ep.idEP,
        tipoPiso: ep.tipoPiso,
        ubicacionEquipo: ep.ubicacionEquipo,
        situacion: ep.situacion,
        estadoPiso: ep.estadoPiso,
        modelo: ep.modelo,
        fabricante: ep.fabricante,
        usoEP: ep.usoEP,
        operadorPropietario: ep.operadorPropietario,
        dimensiones: {
          ancho: ep.ancho,
          profundidad: ep.profundidad,
          altura: ep.altura
        },
        superficieOcupada: ep.superficieOcupada,
        observaciones: ep.observaciones
      })),
      totals: {
        totalEE: inventoryEE.length,
        totalEP: inventoryEP.length
      }
    }
  });
});

// POST /api/sites/:codigo/inventory/ee - Agregar elemento a estructura
router.post('/:codigo/inventory/ee', authenticate, async (req: Request, res: Response): Promise<void> => {
  const siteRepository = container.resolve(SiteRepository);
  const { codigo } = req.params;

  const site = await siteRepository.findByCode(codigo);

  if (!site) {
    res.status(404).json({
      success: false,
      error: { message: `Sitio con código '${codigo}' no encontrado` }
    });
    return;
  }

  // Obtener el siguiente ID
  const existingEE = await siteRepository.findInventoryEEBySiteId(site.id);
  const nextIdEE = existingEE.length > 0
    ? Math.max(...existingEE.map(e => e.idEE)) + 1
    : 1;

  const newItem = await siteRepository.createInventoryEE({
    siteId: site.id,
    idEE: nextIdEE,
    tipoEE: req.body.tipoEE || 'ANTENA',
    tipoSoporte: req.body.tipoSoporte,
    situacion: req.body.situacion || 'En servicio',
    modelo: req.body.modelo,
    fabricante: req.body.fabricante,
    aristaCaraMastil: req.body.aristaCaraMastil,
    operadorPropietario: req.body.operadorPropietario,
    alturaAntena: req.body.alturaAntena,
    azimut: req.body.azimut,
    observaciones: req.body.observaciones
  });

  res.status(201).json({
    success: true,
    data: newItem
  });
});

// POST /api/sites/:codigo/inventory/ep - Agregar equipo en piso
router.post('/:codigo/inventory/ep', authenticate, async (req: Request, res: Response): Promise<void> => {
  const siteRepository = container.resolve(SiteRepository);
  const { codigo } = req.params;

  const site = await siteRepository.findByCode(codigo);

  if (!site) {
    res.status(404).json({
      success: false,
      error: { message: `Sitio con código '${codigo}' no encontrado` }
    });
    return;
  }

  // Obtener el siguiente ID
  const existingEP = await siteRepository.findInventoryEPBySiteId(site.id);
  const nextIdEP = existingEP.length > 0
    ? Math.max(...existingEP.map(e => e.idEP)) + 1
    : 1;

  const newItem = await siteRepository.createInventoryEP({
    siteId: site.id,
    idEP: nextIdEP,
    tipoPiso: req.body.tipoPiso,
    ubicacionEquipo: req.body.ubicacionEquipo,
    situacion: req.body.situacion || 'En servicio',
    estadoPiso: req.body.estadoPiso,
    modelo: req.body.modelo,
    fabricante: req.body.fabricante,
    usoEP: req.body.usoEP,
    operadorPropietario: req.body.operadorPropietario,
    ancho: req.body.ancho,
    profundidad: req.body.profundidad,
    altura: req.body.altura,
    observaciones: req.body.observaciones
  });

  res.status(201).json({
    success: true,
    data: newItem
  });
});

// PUT /api/sites/inventory/ee/:id - Actualizar elemento en estructura
router.put('/inventory/ee/:id', authenticate, async (req: Request, res: Response) => {
  const siteRepository = container.resolve(SiteRepository);
  const { id } = req.params;

  const updatedItem = await siteRepository.updateInventoryEE(id, req.body);

  res.json({
    success: true,
    data: updatedItem
  });
});

// PUT /api/sites/inventory/ep/:id - Actualizar equipo en piso
router.put('/inventory/ep/:id', authenticate, async (req: Request, res: Response) => {
  const siteRepository = container.resolve(SiteRepository);
  const { id } = req.params;

  const updatedItem = await siteRepository.updateInventoryEP(id, req.body);

  res.json({
    success: true,
    data: updatedItem
  });
});

export default router;

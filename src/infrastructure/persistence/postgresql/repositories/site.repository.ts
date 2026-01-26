import { injectable } from 'tsyringe';
import { PrismaClient, SiteType } from '@prisma/client';
import { ISiteRepository } from '@domain/repositories/site.repository.interface';
import { Site } from '@domain/entities/site.entity';
import { InventoryEE } from '@domain/entities/inventory-ee.entity';
import { InventoryEP } from '@domain/entities/inventory-ep.entity';

@injectable()
export class SiteRepository implements ISiteRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(): Promise<Site[]> {
    const sites = await this.prisma.site.findMany({
      where: { isActive: true },
      orderBy: { codigoTowernex: 'asc' }
    });

    return sites.map(s => this.toDomain(s));
  }

  async findByType(siteType: SiteType): Promise<Site[]> {
    const sites = await this.prisma.site.findMany({
      where: {
        siteType,
        isActive: true
      },
      orderBy: { codigoTowernex: 'asc' }
    });

    return sites.map(s => this.toDomain(s));
  }

  async findByCode(codigoTowernex: string): Promise<Site | null> {
    const site = await this.prisma.site.findUnique({
      where: { codigoTowernex }
    });

    return site ? this.toDomain(site) : null;
  }

  async findById(id: string): Promise<Site | null> {
    const site = await this.prisma.site.findUnique({
      where: { id }
    });

    return site ? this.toDomain(site) : null;
  }

  // ==================== Inventory EE ====================

  async findInventoryEEBySiteId(siteId: string): Promise<InventoryEE[]> {
    const items = await this.prisma.inventoryEE.findMany({
      where: { siteId },
      orderBy: { idEE: 'asc' }
    });

    return items.map(item => this.toInventoryEEDomain(item));
  }

  async createInventoryEE(data: Partial<InventoryEE>): Promise<InventoryEE> {
    const item = await this.prisma.inventoryEE.create({
      data: {
        siteId: data.siteId!,
        idEE: data.idEE!,
        tipoSoporte: data.tipoSoporte,
        tipoEE: data.tipoEE!,
        situacion: data.situacion || 'En servicio',
        situacionRRU: data.situacionRRU,
        modelo: data.modelo,
        fabricante: data.fabricante,
        tipoExposicionViento: data.tipoExposicionViento,
        aristaCaraMastil: data.aristaCaraMastil,
        operadorPropietario: data.operadorPropietario,
        alturaAntena: data.alturaAntena,
        diametro: data.diametro,
        largo: data.largo,
        ancho: data.ancho,
        fondo: data.fondo,
        azimut: data.azimut,
        epaM2: data.epaM2,
        usoCompartido: data.usoCompartido || false,
        sistemaMovil: data.sistemaMovil,
        observaciones: data.observaciones
      }
    });

    return this.toInventoryEEDomain(item);
  }

  async updateInventoryEE(id: string, data: Partial<InventoryEE>): Promise<InventoryEE> {
    const item = await this.prisma.inventoryEE.update({
      where: { id },
      data: {
        tipoSoporte: data.tipoSoporte,
        tipoEE: data.tipoEE,
        situacion: data.situacion,
        situacionRRU: data.situacionRRU,
        modelo: data.modelo,
        fabricante: data.fabricante,
        tipoExposicionViento: data.tipoExposicionViento,
        aristaCaraMastil: data.aristaCaraMastil,
        operadorPropietario: data.operadorPropietario,
        alturaAntena: data.alturaAntena,
        diametro: data.diametro,
        largo: data.largo,
        ancho: data.ancho,
        fondo: data.fondo,
        azimut: data.azimut,
        epaM2: data.epaM2,
        usoCompartido: data.usoCompartido,
        sistemaMovil: data.sistemaMovil,
        observaciones: data.observaciones
      }
    });

    return this.toInventoryEEDomain(item);
  }

  // ==================== Inventory EP ====================

  async findInventoryEPBySiteId(siteId: string): Promise<InventoryEP[]> {
    const items = await this.prisma.inventoryEP.findMany({
      where: { siteId },
      orderBy: { idEP: 'asc' }
    });

    return items.map(item => this.toInventoryEPDomain(item));
  }

  async createInventoryEP(data: Partial<InventoryEP>): Promise<InventoryEP> {
    const item = await this.prisma.inventoryEP.create({
      data: {
        siteId: data.siteId!,
        idEP: data.idEP!,
        tipoPiso: data.tipoPiso,
        ubicacionEquipo: data.ubicacionEquipo,
        situacion: data.situacion || 'En servicio',
        estadoPiso: data.estadoPiso,
        modelo: data.modelo,
        fabricante: data.fabricante,
        usoEP: data.usoEP,
        operadorPropietario: data.operadorPropietario,
        ancho: data.ancho,
        profundidad: data.profundidad,
        altura: data.altura,
        superficieOcupada: data.superficieOcupada,
        observaciones: data.observaciones
      }
    });

    return this.toInventoryEPDomain(item);
  }

  async updateInventoryEP(id: string, data: Partial<InventoryEP>): Promise<InventoryEP> {
    const item = await this.prisma.inventoryEP.update({
      where: { id },
      data: {
        tipoPiso: data.tipoPiso,
        ubicacionEquipo: data.ubicacionEquipo,
        situacion: data.situacion,
        estadoPiso: data.estadoPiso,
        modelo: data.modelo,
        fabricante: data.fabricante,
        usoEP: data.usoEP,
        operadorPropietario: data.operadorPropietario,
        ancho: data.ancho,
        profundidad: data.profundidad,
        altura: data.altura,
        superficieOcupada: data.superficieOcupada,
        observaciones: data.observaciones
      }
    });

    return this.toInventoryEPDomain(item);
  }

  // ==================== Mappers ====================

  private toDomain(data: any): Site {
    return new Site(
      data.id,
      data.codigoTowernex,
      data.codigoSitio,
      data.codIeneCombinado,
      data.name,
      data.siteType,
      data.latitud ? parseFloat(data.latitud.toString()) : null,
      data.longitud ? parseFloat(data.longitud.toString()) : null,
      data.direccion,
      data.regional,
      data.contratistaOM,
      data.empresaAuditora,
      data.tecnicoEA,
      data.isActive,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  private toInventoryEEDomain(data: any): InventoryEE {
    return new InventoryEE(
      data.id,
      data.siteId,
      data.idEE,
      data.tipoSoporte,
      data.tipoEE,
      data.situacion,
      data.situacionRRU,
      data.modelo,
      data.fabricante,
      data.tipoExposicionViento,
      data.aristaCaraMastil,
      data.operadorPropietario,
      data.alturaAntena ? parseFloat(data.alturaAntena.toString()) : null,
      data.diametro ? parseFloat(data.diametro.toString()) : null,
      data.largo ? parseFloat(data.largo.toString()) : null,
      data.ancho ? parseFloat(data.ancho.toString()) : null,
      data.fondo ? parseFloat(data.fondo.toString()) : null,
      data.azimut ? parseFloat(data.azimut.toString()) : null,
      data.epaM2 ? parseFloat(data.epaM2.toString()) : null,
      data.usoCompartido,
      data.sistemaMovil,
      data.observaciones,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  private toInventoryEPDomain(data: any): InventoryEP {
    return new InventoryEP(
      data.id,
      data.siteId,
      data.idEP,
      data.tipoPiso,
      data.ubicacionEquipo,
      data.situacion,
      data.estadoPiso,
      data.modelo,
      data.fabricante,
      data.usoEP,
      data.operadorPropietario,
      data.ancho ? parseFloat(data.ancho.toString()) : null,
      data.profundidad ? parseFloat(data.profundidad.toString()) : null,
      data.altura ? parseFloat(data.altura.toString()) : null,
      data.superficieOcupada ? parseFloat(data.superficieOcupada.toString()) : null,
      data.observaciones,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}

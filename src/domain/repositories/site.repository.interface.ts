import { Site } from '@domain/entities/site.entity';
import { InventoryEE } from '@domain/entities/inventory-ee.entity';
import { InventoryEP } from '@domain/entities/inventory-ep.entity';
import { SiteType } from '@prisma/client';

export interface ISiteRepository {
  findAll(): Promise<Site[]>;
  findByType(siteType: SiteType): Promise<Site[]>;
  findByCode(codigoTowernex: string): Promise<Site | null>;
  findById(id: string): Promise<Site | null>;

  // Inventory EE
  findInventoryEEBySiteId(siteId: string): Promise<InventoryEE[]>;
  createInventoryEE(data: Partial<InventoryEE>): Promise<InventoryEE>;
  updateInventoryEE(id: string, data: Partial<InventoryEE>): Promise<InventoryEE>;

  // Inventory EP
  findInventoryEPBySiteId(siteId: string): Promise<InventoryEP[]>;
  createInventoryEP(data: Partial<InventoryEP>): Promise<InventoryEP>;
  updateInventoryEP(id: string, data: Partial<InventoryEP>): Promise<InventoryEP>;
}

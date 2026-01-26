import { SiteType } from '@prisma/client';

export class Site {
  constructor(
    public readonly id: string,
    public readonly codigoTowernex: string,
    public readonly codigoSitio: string | null,
    public readonly codIeneCombinado: string | null,
    public readonly name: string,
    public readonly siteType: SiteType,
    public readonly latitud: number | null,
    public readonly longitud: number | null,
    public readonly direccion: string | null,
    public readonly regional: string | null,
    public readonly contratistaOM: string | null,
    public readonly empresaAuditora: string | null,
    public readonly tecnicoEA: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    codigoTowernex: string,
    name: string,
    siteType: SiteType
  ): Site {
    return new Site(
      id,
      codigoTowernex,
      null,
      null,
      name,
      siteType,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      true,
      new Date(),
      new Date()
    );
  }
}
